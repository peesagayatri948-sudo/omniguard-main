$claudeConfigDir = Join-Path $env:USERPROFILE ".claude.json"
$mcpServerPath = "E:\omniguard-enterprise\omniguard-main-main\cli\mcp-server.js"

$config = @{}
if (Test-Path $claudeConfigDir) {
    $config = Get-Content $claudeConfigDir -Raw | ConvertFrom-Json
} else {
    $config = New-Object PSObject
}

if (-not $config.psobject.properties.match("mcpServers").Count) {
    $config | Add-Member -MemberType NoteProperty -Name "mcpServers" -Value (New-Object PSObject)
}

$config.mcpServers | Add-Member -MemberType NoteProperty -Name "omniguard-mcp" -Value @{
    command = "node"
    args = @($mcpServerPath)
} -Force

$config | ConvertTo-Json -Depth 10 | Set-Content $claudeConfigDir
Write-Host "OmniGuard MCP Server registered successfully for Claude Code!"
