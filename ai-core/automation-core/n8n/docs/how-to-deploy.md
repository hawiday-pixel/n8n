---
created: 2024-12-06
updated: 2024-12-06
---

# How to Deploy

## Prerequisites

- Access to n8n instance on Hostinger
- n8n API key configured
- Git repository cloned locally

## Deployment Methods

### Method 1: Manual Import (Recommended for Single Workflows)

1. Open n8n UI
2. Go to Workflows
3. Click Import from File
4. Select the workflow JSON file
5. Review and activate

### Method 2: Using Deploy Script

```bash
# Set environment variables
export N8N_API_URL="https://your-n8n-instance.hostinger.com"
export N8N_API_KEY="your-api-key"

# Deploy all workflows
node scripts/deploy.js

# Deploy specific workflow
node scripts/deploy.js sales/tner-sync-orders
```

## Environment Setup

TODO: Document Hostinger-specific setup

## Post-Deployment Checklist

- [ ] Verify credentials are configured
- [ ] Test workflow with sample data
- [ ] Enable workflow activation
- [ ] Set up error notifications
- [ ] Document any manual steps

## Rollback Procedure

1. Export current workflow as backup
2. Import previous version from git history
3. Verify functionality

