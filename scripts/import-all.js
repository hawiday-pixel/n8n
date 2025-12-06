#!/usr/bin/env node
/**
 * Import Workflows to n8n
 *
 * Imports local workflow JSON files to your Hostinger n8n instance.
 *
 * Usage:
 *   node scripts/import-all.js                    # Import all workflows
 *   node scripts/import-all.js sales/tner-sync    # Import specific workflow
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

async function getExistingWorkflows() {
  const response = await fetch(`${N8N_API_URL}/workflows`, {
    headers: { 'X-N8N-API-KEY': N8N_API_KEY },
  });
  const data = await response.json();
  return data.data || data;
}

async function createWorkflow(workflow) {
  const response = await fetch(`${N8N_API_URL}/workflows`, {
    method: 'POST',
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(workflow),
  });
  return response.json();
}

async function updateWorkflow(id, workflow) {
  const response = await fetch(`${N8N_API_URL}/workflows/${id}`, {
    method: 'PUT',
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(workflow),
  });
  return response.json();
}

async function importWorkflows(specificPath) {
  console.log('🔄 Importing workflows to n8n...\n');

  try {
    // Get existing workflows to check for updates vs creates
    const existing = await getExistingWorkflows();
    const existingByName = new Map(existing.map((w) => [w.name, w]));

    const workflowsDir = path.join(__dirname, '..', 'workflows');
    const categories = [
      'admin',
      'finance',
      'operations',
      'sales',
      'shopify',
      'utils',
      'vendor-operation',
    ];

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const category of categories) {
      const categoryDir = path.join(workflowsDir, category);

      if (!fs.existsSync(categoryDir)) continue;

      const files = fs.readdirSync(categoryDir).filter((f) => f.endsWith('.json'));

      for (const file of files) {
        const filePath = path.join(categoryDir, file);
        const relativePath = `${category}/${file}`;

        // If specific path provided, skip non-matching files
        if (specificPath && !relativePath.includes(specificPath)) {
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const workflow = JSON.parse(content);

        // Skip placeholder workflows (empty nodes)
        if (!workflow.nodes || workflow.nodes.length === 0) {
          console.log(`⏭️  Skipped (placeholder): ${relativePath}`);
          skipped++;
          continue;
        }

        // Check if workflow exists
        const existingWorkflow = existingByName.get(workflow.name);

        if (existingWorkflow) {
          // Update existing workflow
          await updateWorkflow(existingWorkflow.id, {
            name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
          });
          console.log(`🔄 Updated: ${relativePath}`);
          updated++;
        } else {
          // Create new workflow
          await createWorkflow({
            name: workflow.name,
            nodes: workflow.nodes,
            connections: workflow.connections,
            settings: workflow.settings,
          });
          console.log(`✅ Created: ${relativePath}`);
          created++;
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`\n✨ Done!`);
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

const specificPath = process.argv[2];
importWorkflows(specificPath);
