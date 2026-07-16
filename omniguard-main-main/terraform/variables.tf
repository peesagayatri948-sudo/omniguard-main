variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "The target AWS region to deploy OmniGuard Nexus production workloads"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Target deployment workspace tier environment"
}

variable "domain_name" {
  type        = string
  default     = "nexus.omniguard.io"
  description = "Fully Qualified Domain Name for application routing"
}

variable "db_password" {
  type        = string
  sensitive   = true
  description = "Master password for the RDS database instance"
}
