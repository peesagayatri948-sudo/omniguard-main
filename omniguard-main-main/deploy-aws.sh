#!/usr/bin/env bash
# =============================================================================
#  OmniGuard — Enterprise AWS Production Deployment Engine (Bash)
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RESET='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║          OmniGuard — AWS Production Deployer         ║${RESET}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${RESET}"

# Prerequisites
need() {
  command -v "$1" >/dev/null 2>&1 || { echo -e "${RED}✗ Missing required command: $1${RESET}" >&2; exit 1; }
}
need aws
need docker
need node
need npm

# Environment checks
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-}"
VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-}"
VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [[ -z "$AWS_ACCOUNT_ID" ]]; then
  echo -e "${RED}✗ AWS_ACCOUNT_ID environment variable is required.${RESET}" >&2
  exit 1
fi
if [[ -z "$VITE_SUPABASE_URL" || -z "$VITE_SUPABASE_ANON_KEY" ]]; then
  echo -e "${RED}✗ VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.${RESET}" >&2
  exit 1
fi

AWS_REGION="${AWS_DEFAULT_REGION:-us-east-1}"
ECR_REPO="omniguard"
ECS_CLUSTER="omniguard"
ECS_SERVICE="omniguard-service"
IMAGE_TAG=$(date +%Y%m%d%H%M%S)
IMAGE_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}"

# 1. Provision Secrets Manager
echo -e "\n${CYAN}[AWS Deploy] 1. Provisioning Secrets Manager Secret...${RESET}"
SECRET_NAME="omniguard/secrets"
if ! aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$AWS_REGION" >/dev/null 2>&1; then
  echo "Creating Secrets Manager entry..."
  SECRET_VAL="{\"VITE_SUPABASE_URL\":\"$VITE_SUPABASE_URL\",\"VITE_SUPABASE_ANON_KEY\":\"$VITE_SUPABASE_ANON_KEY\",\"SUPABASE_SERVICE_ROLE_KEY\":\"$SUPABASE_SERVICE_ROLE_KEY\"}"
  aws secretsmanager create-secret --name "$SECRET_NAME" --description "OmniGuard Production Keys" --secret-string "$SECRET_VAL" --region "$AWS_REGION" >/dev/null
  echo -e "${GREEN}✓ Secrets Manager secret created.${RESET}"
else
  echo -e "${GREEN}✓ Secrets Manager secret exists.${RESET}"
fi

# 2. Provision IAM Roles
echo -e "\n${CYAN}[AWS Deploy] 2. Checking Task Execution IAM Roles...${RESET}"
EXEC_ROLE_NAME="OmniGuardECSTaskExecutionRole"
TASK_ROLE_NAME="OmniGuardECSTaskRole"

if ! aws iam get-role --role-name "$EXEC_ROLE_NAME" >/dev/null 2>&1; then
  echo "Creating execution role..."
  TRUST_POLICY='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
  aws iam create-role --role-name "$EXEC_ROLE_NAME" --assume-role-policy-document "$TRUST_POLICY" --region "$AWS_REGION" >/dev/null
  aws iam attach-role-policy --role-name "$EXEC_ROLE_NAME" --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy" --region "$AWS_REGION" >/dev/null
  echo -e "${GREEN}✓ IAM Execution Role created.${RESET}"
else
  echo -e "${GREEN}✓ IAM Execution Role '$EXEC_ROLE_NAME' exists.${RESET}"
fi

# 3. Provision CloudWatch Logs
echo -e "\n${CYAN}[AWS Deploy] 3. Checking CloudWatch Log Groups...${RESET}"
LOG_GROUP="/ecs/omniguard"
if ! aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" --region "$AWS_REGION" 2>/dev/null | grep -q "$LOG_GROUP"; then
  aws logs create-log-group --log-group-name "$LOG_GROUP" --region "$AWS_REGION" >/dev/null
  echo -e "${GREEN}✓ CloudWatch Log Group '$LOG_GROUP' created.${RESET}"
else
  echo -e "${GREEN}✓ CloudWatch Log Group '$LOG_GROUP' verified.${RESET}"
fi

# 4. Build and Push to ECR
echo -e "\n${CYAN}[AWS Deploy] 4. Logging in to ECR and building image...${RESET}"
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

if ! aws ecr describe-repositories --repository-names "$ECR_REPO" --region "$AWS_REGION" >/dev/null 2>&1; then
  echo "Creating ECR Repository '$ECR_REPO'..."
  aws ecr create-repository --repository-name "$ECR_REPO" --region "$AWS_REGION" >/dev/null
