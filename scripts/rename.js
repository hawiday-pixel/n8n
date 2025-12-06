#!/usr/bin/env node
/**
 * Rename Workflow in n8n
 *
 * Renames a workflow in-place using its ID (not by changing local JSON).
 * This prevents creating duplicates.
 *
 * Usage: node scripts/rename.js "<old-name>" "<new-name>"
 * Example: node scripts/rename.js "Tner - Admin Dashboard" "TNER | Admin | dashboard"
 */

require('dotenv').config();

const N8N_API_URL = process.env.N8N_API_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

if (!N8N_API_URL || !N8N_API_KEY) {
  console.error('❌ Missing N8N_API_URL or N8N_API_KEY in .env');
  process.exit(1);
}

const [oldName, newName] = process.argv.slice(2);

if (!oldName || !newName) {
  console.error('Usage: node scripts/rename.js "<old-name>" "<new-name>"');
  console.error(
    'Example: node scripts/rename.js "Tner - Admin Dashboard" "TNER | Admin | dashboard"'
  );
  process.exit(1);
}

async function renameWorkflow() {
  console.log(`🔄 Renaming: "${oldName}" → "${newName}"\n`);

  try {
    // Get all workflows to find the one to rename
    const listRes = await fetch(`${N8N_API_URL}/workflows`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY },
    });
    const listData = await listRes.json();
    const workflows = listData.data || listData;

    // Find workflow by old name
    const workflow = workflows.find((w) => w.name === oldName);

    if (!workflow) {
      console.error(`❌ Workflow not found: "${oldName}"`);
      console.log('\nAvailable workflows:');
      workflows.forEach((w) => console.log(`  - ${w.name}`));
      process.exit(1);
    }

    // Fetch full workflow data
    const fullRes = await fetch(`${N8N_API_URL}/workflows/${workflow.id}`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY },
    });
    const fullWorkflow = await fullRes.json();

    // Update with new name
    const updateRes = await fetch(`${N8N_API_URL}/workflows/${workflow.id}`, {
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: newName,
        nodes: fullWorkflow.nodes,
        connections: fullWorkflow.connections,
        settings: fullWorkflow.settings,
      }),
    });

    if (updateRes.ok) {
      console.log(`✅ Renamed successfully!`);
      console.log(`\n💡 Run "node scripts/export-all.js" to sync local files.`);
    } else {
      const err = await updateRes.json();
      console.error(`❌ Failed to rename: ${err.message}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

renameWorkflow();
