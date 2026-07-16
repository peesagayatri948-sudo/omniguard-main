# =============================================================================
#  OmniGuard — Enterprise AWS Production Deployment Engine (PowerShell)
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          OmniGuard — AWS Production Deployer         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# ── Prerequisites Check ──
function Need-Cmd($cmd) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "✗ Missing required command: $cmd" -ForegroundColor Red
        exit 1
    }
}
Need-Cmd aws
Need-Cmd docker
Need-Cmd node
Need-Cmd npm

# ── Environment Checks ──
$awsAccountId = $env:AWS_ACCOUNT_ID
$supabaseUrl = $env:VITE_SUPABASE_URL
$supabaseAnonKey = $env:VITE_SUPABASE_ANON_KEY
$supabaseServiceKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $awsAccountId) {
    Write-Host "✗ env:AWS_ACCOUNT_ID is required for ECR registry mapping." -ForegroundColor Red
    exit 1
}
if (-not $supabaseUrl -or -not $supabaseAnonKey) {
    Write-Host "✗ env:VITE_SUPABASE_URL and env:VITE_SUPABASE_ANON_KEY are required for dashboard injection." -ForegroundColor Red
    exit 1
}

$region = if ($env:AWS_DEFAULT_REGION) { $env:AWS_DEFAULT_REGION } else { "us-east-1" }
$ecrRepo = "omniguard"
$ecsCluster = "omniguard"
$ecsService = "omniguard-service"
$imageTag = Get-Date -Format "yyyyMMddHHmmss"
$imageUri = "${awsAccountId}.dkr.ecr.${region}.amazonaws.com/${ecrRepo}:${imageTag}"

# ── 1. Provision Secrets Manager Secret ──
Write-Host "`n[AWS Deploy] 1. Provisioning Secrets Manager Secret..." -ForegroundColor Cyan
$secretName = "omniguard/secrets"
$secretExists = aws secretsmanager describe-secret --secret-id $secretName --region $region 2>$null
if ($null -eq $secretExists) {
    Write-Host "Creating Secrets Manager entry..." -ForegroundColor Gray
    $secretVal = @{
        VITE_SUPABASE_URL = $supabaseUrl
        VITE_SUPABASE_ANON_KEY = $supabaseAnonKey
        SUPABASE_SERVICE_ROLE_KEY = $supabaseServiceKey
    } | ConvertTo-Json -Compress
    aws secretsmanager create-secret --name $secretName --description "OmniGuard Production Keys" --secret-string $secretVal --region $region | Out-Null
    Write-Host "✓ Secrets Manager secret created." -ForegroundColor Green
} else {
    Write-Host "✓ Secrets Manager secret exists." -ForegroundColor Green
}

# ── 2. Provision IAM Roles ──
Write-Host "`n[AWS Deploy] 2. Checking Task Execution IAM Roles..." -ForegroundColor Cyan
# In production, creating IAM roles requires high permissions. We verify/create standard definitions.
$executionRoleName = "OmniGuardECSTaskExecutionRole"
$taskRoleName = "OmniGuardECSTaskRole"

# Assume roles are configured or attempt creation:
try {
    aws iam get-role --role-name $executionRoleName 2>$null | Out-Null
    Write-Host "✓ IAM Execution Role '$executionRoleName' exists." -ForegroundColor Green
} catch {
    Write-Host "Creating execution role..." -ForegroundColor Gray
    # IAM trust policy JSON
    $trustPolicy = '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
    aws iam create-role --role-name $executionRoleName --assume-role-policy-document $trustPolicy --region $region | Out-Null
    aws iam attach-role-policy --role-name $executionRoleName --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy" --region $region | Out-Null
    Write-Host "✓ IAM Execution Role created." -ForegroundColor Green
}

# ── 3. Provision CloudWatch Logs ──
Write-Host "`n[AWS Deploy] 3. Checking CloudWatch Log Groups..." -ForegroundColor Cyan
$logGroup = "/ecs/omniguard"
try {
    aws logs create-log-group --log-group-name $logGroup --region $region 2>$null | Out-Null
    Write-Host "✓ CloudWatch Log Group '$logGroup' created." -ForegroundColor Green
} catch {
    Write-Host "✓ CloudWatch Log Group '$logGroup' verified." -ForegroundColor Green
}

# ── 4. Build and Push Container to ECR ──
Write-Host "`n[AWS Deploy] 4. Logging in to ECR and building image..." -ForegroundColor Cyan
aws ecr get-login-password --region $region | docker login --username AWS --password-stdin "${awsAccountId}.dkr.ecr.${region}.amazonaws.com"

# Describe or Create ECR repository
try {
    aws ecr describe-repositories --repository-names $ecrRepo --region $region 2>$null | Out-Null
} catch {
    Write-Host "Creating ECR Repository '$ecrRepo'..." -ForegroundColor Gray
    aws ecr create-repository --repository-name $ecrRepo --region $region | Out-Null
}

