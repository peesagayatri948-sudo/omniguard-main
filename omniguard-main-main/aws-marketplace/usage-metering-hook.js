/**
 * AWS Marketplace Metering Integration Hook
 * Sends consumption telemetry (scans and active developers) to AWS Marketplace API.
 */
const { MarketplaceMeteringClient, MeterUsageCommand } = require("@aws-sdk/client-marketplace-metering");

const client = new MarketplaceMeteringClient({ region: process.env.AWS_DEFAULT_REGION || "us-east-1" });

/**
 * Report consumption event to AWS Marketplace.
 * @param {string} dimensionName Dimension key ('additional_scans' or 'active_developers')
 * @param {number} quantity Value to register
 * @param {string} productCode Registered Marketplace Product code
 */
async function reportUsage(dimensionName, quantity, productCode = "omniguard-sast-platform") {
  try {
    const command = new MeterUsageCommand({
      ProductCode: productCode,
      Timestamp: new Date(),
      UsageDimension: dimensionName,
      UsageQuantity: quantity,
      DryRun: process.env.NODE_ENV === "development"
    });

    const response = await client.send(command);
    console.log(`[AWS Marketplace Metering] Emitted ${quantity} units to '${dimensionName}'. Status: ${response.MeteringRecordId}`);
    return { success: true, recordId: response.MeteringRecordId };
  } catch (error) {
    console.error(`[AWS Marketplace Metering ERROR] Failed reporting usage for ${dimensionName}:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { reportUsage };
