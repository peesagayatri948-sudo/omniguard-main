const fs = require('fs');
const path = require('path');

console.log("\n=======================================================");
console.log("       AWS Marketplace Bundle Packaging & Validation  ");
console.log("=======================================================\n");

const mpDir = path.resolve(__dirname, '../aws-marketplace');
const requiredFiles = [
  'cloudformation-template.json',
  'pricing-template.json',
  'onboarding-instructions.md',
  'support-documentation.md',
  'usage-metering-hook.js',
  'license-validation.js',
  'listing-assets.json'
];

let allOk = true;
const checks = [];

if (!fs.existsSync(mpDir)) {
  console.error("✗ Marketplace directory 'aws-marketplace/' not found!");
  process.exit(1);
}

requiredFiles.forEach(file => {
  const full = path.join(mpDir, file);
  if (!fs.existsSync(full)) {
    console.error(`✗ Missing required asset: aws-marketplace/${file}`);
    allOk = false;
    checks.push({ file, status: "MISSING" });
  } else {
    // Basic verification based on type
    try {
      if (file.endsWith('.json')) {
        JSON.parse(fs.readFileSync(full, 'utf8'));
        console.log(`  ✓ verified: ${file} (valid JSON format)`);
      } else if (file.endsWith('.js')) {
        const content = fs.readFileSync(full, 'utf8');
        if (content.includes('require') || content.includes('module.exports')) {
          console.log(`  ✓ verified: ${file} (valid JS module exports found)`);
        } else {
          console.log(`  ⚠ warning: ${file} (JS file has no module.exports definitions)`);
        }
      } else {
        console.log(`  ✓ verified: ${file} (markdown documentation exists)`);
      }
      checks.push({ file, status: "VERIFIED" });
    } catch (e) {
      console.error(`  ✗ error parsing ${file}: ${e.message}`);
      allOk = false;
      checks.push({ file, status: "CORRUPTED" });
    }
  }
});

console.log("\n-------------------------------------------------------");
if (allOk) {
  console.log("\x1b[32m✓ ALL MARKETPLACE ASSETS VALIDATED SUCCESSFULLY!\x1b[0m");
  console.log("-------------------------------------------------------");
  console.log("Bundle is ready for packaging.");
  process.exit(0);
} else {
  console.error("\x1b[31m✗ BUNDLE VALIDATION FAILED! Address the errors above.\x1b[0m");
  console.log("-------------------------------------------------------");
  process.exit(1);
}
