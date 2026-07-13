const https = require("https");
const fs = require("fs");
const path = require("path");

const envContent = fs.readFileSync(path.join(process.cwd(), ".env"), "utf8");
const match = envContent.match(/^\s*ANTHROPIC_API_KEY\s*=\s*(.*)\s*$/m);
const apiKey = match ? match[1].trim().replace(/['"]/g, "") : null;

const tryModel = (modelName) => {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: modelName,
      max_tokens: 100,
      messages: [{ role: "user", content: "Say Hello!" }]
    });

    const req = https.request({
      hostname: "api.anthropic.com",
      port: 443,
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      }
    }, res => {
      let responseData = "";
      res.on("data", chunk => responseData += chunk);
      res.on("end", () => {
        resolve({ model: modelName, status: res.statusCode, body: responseData });
      });
    });

    req.on("error", err => {
      resolve({ model: modelName, status: 0, body: err.message });
    });

    req.write(body);
    req.end();
  });
};

async function run() {
  const models = [
    "claude-3-5-sonnet-latest",
    "claude-3-5-sonnet-20241022",
    "claude-3-5-sonnet-20240620",
    "claude-3-haiku-20240307"
  ];
  for (const m of models) {
    const res = await tryModel(m);
    console.log(`Model: ${res.model} -> Status: ${res.status}`);
    console.log("Body:", res.body.substring(0, 200));
    console.log("-".repeat(40));
  }
}

run();
