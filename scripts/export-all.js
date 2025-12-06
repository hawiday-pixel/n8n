#!/usr/bin/env node
/**
 * Export All Workflows from n8n
 * 
 * Exports all workflows from your Hostinger n8n instance to local JSON files.
 * 
 * Usage: node scripts/export-all.js
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

// Category mapping based on workflow name prefixes/keywords
function categorizeWorkflow(name) {
  const lower = name.toLowerCase();
  if (lower.includes('tner') || lower.includes('alwc')) return 'sales';
  if (lower.includes('hoz')) return 'sales';
  if (lower.includes('wrap')) return 'sales';
  if (lower.includes('xero') || lower.includes('invoice') || lower.includes('payable')) return 'finance';
  if (lower.includes('shopify') || lower.includes('cart') || lower.includes('product')) return 'shopify';
  if (lower.includes('job') || lower.includes('schedule') || lower.includes('servicem8')) return 'operations';
  if (lower.includes('telegram') || lower.includes('whatsapp')) return 'sales';
  return 'utils';
}

// Convert workflow name to filename
function toFilename(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}

async function exportWorkflows() {
  console.log('🔄 Fetching workflows from n8n...\n');
  
  try {
    const response = await fetch(`${N8N_API_URL}/workflows`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const workflows = data.data || data;
    
    console.log(`📦 Found ${workflows.length} workflow(s)\n`);
    
    let exported = 0;
    let skipped = 0;
    
    for (const workflow of workflows) {
      // Skip archived workflows
      if (workflow.isArchived) {
        console.log(`⏭️  Skipped (archived): ${workflow.name}`);
        skipped++;
        continue;
      }
      
      const category = categorizeWorkflow(workflow.name);
      const filename = toFilename(workflow.name) + '.json';
      const dirPath = path.join(__dirname, '..', 'workflows', category);
      const filePath = path.join(dirPath, filename);
      
      // Ensure directory exists
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // Clean workflow data for export (remove sensitive/temporary data)
      // Sanitize nodes to remove API keys and secrets
      const sanitizedNodes = workflow.nodes.map(node => {
        const sanitized = JSON.parse(JSON.stringify(node));
        
        // Remove credential references (they're stored separately in n8n)
        if (sanitized.credentials) {
          for (const key in sanitized.credentials) {
            sanitized.credentials[key] = { id: 'REDACTED', name: sanitized.credentials[key].name };
          }
        }
        
        // Sanitize common secret patterns in parameters
        if (sanitized.parameters) {
          const params = JSON.stringify(sanitized.parameters);
          // Redact API keys, tokens, secrets
          const redacted = params
            .replace(/sk-[a-zA-Z0-9]{20,}/g, 'sk-REDACTED')
            .replace(/Bearer\s+[a-zA-Z0-9._-]{20,}/g, 'Bearer REDACTED')
            .replace(/"(api[Kk]ey|apikey|token|secret|password|authorization)":\s*"[^"]+"/g, '"$1": "REDACTED"')
            .replace(/eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, 'JWT_REDACTED');
          sanitized.parameters = JSON.parse(redacted);
        }
        
        return sanitized;
      });
      
      const cleanWorkflow = {
        name: workflow.name,
        nodes: sanitizedNodes,
        connections: workflow.connections,
        settings: workflow.settings,
        staticData: null,
        meta: {
          exportedAt: new Date().toISOString(),
          n8nId: workflow.id,
          active: workflow.active,
          note: 'Credentials and secrets have been redacted. Re-configure in n8n after import.'
        }
      };
      
      fs.writeFileSync(filePath, JSON.stringify(cleanWorkflow, null, 2));
      console.log(`✅ Exported: ${category}/${filename}`);
      exported++;
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Exported: ${exported}`);
    console.log(`   Skipped:  ${skipped}`);
    console.log(`\n✨ Done!`);
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
}

exportWorkflows();