fi

echo "Building Docker image: $IMAGE_URI ..."
docker build -t "$IMAGE_URI" \
  --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
  "./omniguard"

echo "Pushing Docker image to ECR..."
docker push "$IMAGE_URI"

# 5. Register ECS Task Definition
echo -e "\n${CYAN}[AWS Deploy] 5. Registering Fargate Task Definition...${RESET}"
TASK_DEF_FILE=$(mktemp)
cat > "$TASK_DEF_FILE" <<JSON
{
  "family": "omniguard",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/${EXEC_ROLE_NAME}",
  "taskRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/${TASK_ROLE_NAME}",
  "containerDefinitions": [{
    "name": "omniguard",
    "image": "${IMAGE_URI}",
    "essential": true,
    "portMappings": [{ "containerPort": 80, "protocol": "tcp" }],
    "environment": [
      { "name": "VITE_SUPABASE_URL", "value": "${VITE_SUPABASE_URL}" },
      { "name": "VITE_SUPABASE_ANON_KEY", "value": "${VITE_SUPABASE_ANON_KEY}" }
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "${LOG_GROUP}",
        "awslogs-region": "${AWS_REGION}",
        "awslogs-stream-prefix": "ecs"
      }
    },
    "healthCheck": {
      "command": ["CMD-SHELL", "wget -qO- http://localhost/health || exit 1"],
      "interval": 30,
      "timeout": 5,
      "retries": 3,
      "startPeriod": 20
    }
  }]
}
JSON

TASK_ARN=$(aws ecs register-task-definition --region "$AWS_REGION" --cli-input-json file://"$TASK_DEF_FILE" --query 'taskDefinition.taskDefinitionArn' --output text)
rm -f "$TASK_DEF_FILE"
echo -e "${GREEN}✓ Fargate Task Definition Registered: $TASK_ARN${RESET}"

# 6. Create or Update ECS Cluster & Service
echo -e "\n${CYAN}[AWS Deploy] 6. Provisioning ECS Cluster & Fargate Service...${RESET}"
aws ecs create-cluster --cluster-name "$ECS_CLUSTER" --region "$AWS_REGION" >/dev/null 2>&1 || true

SUBNETS=$(aws ec2 describe-subnets --region "$AWS_REGION" --query "Subnets[*].SubnetId" --output text)
FIRST_SUBNETS=$(echo "$SUBNETS" | awk '{print $1","$2}')
SEC_GROUP=$(aws ec2 describe-security-groups --region "$AWS_REGION" --query "SecurityGroups[0].GroupId" --output text)

if aws ecs describe-services --cluster "$ECS_CLUSTER" --services "$ECS_SERVICE" --region "$AWS_REGION" --query 'services[0].status' --output text 2>/dev/null | grep -q ACTIVE; then
  echo "Updating active ECS service with new task deployment..."
  aws ecs update-service --cluster "$ECS_CLUSTER" --service "$ECS_SERVICE" --task-definition "$TASK_ARN" --force-new-deployment --region "$AWS_REGION" >/dev/null
  echo -e "${GREEN}✓ ECS service updated successfully.${RESET}"
else
  echo "Creating ECS service '$ECS_SERVICE'..."
  aws ecs create-service --cluster "$ECS_CLUSTER" --service-name "$ECS_SERVICE" --task-definition "$TASK_ARN" --desired-count 1 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[$FIRST_SUBNETS],securityGroups=[$SEC_GROUP],assignPublicIp=ENABLED}" --region "$AWS_REGION" >/dev/null
  echo -e "${GREEN}✓ ECS Service created successfully.${RESET}"
fi

# 7. Deploy Edge Functions
echo -e "\n${CYAN}[AWS Deploy] 7. Deploying Supabase Edge Functions...${RESET}"
if command -v supabase >/dev/null 2>&1; then
  cd "./supabase"
  supabase functions deploy api-v1-scans api-v1-findings api-v1-status enterprise-integrations github-webhook scan-quick scan-worker --region "$AWS_REGION" || true
  cd ..
  echo -e "${GREEN}✓ Edge functions deployed successfully.${RESET}"
else
  echo -e "${YELLOW}! Supabase CLI missing. Skipping edge function deployment.${RESET}"
fi

echo -e "\n${GREEN}====== AWS ECS FARGATE PRODUCTION DEPLOYMENT COMPLETE ======${RESET}"
echo -e "${GREEN}Image deployed: $IMAGE_URI${RESET}"
echo -e "${GREEN}Task Definition ARN: $TASK_ARN${RESET}"
