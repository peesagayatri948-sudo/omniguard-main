/**
 * OmniGuard Enterprise Terraform HCL Parser & Compliance Rule Engine
 * Parses HCL files into a structured resource AST/graph, and runs security audits.
 */

const fs = require('fs');
const path = require('path');

/**
 * Basic HCL Parser: extracts blocks and attributes recursively.
 */
function parseHCL(hclContent) {
  // 1. Strip comments
  let cleanContent = hclContent
    .replace(/\/\*[\s\S]*?\*\//g, '') // strip /* block comments */
    .replace(/(?:^|\s)\/\/.*$/gm, '') // strip // line comments
    .replace(/(?:^|\s)#.*$/gm, '');   // strip # line comments

  const ast = {
    resource: {},
    provider: {},
    variable: {},
    module: {},
    data: {},
    locals: {}
  };

  // Regular expression to identify blocks: type [name1] [name2] {
  const blockHeaderRegex = /(\w+)\s+(?:"([^"]+)"\s+)?(?:"([^"]+)"\s+)?\{/g;
  
  let match;
  while ((match = blockHeaderRegex.exec(cleanContent)) !== null) {
    const type = match[1];
    const name1 = match[2];
    const name2 = match[3];
    
    // Extract block body by balancing curly braces
    const startIndex = match.index + match[0].length;
    let braceCount = 1;
    let endIndex = startIndex;
    
    while (braceCount > 0 && endIndex < cleanContent.length) {
      const char = cleanContent[endIndex];
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
      endIndex++;
    }
    
    const blockBody = cleanContent.substring(startIndex, endIndex - 1);
    const parsedBody = parseBlockBody(blockBody);

    if (type === 'resource' && name1 && name2) {
      if (!ast.resource[name1]) ast.resource[name1] = {};
      ast.resource[name1][name2] = parsedBody;
    } else if (type === 'variable' && name1) {
      ast.variable[name1] = parsedBody;
    } else if (type === 'provider' && name1) {
      ast.provider[name1] = parsedBody;
    } else if (type === 'module' && name1) {
      ast.module[name1] = parsedBody;
    } else if (type === 'data' && name1 && name2) {
      if (!ast.data[name1]) ast.data[name1] = {};
      ast.data[name1][name2] = parsedBody;
    } else if (type === 'locals') {
      Object.assign(ast.locals, parsedBody);
    }
  }

  return ast;
}

function parseBlockBody(bodyText) {
  const obj = {};
  const lines = bodyText.split('\n');

  let currentBlockName = null;
  let currentBlockText = '';
  let braceCount = 0;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Handle nested blocks
    if (braceCount > 0) {
      currentBlockText += '\n' + line;
      if (line.includes('{')) braceCount += (line.match(/\{/g) || []).length;
      if (line.includes('}')) braceCount -= (line.match(/\}/g) || []).length;
      
      if (braceCount === 0) {
        // Strip outer braces and parse
        const nestedBody = currentBlockText.substring(currentBlockText.indexOf('{') + 1, currentBlockText.lastIndexOf('}'));
        obj[currentBlockName] = parseBlockBody(nestedBody);
        currentBlockName = null;
        currentBlockText = '';
      }
      continue;
    }

    if (line.includes('{') && !line.includes('=')) {
      const blockMatch = /(\w+)\s*\{/.exec(line);
      if (blockMatch) {
        currentBlockName = blockMatch[1];
        currentBlockText = line;
        braceCount = 1;
        continue;
      }
    }

    // Parse simple key-value assignments
    const eqIndex = line.indexOf('=');
    if (eqIndex !== -1) {
      const key = line.substring(0, eqIndex).trim();
      let val = line.substring(eqIndex + 1).trim();
      
      // Clean string values
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      // Clean array brackets
      if (val.startsWith('[') && val.endsWith(']')) {
        val = val.substring(1, val.length - 1).split(',').map(v => v.trim().replace(/"/g, ''));
      }
      // Boolean convert
      if (val === 'true') val = true;
      if (val === 'false') val = false;

      obj[key] = val;
    }
  }

  return obj;
}

/**
 * Builds resource dependencies and reference mappings.
 */
function buildResourceGraph(ast) {
  const nodes = [];
  const edges = [];

  for (const [resType, resMap] of Object.entries(ast.resource)) {
    for (const [resName, body] of Object.entries(resMap)) {
      const id = `${resType}.${resName}`;
      nodes.push({ id, type: 'resource', resourceType: resType, name: resName, config: body });

      // Scan body for references to other resources (e.g. aws_s3_bucket.bucket.id)
      const bodyStr = JSON.stringify(body);
      const refRegex = /(\w+)\.(\w+)\.\w+/g;
      let match;
      while ((match = refRegex.exec(bodyStr)) !== null) {
        const targetType = match[1];
        const targetName = match[2];
        if (ast.resource[targetType] && ast.resource[targetType][targetName]) {
          edges.push({ source: id, target: `${targetType}.${targetName}` });
        }
      }
    }
  }

  return { nodes, edges };
}

/**
 * Runs Terraform HCL security audits using HCL-AST and Graph traversal.
 */
function runHclAudit(filePath, fileContent) {
  const findings = [];
  let ast;
  try {
    ast = parseHCL(fileContent);
  } catch (e) {
    return [{
      rule_id: 'OG-HCL-PARSE-ERR',
      category: 'iac',
      title: 'Terraform HCL Syntax Parse Error',
      description: `Failed to compile HCL configurations: ${e.message}`,
      severity: 'high',
      file_path: filePath,
      line_start: 1,
      evidence: 'Parse error',
      status: 'open',
      scanner: 'iac',
      clause_reference: 'NIST CSF PR.IP-1'
    }];
  }

  const { nodes, edges } = buildResourceGraph(ast);

  // Helper to check if S3 bucket has a public access block attached (Graph check!)
  function hasS3PublicAccessBlock(bucketName) {
    const bucketId = `aws_s3_bucket.${bucketName}`;
    // Look for aws_s3_bucket_public_access_block pointing to this bucket
    return nodes.some(n => 
      n.resourceType === 'aws_s3_bucket_public_access_block' && 
      (n.config.bucket === bucketName || JSON.stringify(n.config).includes(bucketId))
    );
  }

  // Helper to check if S3 bucket has encryption block attached (Graph check!)
  function hasS3Encryption(bucketName) {
    const bucketId = `aws_s3_bucket.${bucketName}`;
    return nodes.some(n => 
      n.resourceType === 'aws_s3_bucket_server_side_encryption_configuration' && 
      (n.config.bucket === bucketName || JSON.stringify(n.config).includes(bucketId))
    );
  }

  // Helper to check S3 bucket versioning (Graph check!)
  function hasS3Versioning(bucketName) {
    const bucketId = `aws_s3_bucket.${bucketName}`;
    const versionNode = nodes.find(n => 
      n.resourceType === 'aws_s3_bucket_versioning' && 
      (n.config.bucket === bucketName || JSON.stringify(n.config).includes(bucketId))
    );
    if (versionNode) {
      return versionNode.config.versioning_configuration?.status === 'Enabled' || versionNode.config.versioning_configuration?.status === true;
    }
    return false;
  }

  // Traverse Resource Graph Nodes
  for (const node of nodes) {
    const { resourceType, name, config } = node;

    // Rule 1: Permissive SG Ingress (0.0.0.0/0 on port 22 or open)
    if (resourceType === 'aws_security_group' || resourceType === 'aws_security_group_rule') {
      const ingress = config.ingress || config;
      if (ingress.cidr_blocks && JSON.stringify(ingress.cidr_blocks).includes('0.0.0.0/0')) {
        const isSSH = ingress.to_port === 22 || ingress.from_port === 22 || ingress.to_port === '22';
        findings.push({
          rule_id: 'OG-CLOUD-001',
          category: 'drift',
          title: 'Permissive AWS Security Group (Port 22 Open to Internet)',
          description: `Security Group ${name} allows public SSH ingress (0.0.0.0/0) which violates security boundaries.`,
          severity: isSSH ? 'high' : 'medium',
          file_path: filePath,
          line_start: 1,
          evidence: `cidr_blocks = ${JSON.stringify(ingress.cidr_blocks)}`,
          status: 'open',
          scanner: 'iac',
          clause_reference: 'PCI DSS 6.4.3, NIST CSF PR.AC-3'
        });
      }
    }

    // Rule 2 & 3 & 4 & 8: S3 Bucket Security Check
    if (resourceType === 'aws_s3_bucket') {
      // Rule 3: Public Bucket (ACL or missing public access block)
      const isPublicAcl = config.acl === 'public-read' || config.acl === 'public-read-write';
      const hasBlock = hasS3PublicAccessBlock(name);
      if (isPublicAcl || !hasBlock) {
        findings.push({
          rule_id: 'OG-CLOUD-003',
          category: 'drift',
          title: 'AWS S3 Bucket Public Access Enabled',
          description: `S3 bucket '${name}' has public ACL configuration or lacks an explicit aws_s3_bucket_public_access_block attachment.`,
          severity: 'critical',
          file_path: filePath,
          line_start: 1,
          evidence: `acl = "${config.acl || 'private'}", public_access_block_attached = ${hasBlock}`,
          status: 'open',
          scanner: 'iac',
          clause_reference: 'PCI DSS 6.5.1, NIST CSF PR.DS-1'
        });
      }

      // Rule 2 & 8: Encryption and KMS
      const hasEncrypt = hasS3Encryption(name);
      if (!hasEncrypt) {
        findings.push({
          rule_id: 'OG-CLOUD-002',
          category: 'drift',
          title: 'Unencrypted AWS S3 Object Storage Bucket Drift',
          description: `S3 Bucket '${name}' lacks default server-side encryption configuration block.`,
          severity: 'high',
          file_path: filePath,
          line_start: 1,
          evidence: 'Missing aws_s3_bucket_server_side_encryption_configuration',
          status: 'open',
          scanner: 'iac',
          clause_reference: 'PCI DSS 6.2.4, NIST CSF PR.DS-1'
        });
      }

      // Rule 4: S3 Versioning missing
      const hasVersion = hasS3Versioning(name);
      if (!hasVersion) {
        findings.push({
          rule_id: 'OG-CLOUD-004',
          category: 'drift',
          title: 'AWS S3 Bucket Versioning Disabled',
          description: `Versioning is disabled or missing for S3 Bucket '${name}'. Standard guidelines require versioning to protect against accidental deletion or ransomware.`,
          severity: 'medium',
          file_path: filePath,
          line_start: 1,
          evidence: 'Missing or disabled aws_s3_bucket_versioning',
          status: 'open',
          scanner: 'iac',
          clause_reference: 'ISO 27001 A.8.13, SOC2 CC6.5'
        });
      }
    }

    // Rule 5: IAM Policy Wildcard Ingress
    if (resourceType === 'aws_iam_policy' || resourceType === 'aws_iam_role_policy') {
      const policyStr = typeof config.policy === 'string' ? config.policy : JSON.stringify(config.policy || {});
      if (policyStr.includes('"Action": "*"') || policyStr.includes('"Action": ["*"]') || policyStr.includes('"Principal": "*"')) {
        findings.push({
          rule_id: 'OG-CLOUD-005',
          category: 'drift',
          title: 'Permissive IAM Wildcard Action Allowed',
          description: `IAM Policy '${name}' grants wildcard '*' administrative actions or wildcard principals, violating the Principle of Least Privilege.`,
          severity: 'critical',
          file_path: filePath,
          line_start: 1,
          evidence: 'Action or Principal set to *',
          status: 'open',
          scanner: 'iac',
          clause_reference: 'PCI DSS 7.1.1, SOC2 CC6.2'
        });
      }
    }

    // Rule 6: Publicly Accessible RDS
    if (resourceType === 'aws_db_instance') {
      if (config.publicly_accessible === true || config.publicly_accessible === 'true') {
        findings.push({
          rule_id: 'OG-CLOUD-006',
          category: 'drift',
          title: 'RDS Database Instance Publicly Accessible',
          description: `RDS DB Instance '${name}' has publicly_accessible parameter set to true, exposing backend database layers to external network threats.`,
          severity: 'critical',
          file_path: filePath,
          line_start: 1,
          evidence: 'publicly_accessible = true',
          status: 'open',
          scanner: 'iac',
          clause_reference: 'PCI DSS 1.2.1, ISO 27001 A.8.20'
        });
      }
    }

    // Rule 7: Unencrypted EBS Volume
    if (resourceType === 'aws_ebs_volume') {
      if (config.encrypted === false || config.encrypted === 'false' || config.encrypted === undefined) {
        findings.push({
          rule_id: 'OG-CLOUD-007',
          category: 'drift',
          title: 'Unencrypted EBS Volume Deployments',
          description: `EBS Storage Volume '${name}' is deployed without KMS default block encryption.`,
          severity: 'high',
          file_path: filePath,
          line_start: 1,
          evidence: `encrypted = ${config.encrypted || 'false'}`,
          status: 'open',
          scanner: 'iac',
          clause_reference: 'PCI DSS 3.4.1, SOC2 CC6.6'
        });
      }
    }

    // Rule 9: KMS Key Rotation Disabled
    if (resourceType === 'aws_kms_key') {
      if (config.enable_key_rotation === false || config.enable_key_rotation === 'false' || config.enable_key_rotation === undefined) {
        findings.push({
          rule_id: 'OG-CLOUD-009',
          category: 'drift',
          title: 'KMS Key Rotation Disabled',
          description: `AWS KMS customer managed key '${name}' does not have automatic annual key rotation enabled.`,
          severity: 'medium',
          file_path: filePath,
          line_start: 1,
          evidence: `enable_key_rotation = ${config.enable_key_rotation || 'false'}`,
          status: 'open',
          scanner: 'iac',
          clause_reference: 'PCI DSS 3.6.4, ISO 27001 A.8.24'
        });
      }
    }

    // Rule 10: Unencrypted ELB Listener (HTTP Port 80)
    if (resourceType === 'aws_lb_listener' || resourceType === 'aws_alb_listener') {
      if ((config.port === 80 || config.port === '80') && (config.protocol === 'HTTP' || config.protocol === undefined)) {
        findings.push({
          rule_id: 'OG-CLOUD-010',
          category: 'drift',
          title: 'Insecure Load Balancer Listener (HTTP Port 80)',
          description: `Load Balancer listener '${name}' is configured to receive unencrypted HTTP requests without a TLS secure redirect.`,
          severity: 'high',
          file_path: filePath,
          line_start: 1,
          evidence: `port = 80, protocol = "HTTP"`,
          status: 'open',
          scanner: 'iac',
          clause_reference: 'PCI DSS 4.1.1, SOC2 CC6.7'
        });
      }
    }

    // Rule 11: Unencrypted RDS Storage
    if (resourceType === 'aws_db_instance') {
      if (config.storage_encrypted === false || config.storage_encrypted === 'false' || config.storage_encrypted === undefined) {
        findings.push({
          rule_id: 'OG-CLOUD-011',
          category: 'drift',
          title: 'Unencrypted RDS Database Storage',
          description: `RDS DB Instance '${name}' does not have block storage encryption enabled. This exposes raw relational data to hardware theft.`,
          severity: 'high',
          file_path: filePath,
          line_start: 1,
          evidence: `storage_encrypted = ${config.storage_encrypted || 'false'}`,
          status: 'open',
          scanner: 'iac',
          clause_reference: 'PCI DSS 3.4.1, NIST CSF PR.DS-1'
        });
      }
    }

    // Rule 12: Public Redshift Cluster
    if (resourceType === 'aws_redshift_cluster') {
      if (config.publicly_accessible === true || config.publicly_accessible === 'true' || config.publicly_accessible === undefined) {
        findings.push({
          rule_id: 'OG-CLOUD-012',
          category: 'drift',
          title: 'Publicly Accessible Redshift Cluster',
          description: `Redshift Data Warehouse Cluster '${name}' has public endpoint accessibility enabled, inviting external network scans.`,
          severity: 'critical',
          file_path: filePath,
          line_start: 1,
          evidence: `publicly_accessible = ${config.publicly_accessible || 'true'}`,
          status: 'open',
          scanner: 'iac',
          clause_reference: 'PCI DSS 1.2.1, ISO 27001 A.8.20'
        });
      }
    }

    // Rule 13: Unencrypted SNS Topic
    if (resourceType === 'aws_sns_topic') {
      if (!config.kms_master_key_id) {
        findings.push({
          rule_id: 'OG-CLOUD-013',
          category: 'drift',
          title: 'SNS Topic Unencrypted at Rest',
          description: `SNS Topic '${name}' does not specify a customer managed KMS key for encrypting messages at rest.`,
          severity: 'medium',
          file_path: filePath,
          line_start: 1,
          evidence: 'Missing kms_master_key_id',
          status: 'open',
          scanner: 'iac',
          clause_reference: 'ISO 27001 A.8.24, NIST CSF PR.DS-1'
        });
      }
    }

    // Rule 14: Unencrypted SQS Queue
    if (resourceType === 'aws_sqs_queue') {
      if (!config.kms_master_key_id && config.sqs_managed_sse_enabled !== true) {
        findings.push({
          rule_id: 'OG-CLOUD-014',
          category: 'drift',
          title: 'SQS Queue Message Encryption Disabled',
          description: `SQS Queue '${name}' does not have Server-Side Encryption (SSE) enabled via KMS or SQS-managed keys.`,
          severity: 'medium',
          file_path: filePath,
          line_start: 1,
          evidence: 'Missing encryption parameters',
          status: 'open',
          scanner: 'iac',
          clause_reference: 'ISO 27001 A.8.24, NIST CSF PR.DS-1'
        });
      }
    }

    // Rule 15: Unencrypted DynamoDB Table
    if (resourceType === 'aws_dynamodb_table') {
      const sse = config.server_side_encryption;
      if (sse && (sse.enabled === false || sse.enabled === 'false')) {
        findings.push({
          rule_id: 'OG-CLOUD-015',
          category: 'drift',
          title: 'DynamoDB Server-Side Encryption Disabled',
          description: `DynamoDB Table '${name}' explicitly disables default server side encryption.`,
          severity: 'high',
          file_path: filePath,
          line_start: 1,
          evidence: 'server_side_encryption.enabled = false',
          status: 'open',
          scanner: 'iac',
          clause_reference: 'PCI DSS 3.4.1, SOC2 CC6.6'
        });
      }
    }

    // Rule 16: EKS Cluster Public Endpoint Enabled
    if (resourceType === 'aws_eks_cluster') {
      const vpcConfig = config.vpc_config;
      if (vpcConfig && (vpcConfig.endpoint_public_access === true || vpcConfig.endpoint_public_access === undefined)) {
        findings.push({
          rule_id: 'OG-CLOUD-016',
          category: 'drift',
          title: 'EKS Kubernetes API Public Access Enabled',
          description: `EKS Cluster '${name}' allows unrestricted public network access to the control plane API endpoint.`,
          severity: 'high',
          file_path: filePath,
          line_start: 1,
          evidence: `endpoint_public_access = ${vpcConfig.endpoint_public_access || 'true'}`,
          status: 'open',
          scanner: 'iac',
          clause_reference: 'PCI DSS 1.2.1, ISO 27001 A.8.20'
        });
      }
    }

    // Rule 17: ASG Missing ELB Health Check
    if (resourceType === 'aws_autoscaling_group') {
      if (config.health_check_type !== 'ELB' && (config.target_group_arns || config.load_balancers)) {
        findings.push({
          rule_id: 'OG-CLOUD-017',
          category: 'drift',
          title: 'ASG Health Check Type Not Configured to ELB',
          description: `Autoscaling Group '${name}' is attached to load balancers but uses EC2 instance-level checks instead of ELB traffic routing health audits.`,
          severity: 'low',
          file_path: filePath,
          line_start: 1,
          evidence: `health_check_type = "${config.health_check_type || 'EC2'}"`,
          status: 'open',
          scanner: 'iac',
          clause_reference: 'ISO 27001 A.8.14, NIST CSF PR.IP-1'
        });
      }
    }
  }

  return findings;
}

module.exports = {
  parseHCL,
  buildResourceGraph,
  runHclAudit
};
