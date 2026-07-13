/**
 * AWS Secrets Manager Token Rotation Lambda for OmniGuard
 *
 * Implements the standard 4-step rotation lifecycle:
 * 1. createSecret: Generates a new API Key on OmniGuard and stashes it as PENDING.
 * 2. setSecret: Validates/configures the stashed key on target integrations if needed.
 * 3. testSecret: Verifies the connectivity of the stashed pending key.
 * 4. finishSecret: Promotes the pending key to current, retiring the old active key.
 */

const { SecretsManagerClient, GetSecretValueCommand, PutSecretValueCommand, UpdateSecretVersionStageCommand } = require("@aws-sdk/client-secrets-manager");
const https = require("https");

const smClient = new SecretsManagerClient({});

exports.handler = async (event) => {
  const arn = event.SecretId;
  const token = event.ClientRequestToken;
  const step = event.Step;

  console.log(`Starting rotation step: ${step} for secret: ${arn}`);

  // Retrieve current secret metadata
  switch (step) {
    case "createSecret":
      await createSecret(arn, token);
      break;
    case "setSecret":
      await setSecret(arn, token);
      break;
    case "testSecret":
      await testSecret(arn, token);
      break;
    case "finishSecret":
      await finishSecret(arn, token);
      break;
    default:
      throw new Error(`Invalid step: ${step}`);
  }

  return { status: "success", step };
};

// 1. Create Secret: Generate a new OmniGuard API Key and store it in Secrets Manager under AWSPENDING version stage
async function createSecret(arn, token) {
  // Get active configurations (Supabase URL, Anon Key)
  const activeSecret = await getSecretVersion(arn, "AWSCURRENT");
  const secretDict = JSON.parse(activeSecret);

  const supabaseUrl = secretDict.SUPABASE_URL || process.env.SUPABASE_URL;
  const orgId = secretDict.ORGANIZATION_ID;
  const userToken = secretDict.USER_TOKEN;

  if (!supabaseUrl || !orgId || !userToken) {
    throw new Error("Missing SUPABASE_URL, ORGANIZATION_ID, or USER_TOKEN in active secret config.");
  }

  // Generate new secure key prefix & suffix
  console.log("Requesting new API key from OmniGuard Edge Functions...");
  const newKey = await generateOmniGuardKey(supabaseUrl, orgId, userToken);

  // Stash new key in Secrets Manager under AWSPENDING
  const newSecretDict = { ...secretDict, OMNIGUARD_API_KEY: newKey };
  
  await smClient.send(new PutSecretValueCommand({
    SecretId: arn,
    ClientRequestToken: token,
    SecretString: JSON.stringify(newSecretDict),
    VersionStages: ["AWSPENDING"]
  }));
  console.log("Stashed pending key successfully.");
}

// 2. Set Secret: Propagate the secret to integrations if required (e.g. CI/CD runners, vault syncs)
async function setSecret(arn, token) {
  // No external DB migrations needed, we verify local configurations
  console.log("Bypassing database configurations - stashed key is active in database runtime.");
}

// 3. Test Secret: Validate connection parameters using the pending key
async function testSecret(arn, token) {
  const pendingSecret = await getSecretVersion(arn, "AWSPENDING");
  const secretDict = JSON.parse(pendingSecret);

  const supabaseUrl = secretDict.SUPABASE_URL || process.env.SUPABASE_URL;
  const apiKey = secretDict.OMNIGUARD_API_KEY;

  if (!apiKey) {
    throw new Error("Pending API key was not stashed.");
  }

  // Perform quick ping status check on Edge Functions using the pending key
  console.log("Testing connection using pending API key...");
  const isHealthy = await pingStatus(supabaseUrl, apiKey);
  if (!isHealthy) {
    throw new Error("Verification test failed: Status returned unhealthy.");
  }
  console.log("✓ Connection verified successfully.");
}

// 4. Finish Secret: Promote AWSPENDING to AWSCURRENT, retiring the old secret
async function finishSecret(arn, token) {
  console.log("Promoting pending key to active AWSCURRENT...");
  // AWS Secrets Manager automatically moves the AWSCURRENT tag to the pending version
  await smClient.send(new UpdateSecretVersionStageCommand({
    SecretId: arn,
    VersionStage: "AWSCURRENT",
    MoveToVersionId: token,
    RemoveFromVersionId: await getVersionId(arn, "AWSCURRENT")
  }));
  console.log("Rotation complete.");
}

// Helpers
async function getSecretVersion(arn, stage) {
  const response = await smClient.send(new GetSecretValueCommand({
    SecretId: arn,
    VersionStage: stage
  }));
  return response.SecretString;
}

async function getVersionId(arn, stage) {
  const response = await smClient.send(new GetSecretValueCommand({
    SecretId: arn,
    VersionStage: stage
  }));
  return response.VersionId;
}

function generateOmniGuardKey(url, orgId, userToken) {
  return new Promise((resolve, reject) => {
    const crypto = require("crypto");
    const plaintext = "og_live_" + crypto.randomBytes(24).toString("hex");
    const prefix = "og_live_" + plaintext.replace("og_live_", "").slice(0, 4);
    const hash = crypto.createHash("sha256").update(plaintext).digest("hex");

    const reqUrl = `${url.replace(/\/$/, "")}/rest/v1/api_keys`;
    const parsed = new URL(reqUrl);

    const body = JSON.stringify({
      organization_id: orgId,
      name: "AWS Rotated Key",
      key_prefix: prefix,
      key_hash: hash
    });

    const req = https.request({
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: {
        "Authorization": `Bearer ${userToken}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      }
    }, res => {
      if (res.statusCode >= 300) {
        reject(new Error(`Failed to insert API key in DB (status ${res.statusCode})`));
      } else {
        resolve(plaintext);
      }
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function pingStatus(url, key) {
  return new Promise((resolve) => {
    const statusUrl = `${url.replace(/\/$/, "")}/functions/v1/api-v1-status`;
    const parsed = new URL(statusUrl);

    const req = https.request({
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method: "GET",
      headers: {
        "Authorization": `Bearer ${key}`
      }
    }, res => {
      resolve(res.statusCode === 200);
    });

    req.on("error", () => resolve(false));
    req.end();
  });
}
