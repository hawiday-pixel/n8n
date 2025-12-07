---
created: 2024-12-06
updated: 2025-12-07
---

# How to Deploy

## Prerequisites

- Access to n8n instance on Hostinger
- n8n MCP tools configured (API key in MCP server config)
- Git repository cloned locally

## Deployment Methods

### Method 1: Using Cursor + n8n MCP (Recommended)

Simply ask Cursor to deploy your workflow:

```
"Deploy workflows/admin/tner-email-classifier.json to n8n"
```

Cursor will:
1. Read the local JSON file
2. Check if workflow exists (by name)
3. Create new or update existing workflow via MCP

### Method 2: Manual Import via n8n UI

1. Open n8n UI
2. Go to Workflows
3. Click Import from File
4. Select the workflow JSON file
5. Review and activate

## Common MCP Commands

| Task | Ask Cursor |
|------|------------|
| Deploy workflow | "Deploy `workflows/admin/xyz.json` to n8n" |
| Export workflow | "Export workflow ID `abc123` to `workflows/admin/`" |
| List all workflows | "List all workflows in n8n" |
| Rename workflow | "Rename workflow 'OLD' to 'NEW'" |
| Activate workflow | "Activate workflow ID `abc123`" |
| Validate workflow | "Validate workflow ID `abc123`" |

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `n8n_list_workflows` | List workflows (metadata) |
| `n8n_get_workflow` | Get full workflow by ID |
| `n8n_create_workflow` | Create new workflow |
| `n8n_update_full_workflow` | Update existing workflow |
| `n8n_update_partial_workflow` | Rename, activate, partial edits |
| `n8n_validate_workflow` | Check for errors |
| `n8n_health_check` | Verify API connectivity |

## Post-Deployment Checklist

- [ ] Verify credentials are configured in n8n
- [ ] Test workflow with sample data
- [ ] Enable workflow activation
- [ ] Set up error notifications
- [ ] Document any manual steps

## Rollback Procedure

1. Use `n8n_workflow_versions` to list version history
2. Rollback to previous version if needed
3. Or import previous version from git history

## Troubleshooting

If MCP tools aren't working:
1. Ask Cursor to run `n8n_health_check` 
2. Verify API connectivity and credentials
3. Check MCP server configuration