Write-Host "Building Docker image: $imageUri ..." -ForegroundColor Gray
docker build -t $imageUri `
  --build-arg VITE_SUPABASE_URL="$supabaseUrl" `
  --build-arg VITE_SUPABASE_ANON_KEY="$supabaseAnonKey" `
  "./omniguard"

Write-Host "Pushing Docker image to ECR..." -ForegroundColor Gray
docker push $imageUri

# ── 5. Register ECS Task Definition ──
Write-Host "`n[AWS Deploy] 5. Registering Fargate Task Definition..." -ForegroundColor Cyan
$taskDef = @{
    family = "omniguard"
    networkMode = "awsvpc"
    requiresCompatibilities = @("FARGATE")
    cpu = "1024"
    memory = "2048"
    executionRoleArn = "arn:aws:iam::${awsAccountId}:role/${executionRoleName}"
    taskRoleArn = "arn:aws:iam::${awsAccountId}:role/${taskRoleName}"
    containerDefinitions = @(
        @{
            name = "omniguard"
            image = $imageUri
            essential = $true
            portMappings = @(
                @{
                    containerPort = 80
                    protocol = "tcp"
                }
            )
            environment = @(
                @{ name = "VITE_SUPABASE_URL"; value = $supabaseUrl }
                @{ name = "VITE_SUPABASE_ANON_KEY"; value = $supabaseAnonKey }
            )
            logConfiguration = @{
                logDriver = "awslogs"
                options = @{
                    "awslogs-group" = $logGroup
                    "awslogs-region" = $region
                    "awslogs-stream-prefix" = "ecs"
                }
            }
            healthCheck = @{
                command = @("CMD-SHELL", "wget -qO- http://localhost/health || exit 1")
                interval = 30
                timeout = 5
                retries = 3
                startPeriod = 20
            }
        }
    )
} | ConvertTo-Json -Depth 10

$tempTaskFile = [System.IO.Path]::GetTempFileName()
$taskDef | Out-File -FilePath $tempTaskFile -Encoding UTF8
$taskArn = aws ecs register-task-definition --region $region --cli-input-json "file://$tempTaskFile" --query 'taskDefinition.taskDefinitionArn' --output text
Remove-Item $tempTaskFile

Write-Host "✓ Fargate Task Definition Registered: $taskArn" -ForegroundColor Green

# ── 6. Create or Update ECS Fargate Service ──
Write-Host "`n[AWS Deploy] 6. Provisioning ECS Cluster & Fargate Service..." -ForegroundColor Cyan
try {
    aws ecs create-cluster --cluster-name $ecsCluster --region $region 2>$null | Out-Null
    Write-Host "✓ ECS Cluster '$ecsCluster' verified." -ForegroundColor Green
} catch {}

# Find VPC elements for Network Configuration
$subnets = aws ec2 describe-subnets --region $region --query "Subnets[*].SubnetId" --output text
$firstTwoSubnets = ($subnets -split "\s+")[0..1] -join ","
$securityGroups = aws ec2 describe-security-groups --region $region --query "SecurityGroups[0].GroupId" --output text

Write-Host "Configuring Fargate Networking (Subnets: $firstTwoSubnets, SecGroup: $securityGroups)..." -ForegroundColor Gray

# Check if Service exists
$serviceExists = aws ecs describe-services --cluster $ecsCluster --services $ecsService --region $region --query "services[0].status" --output text 2>$null
if ($serviceExists -eq "ACTIVE") {
    Write-Host "Updating active ECS service with new task deployment..." -ForegroundColor Gray
    aws ecs update-service --cluster $ecsCluster --service $ecsService --task-definition $taskArn --force-new-deployment --region $region | Out-Null
    Write-Host "✓ ECS service updated successfully." -ForegroundColor Green
} else {
    Write-Host "Creating ECS service '$ecsService'..." -ForegroundColor Gray
    # Create service
    aws ecs create-service --cluster $ecsCluster --service-name $ecsService --task-definition $taskArn --desired-count 1 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[$firstTwoSubnets],securityGroups=[$securityGroups],assignPublicIp=ENABLED}" --region $region | Out-Null
    Write-Host "✓ ECS Service created successfully." -ForegroundColor Green
}

# ── 7. Deploy Supabase Edge Functions ──
Write-Host "`n[AWS Deploy] 7. Deploying Supabase Edge Functions..." -ForegroundColor Cyan
if (Get-Command supabase -ErrorAction SilentlyContinue) {
    Push-Location "./supabase"
    try {
        supabase functions deploy api-v1-scans api-v1-findings api-v1-status enterprise-integrations github-webhook scan-quick scan-worker --region $region
        Write-Host "✓ Edge functions deployed successfully." -ForegroundColor Green
    } catch {
        Write-Warning "Could not deploy edge functions: $_"
    }
    Pop-Location
} else {
    Write-Host "! Supabase CLI missing. Skipping edge function deployment." -ForegroundColor Yellow
}

Write-Host "`n====== AWS ECS FARGATE PRODUCTION DEPLOYMENT COMPLETE ======" -ForegroundColor Green
Write-Host "Image deployed: $imageUri" -ForegroundColor Green
Write-Host "Task Definition ARN: $taskArn" -ForegroundColor Green
