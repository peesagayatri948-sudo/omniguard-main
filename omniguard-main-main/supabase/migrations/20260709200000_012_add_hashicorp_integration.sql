-- Add hashicorp (Vault) to integrations provider check constraint
ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_provider_check;
ALTER TABLE integrations ADD CONSTRAINT integrations_provider_check
  CHECK (provider IN (
    'github','gitlab','bitbucket','azuredevops',
    'slack','jira','pagerduty','sentry',
    'linear','servicenow','teams','confluence','okta',
    'jenkins','hashicorp','custom'
  ));
