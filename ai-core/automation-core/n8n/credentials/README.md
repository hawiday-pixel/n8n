---
created: 2024-12-06
updated: 2024-12-06
---

# Credentials

This folder contains credential templates for n8n integrations.

## ⚠️ Security Notice

- **NEVER** commit actual credentials to this repository
- Only `.template.json` files in `/templates` are tracked
- Actual credential files are gitignored

## How to Use

1. Copy the template file you need:
   ```bash
   cp templates/xero.template.json xero-production.json
   ```

2. Fill in your actual credentials in the copied file

3. Import into n8n via UI or CLI

## Available Templates

| Template | Service | Purpose |
|----------|---------|---------|
| `xero.template.json` | Xero | Accounting integration |
| `shopify.template.json` | Shopify | E-commerce integration |
| `whatsapp.template.json` | WhatsApp Business | Messaging automation |

## Adding New Templates

1. Export credentials from n8n (without sensitive data)
2. Replace actual values with `YOUR_*` placeholders
3. Add `meta.instructions` field with setup steps
4. Save as `{service}.template.json`

