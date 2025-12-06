---
created: 2024-12-06
updated: 2024-12-06
---

# Naming Conventions

## Workflow Files

### Format
```
{company}-{action}-{resource}.json
```

### Examples
- `tner-sync-orders.json` - TNER order synchronization
- `hoz-whatsapp-leads.json` - HOZ WhatsApp lead capture
- `wrap-leads-router.json` - WRAP lead routing

### Company Prefixes
| Prefix | Company |
|--------|---------|
| `tner-` | TNER |
| `hoz-` | HOZ |
| `wrap-` | WRAP |
| `cfo-` | Cross-company finance |
| (none) | Shared/utility workflows |

## Workflow Names in n8n

Use human-readable names with company prefix:
- "TNER - Sync Orders"
- "HOZ - WhatsApp Leads"
- "WRAP - Leads Router"

## Folders

Use lowercase with hyphens:
- `sales/`
- `finance/`
- `operations/`
- `shopify/`
- `utils/`

## Credentials

### Template Files
```
{service}.template.json
```

### Production Files (gitignored)
```
{service}-{environment}.json
```

Example: `xero-production.json`

## Scripts

Use lowercase with hyphens:
```
{action}-{target}.js
```

Examples:
- `export-all.js`
- `import-all.js`
- `backup-to-github.js`

