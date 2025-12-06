---
created: 2024-12-06
updated: 2024-12-06
---

# n8n Automation Core

Centralized n8n workflow repository for HOZ, TNER, and WRAP automation.

## Structure

| Folder | Purpose |
|--------|---------|
| `workflows/` | Exported n8n workflows by department |
| `credentials/` | Credential templates (actuals gitignored) |
| `scripts/` | CLI tools for export/import/backup |
| `docs/` | Architecture & SOPs |

## Workflow Categories

- **sales/** - CRM integrations, lead routing, order sync
- **finance/** - Xero, invoicing, payables automation
- **operations/** - Job scheduling, ServiceM8 updates
- **shopify/** - E-commerce automation, webhooks
- **utils/** - Reusable sub-workflows and helpers

## Quick Start

1. Import workflows via n8n UI or CLI
2. Configure credentials from templates in `credentials/templates/`
3. See `docs/how-to-deploy.md` for deployment instructions

## Hosted On

- **Platform**: Hostinger (self-hosted n8n)
- **Environment**: Production

## Naming Convention

See `docs/naming-conventions.md` for workflow and file naming standards.

