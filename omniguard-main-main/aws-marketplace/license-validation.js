/**
 * AWS Marketplace Entitlement Integration Hook
 * Validates buyer entitlements for Contract-based subscriptions.
 */
const { MarketplaceEntitlementServiceClient, GetEntitlementsCommand } = require("@aws-sdk/client-marketplace-entitlement-service");

const client = new MarketplaceEntitlementServiceClient({ region: process.env.AWS_DEFAULT_REGION || "us-east-1" });

/**
 * Checks if the customer has an active entitlement license contract.
 * @param {string} customerIdentifier Buyer token identification
 * @param {string} productCode Registered Marketplace Product code
 */
async function checkEntitlement(customerIdentifier, productCode = "omniguard-sast-platform") {
  try {
    const command = new GetEntitlementsCommand({
      ProductCode: productCode,
      Filter: {
        CUSTOMER_IDENTIFIER: [customerIdentifier]
      }
    });

    const response = await client.send(command);
    const entitlements = response.Entitlements || [];
    
    if (entitlements.length === 0) {
      console.log(`[AWS Entitlement] Customer '${customerIdentifier}' has NO active subscription contracts.`);
      return { active: false, entitlements: [] };
    }

    // Verify expiration of contract
    const activeContracts = entitlements.filter(e => {
      const expiration = e.ExpirationDate ? new Date(e.ExpirationDate) : null;
      return !expiration || expiration > new Date();
    });

    const hasActiveContract = activeContracts.length > 0;
    console.log(`[AWS Entitlement] Verified subscription status for '${customerIdentifier}': ${hasActiveContract ? "ACTIVE" : "EXPIRED"}`);
    
    return { active: hasActiveContract, entitlements: activeContracts };
  } catch (error) {
    console.error("[AWS Entitlement ERROR] Verification API failure:", error.message);
    return { active: false, error: error.message };
  }
}

module.exports = { checkEntitlement };
