# Azure Deployment Module for OmniGuard Enterprise Self-Hosted Setup
# Provisions Azure Container Apps, Azure Database for PostgreSQL, and secure VNet.

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

variable "location" {
  type        = string
  default     = "East US"
  description = "Azure Region for deployment"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Deployment environment name"
}

# Resource Group
resource "azurerm_resource_group" "nexus" {
  name     = "rg-omniguard-nexus-${var.environment}"
  location = var.location
}

# Virtual Network & Subnets
resource "azurerm_virtual_network" "nexus" {
  name                = "vnet-omniguard-nexus"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.nexus.location
  resource_group_name = azurerm_resource_group.nexus.name
}

resource "azurerm_subnet" "db" {
  name                 = "snet-db-private"
  resource_group_name  = azurerm_resource_group.nexus.name
  virtual_network_name = azurerm_virtual_network.nexus.name
  address_prefixes     = ["10.0.1.0/24"]
  delegation {
    name = "fs"
    service_delegation {
      name    = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
}

resource "azurerm_subnet" "apps" {
  name                 = "snet-apps-ingress"
  resource_group_name  = azurerm_resource_group.nexus.name
  virtual_network_name = azurerm_virtual_network.nexus.name
  address_prefixes     = ["10.0.2.0/24"]
}

# Container App Environment
resource "azurerm_container_app_environment" "nexus" {
  name                       = "cae-omniguard-nexus"
  location                   = azurerm_resource_group.nexus.location
  resource_group_name        = azurerm_resource_group.nexus.name
  infrastructure_subnet_id   = azurerm_subnet.apps.id
}

# Container App Service (Dashboard & Daemon)
resource "azurerm_container_app" "omniguard" {
  name                         = "ca-omniguard-service"
  container_app_environment_id = azurerm_container_app_environment.nexus.id
  resource_group_name          = azurerm_resource_group.nexus.name
  revision_mode                = "Single"

  template {
    container {
      name   = "omniguard-app"
      image  = "omniguard-enterprise:latest"
      cpu    = "0.5"
      memory = "1.0Gi"

      env {
        name  = "NODE_ENV"
        value = var.environment
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 5173
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}

output "container_app_url" {
  value       = azurerm_container_app.omniguard.ingress[0].fqdn
  description = "Fully Qualified Domain Name of the deployed OmniGuard service"
}
