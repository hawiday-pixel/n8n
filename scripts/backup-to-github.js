#!/usr/bin/env node
/**
 * Backup Workflows to GitHub
 * 
 * Exports all workflows and commits to GitHub repository.
 * 
 * Usage: node scripts/backup-to-github.js
 */

const { execSync } = require('child_process');
const path = require('path');

async function backup() {
  const rootDir = path.join(__dirname, '..');
  
  console.log('🔄 Starting backup...\n');
  
  try {
    // Step 1: Export all workflows
    console.log('📦 Exporting workflows from n8n...');
    execSync('node scripts/export-all.js', { 
      cwd: rootDir, 
      stdio: 'inherit' 
    });
    
    // Step 2: Check for changes
    const status = execSync('git status --porcelain', { 
      cwd: rootDir, 
      encoding: 'utf8' 
    });
    
    if (!status.trim()) {
      console.log('\n✅ No changes to commit. Backup is up to date!');
      return;
    }
    
    // Step 3: Stage and commit
    console.log('\n📝 Committing changes...');
    const timestamp = new Date().toISOString().split('T')[0];
    const commitMessage = `backup: n8n workflows ${timestamp}`;
    
    execSync('git add workflows/', { cwd: rootDir });
    execSync(`git commit -m "${commitMessage}"`, { cwd: rootDir });
    
    // Step 4: Push to GitHub
    console.log('🚀 Pushing to GitHub...');
    execSync('git push', { cwd: rootDir, stdio: 'inherit' });
    
    console.log('\n✨ Backup complete!');
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

backup();
