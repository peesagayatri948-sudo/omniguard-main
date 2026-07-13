# OmniGuard Post-Purchase Customer Onboarding Guide

Congratulations on provisioning OmniGuard Enterprise from the AWS Marketplace! 

Follow these steps to initialize and onboard your organization.

## Step 1: Initialize Supabase Cloud Services
OmniGuard utilizes Supabase as its primary backend and database storage engine.
1. Sign in to your Supabase account (https://supabase.com).
2. Create a new Supabase project or locate your active Supabase database reference.
3. Access your Supabase API keys via **Project Settings > API**:
   - `VITE_SUPABASE_URL` (API URL)
   - `VITE_SUPABASE_ANON_KEY` (anon public key)
   - `SUPABASE_SERVICE_ROLE_KEY` (service role key for backend orchestrations)

## Step 2: Deploy Cloud Infrastructure
Deploy the CloudFormation template `cloudformation-template.json` in your AWS region to provision the ECS cluster, secrets management, and log groups.
- Pass your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` parameters during CloudFormation initialization.

## Step 3: CLI Initialization
Once the containers are running, install the CLI onto developer machines:
```bash
npm install -g @omniguard/cli
omniguard login --api-key <your-provisioned-api-key>
```
Verify the installation by running:
```bash
omniguard status
```

## Support Contacts
For enterprise onboarding support, contact support@omniguard.io.
