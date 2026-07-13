# OmniGuard Unified Build and Publication Script
$ErrorActionPreference = "Stop"

Write-Host "Publishing CLI Package to NPM..."
powershell -ExecutionPolicy Bypass -File .\publish-cli.ps1

Write-Host "Packaging VS Code Extension..."
cd vscode-extension

# Install and build
npm install
npm run compile

# Package extension
if (Test-Path "omniguard-2.1.1.vsix") {
    Remove-Item "omniguard-2.1.1.vsix"
}
npx vsce package --no-yarn --allow-missing-repository -o omniguard-2.1.1.vsix

# Return to root
cd ..

Write-Host "Building Final OmniGuard Enterprise Docker Container..."
docker build -t omniguard-enterprise:latest .

Write-Host "ALL PLATFORM RELEASES PACKAGED SUCCESSFULLY!"
