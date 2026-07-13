# ==============================================================================
# OMNIGUARD ENTERPRISE - DEMO PRODUCTION CLOUD APPLICATION ARCHITECTURE
# ==============================================================================
# This Terraform configuration provisions a highly available web application 
# stack including ALB, Autoscaling Group, EKS, RDS, SQS queues, and S3 assets.
# It contains hidden architectural and configuration vulnerabilities to test 
# AST/Graph auditing controls.

provider "aws" {
  region = "us-east-1"
}

# ------------------------------------------------------------------------------
# 1. NETWORKING & SECURITY GROUPS (Hidden Ingress/Egress Exposure)
# ------------------------------------------------------------------------------

resource "aws_vpc" "main_prod" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = {
    Name = "production-vpc"
  }
}

resource "aws_security_group" "web_tier" {
  name        = "production-web-sg"
  description = "Security group for production frontends"
  vpc_id      = aws_vpc.main_prod.id

  # Ingress rule looks normal, but allows wide-open ingress on SSH port 22
  ingress {
    description = "Allow administrative SSH ingress"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # VULNERABILITY (OG-CLOUD-001) - SSH exposed publicly
  }

  ingress {
    description = "Allow HTTP load balancer traffic"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["10.0.1.0/24"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ------------------------------------------------------------------------------
# 2. S3 SECURE LEDGER ASSETS (Missing Public Access Block & Encryption)
# ------------------------------------------------------------------------------

resource "aws_s3_bucket" "secure_ledger" {
  bucket = "prod-enterprise-confidential-ledger-903"
  acl    = "public-read" # VULNERABILITY (OG-CLOUD-003) - Public S3 Access
  
  tags = {
    Classification = "Confidential"
  }
}

# Missing S3 Server Side Encryption resource (OG-CLOUD-002)
# Missing S3 Versioning Configuration resource (OG-CLOUD-004)
# Missing S3 Public Access Block association (OG-CLOUD-003)

# ------------------------------------------------------------------------------
# 3. IDENTITY AND ACCESS MANAGEMENT (IAM Wildcard Policy)
# ------------------------------------------------------------------------------

resource "aws_iam_role" "app_executor" {
  name = "production-app-executor-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "wildcard_permissions" {
  name = "app-executor-inline-policy"
  role = aws_iam_role.app_executor.id

  # VULNERABILITY (OG-CLOUD-005) - IAM administrative policy allowing Action "*" on Resource "*"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "*"
        Resource = "*"
      }
    ]
  })
}

# ------------------------------------------------------------------------------
# 4. SECURE DATA TIERS & LOGGING (Public RDS & Unencrypted EBS)
# ------------------------------------------------------------------------------

resource "aws_db_instance" "prod_database" {
  identifier           = "production-relational-ledger"
  allocated_storage    = 100
  db_name              = "master_ledger"
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = "db.r6g.large"
  username             = "root_admin"
  password             = "SuperSecretProdPassword123!" # Exceeds entropy (Layer 5 Secret)
  
  publicly_accessible  = true  # VULNERABILITY (OG-CLOUD-006) - RDS publicly accessible
  storage_encrypted    = false # VULNERABILITY (OG-CLOUD-011) - RDS storage encryption disabled
  
  skip_final_snapshot  = true
}

resource "aws_ebs_volume" "transaction_log" {
  availability_zone = "us-east-1a"
  size              = 500
  
  # VULNERABILITY (OG-CLOUD-007) - EBS volume encryption missing/disabled
  encrypted         = false 
  
  tags = {
    Name = "transaction-ledger-volume"
  }
}

# ------------------------------------------------------------------------------
# 5. ENTERPRISE INTEGRATION TIERS (Unencrypted SQS / KMS Rotation Disabled)
# ------------------------------------------------------------------------------

resource "aws_sqs_queue" "ledger_ingestion_queue" {
  name                      = "production-ledger-ingestion"
  delay_seconds             = 0
  max_message_size          = 262144
  message_retention_seconds = 86400
  
  # VULNERABILITY (OG-CLOUD-014) - SQS queue encryption missing/disabled
  sqs_managed_sse_enabled = false
}

resource "aws_kms_key" "app_storage_key" {
  description             = "KMS key for encrypting production transactions"
  deletion_window_in_days = 7
  
  # VULNERABILITY (OG-CLOUD-009) - KMS customer-managed key rotation disabled
  enable_key_rotation     = false
}
