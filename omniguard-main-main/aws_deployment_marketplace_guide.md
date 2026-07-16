# ☁️ OmniGuard: AWS VPC Deployment & Marketplace Publishing Guide

This guide provides a comprehensive walkthrough for enterprise security teams to set up an AWS account, deploy the OmniGuard stack in a highly secure VPC (Virtual Private Cloud) environment, and publish the listing to the AWS Marketplace.

---

## 🔒 Part 1: Setting up a Secure AWS VPC & ECS Cluster

### 1. Networking Infrastructure (VPC)
For enterprise-grade security, deploy OmniGuard inside a custom VPC with isolated public and private subnets:
* **Public Subnets**: Houses the Application Load Balancers (ALB) and NAT Gateways.
* **Private Subnets**: Houses the container workloads (ECS Fargate running the React Frontend and Deno edge workers). No direct inbound access from the public internet.

#### Setup Steps:
1. Navigate to the **VPC Console** ➔ **Create VPC** ➔ **VPC and more**.
2. Select:
   * **CIDR Block**: `10.0.0.0/16`
   * **Number of Availability Zones**: `2` (for high availability)
   * **Public Subnets**: `2` (e.g. `10.0.1.0/24`, `10.0.2.0/24`)
   * **Private Subnets**: `2` (e.g. `10.0.11.0/24`, `10.0.12.0/24`)
   * **NAT Gateways**: `1 per AZ` (allocates Elastic IPs to route private container traffic safely to Supabase and LLM providers).

---

### 2. Deploying workloads on AWS ECS (Fargate)
Deploy the React dashboard container securely without managing EC2 servers:

1. **Build the Dashboard Image**:
   ```bash
   docker build -t omniguard-dashboard ./omniguard
   ```
2. **Push to Amazon ECR**:
   Create a repository in the Elastic Container Registry (ECR) and push your image:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com
   aws ecr create-repository --repository-name omniguard-dashboard
   docker tag omniguard-dashboard:latest <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/omniguard-dashboard:latest
   docker push <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/omniguard-dashboard:latest
   ```
3. **Task Definition Configuration**:
   Create an ECS Task Definition selecting **Fargate** as the launch type:
   * Map port `80` to the container port.
   * Provide variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment configurations.
4. **Create ECS Service**:
   Run the task definition as a Service inside the **Private Subnets** of your VPC. Bind the service to an AWS Application Load Balancer (ALB) in the **Public Subnets** to handle inbound user traffic safely.

---

## 🛒 Part 2: Registering & Publishing to AWS Marketplace

To distribute OmniGuard to other enterprises via the AWS Marketplace, follow these steps:

### 1. Register as an AWS Marketplace Seller
1. Navigate to the **AWS Marketplace Management Portal (AMMP)**: https://aws.amazon.com/marketplace/management/
2. Log in with your corporate AWS account.
3. Complete the **Seller Profile** form:
   * Enter bank details (for collecting subscription payouts).
   * Submit tax configuration profiles (W-8 / W-9).

---

### 2. Formulate the Marketplace Bundle
The repository includes a pre-configured marketplace manifest directory inside `aws-marketplace/`:
* [cloudformation-template.json](file:///E:/omniguard-enterprise/omniguard-main-main/aws-marketplace/cloudformation-template.json): Provisions VPC, ECR, Load Balancer, and task definitions automatically for subscribers.
* [pricing-template.json](file:///E:/omniguard-enterprise/omniguard-main-main/aws-marketplace/pricing-template.json): Configures the licensing matrix (e.g. Contract, Pay-as-you-go per seat scanned).
* [license-validation.js](file:///E:/omniguard-enterprise/omniguard-main-main/aws-marketplace/license-validation.js): AWS marketplace SaaS integration script checking contract entitlements.

#### Run Package Script:
Package the marketplace bundle assets for upload:
```powershell
# Packages the /aws-marketplace folder files into omniguard-aws-marketplace-bundle.zip
.\publish-aws-marketplace.ps1
```

---

### 3. Create the SaaS Product Listing
1. In the **AWS Marketplace Management Portal**, go to **Products** ➔ **SaaS** ➔ **Create SaaS Product**.
2. Fill in the listing details:
   * **Product Title**: *OmniGuard Enterprise Developer Security Platform*
   * **Short Description**: *AI-native continuous security scanning, Git-hook commit blocking, and auto-remediations.*
3. Configure **Pricing and Contracts**:
   * Link your pricing dimensions to the AWS Marketplace SaaS Metering API.
4. Submit the generated `omniguard-aws-marketplace-bundle.zip` (containing the CloudFormation and license hooks) through the APN Seller Portal.
5. AWS will validate your templates and launch your SaaS product page. Subscribers can now launch OmniGuard directly into their own AWS VPCs with one click!

---

## 💻 Part 3: Running the CLI Locally (For Team Members)

For local setup without using `.env` files:

1. **Install CLI Executable**:
   ```bash
   npm install -g @omniguard/cli
   ```
2. **Setup AI Providers Directly via CLI**:
   Team members configure their own personal or org keys directly in the CLI encrypted profile (stores to `~/.omniguard/config.json`). No local `.env` is required:
   ```bash
   # Set up personal Anthropic Claude Key
   omniguard provider add anthropic key=sk-ant-api03-...
   
   # Or set up AWS Bedrock Access Key
   omniguard provider add bedrock key=AKIAIOSFODNN7EXAMPLE secret=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY region=us-east-1
   
   # Set the active default provider
   omniguard provider default bedrock
   ```
3. **Monitor AI Token & Spend Usage**:
   Verify your personal scan API counts, latency, and estimated token spend:
   ```bash
   omniguard usage-check
   ```
