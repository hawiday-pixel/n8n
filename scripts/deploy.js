#!/usr/bin/env node
/**
 * Deploy Workflow to n8n
 *
 * Deploys a specific workflow from the repository to n8n.
 *
 * Usage:
 *   node scripts/deploy.js sales/tner-sync-invoices
 *   node scripts/deploy.js finance/xero-sync --activate
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const N8N_API_URL = process.env.N8N_API_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

if (!N8N_API_URL || !N8N_API_KEY) {
  console.error('❌ Missing N8N_API_URL or N8N_API_KEY in .env');
  process.exit(1);
}

async function deploy(workflowPath, activate = false) {
  if (!workflowPath) {
    console.error('❌ Please specify a workflow path');
    console.log('\nUsage: node scripts/deploy.js <category/workflow-name>');
    console.log('Example: node scripts/deploy.js sales/tner-sync-invoices');
    process.exit(1);
  }

  // Find the workflow file
  const workflowsDir = path.join(__dirname, '..', 'workflows');
  let filePath;

  // Check if path includes .json extension
  if (workflowPath.endsWith('.json')) {
    filePath = path.join(workflowsDir, workflowPath);
  } else {
    // Try to find matching file
    const parts = workflowPath.split('/');
    const category = parts[0];
    const name = parts.slice(1).join('/') || parts[0];

    const categoryDir = path.join(workflowsDir, category);
    if (fs.existsSync(categoryDir)) {
      const files = fs.readdirSync(categoryDir);
      const match = files.find((f) => f.includes(name) && f.endsWith('.json'));
      if (match) {
        filePath = path.join(categoryDir, match);
      }
    }
  }

  if (!filePath || !fs.existsSync(filePath)) {
    console.error(`❌ Workflow not found: ${workflowPath}`);
    console.log('\nAvailable workflows:');

    const categories = [
      'admin',
      'finance',
      'operations',
      'sales',
      'shopify',
      'utils',
      'vendor-operation',
    ];
    for (const cat of categories) {
      const dir = path.join(workflowsDir, cat);
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
        files.forEach((f) => console.log(`  ${cat}/${f.replace('.json', '')}`));
      }
    }
    process.exit(1);
  }

  console.log(`🚀 Deploying: ${filePath}\n`);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const workflow = JSON.parse(content);

    // Get existing workflows
    const response = await fetch(`${N8N_API_URL}/workflows`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY },
    });
    const data = await response.json();
    const existing = (data.data || data).find((w) => w.name === workflow.name);

    let result;

    if (existing) {
      // Update existing
      const updateResponse = await fetch(`${N8N_API_URL}/workflows/${existing.id}`, {
        method: 'PUT',
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: workflow.name,
          nodes: workflow.nodes,
          connections: workflow.connections,
          settings: workflow.settings,
        }),
      });
      result = await updateResponse.json();
      console.log(`✅ Updated workflow: ${workflow.name}`);

      // Activate if requested
      if (activate && !existing.active) {
        await fetch(`${N8N_API_URL}/workflows/${existing.id}/activate`, {
          method: 'POST',
          headers: { 'X-N8N-API-KEY': N8N_API_KEY },
        });
        console.log(`⚡ Activated workflow`);
      }
    } else {
      // Create new
      const createResponse = await fetch(`${N8N_API_URL}/workflows`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: workflow.name,
          nodes: workflow.nodes,
          connections: workflow.connections,
          settings: workflow.settings,
          active: activate,
        }),
      });
      result = await createResponse.json();
      console.log(`✅ Created workflow: ${workflow.name}`);
      if (activate) console.log(`⚡ Activated workflow`);
    }

    console.log(
      `\n🔗 View at: ${N8N_API_URL.replace('/api/v1', '')}/workflow/${result.id || existing?.id}`
    );
  } catch (error) {
    console.error('❌ Deploy failed:', error.message);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const workflowPath = args[0];
const activate = args.includes('--activate');

deploy(workflowPath, activate);
