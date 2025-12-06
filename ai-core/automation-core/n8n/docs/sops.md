---
created: 2024-12-06
updated: 2024-12-06
---

# Standard Operating Procedures (SOPs)

## Adding a New Workflow

1. **Create in n8n**
   - Build and test workflow in n8n UI
   - Follow naming conventions

2. **Export**
   - Export workflow as JSON
   - Remove any sensitive data from export

3. **Save to Repository**
   - Place in appropriate category folder
   - Use correct file naming convention
   - Commit with descriptive message

4. **Document**
   - Add entry to relevant docs if needed
   - Update architecture.md if new integration

## Modifying Existing Workflows

1. **Pull Latest**
   ```bash
   git pull origin main
   ```

2. **Import to n8n**
   - Import workflow to n8n
   - Make changes and test

3. **Export & Commit**
   - Export updated workflow
   - Commit changes with description

## Backup Procedure

### Manual Backup
```bash
node scripts/backup-to-github.js
```

### Recommended Schedule
- Daily: Automatic backup (TODO: set up cron)
- Before major changes: Manual backup

## Troubleshooting

### Workflow Not Triggering
1. Check workflow is activated
2. Verify trigger configuration
3. Check n8n logs

### Credential Errors
1. Verify credentials in n8n
2. Check API access/permissions
3. Refresh OAuth tokens if needed

### Import Failures
1. Check JSON syntax
2. Verify n8n version compatibility
3. Check for missing credentials

## Emergency Contacts

TODO: Add emergency contact information

