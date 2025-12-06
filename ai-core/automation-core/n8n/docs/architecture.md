---
created: 2024-12-06
updated: 2024-12-06
---

# Architecture

## Overview

This repository manages n8n workflows for HOZ, TNER, and WRAP automation.

## System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    n8n (Hostinger)                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────┐  ┌─────────┐  ┌───────────┐  ┌────────┐  │
│   │  Sales  │  │ Finance │  │ Operations│  │Shopify │  │
│   └────┬────┘  └────┬────┘  └─────┬─────┘  └───┬────┘  │
│        │            │             │            │        │
└────────┼────────────┼─────────────┼────────────┼────────┘
         │            │             │            │
         ▼            ▼             ▼            ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
    │WhatsApp │  │  Xero   │  │ServiceM8│  │ Shopify │
    │   CRM   │  │         │  │         │  │  Store  │
    └─────────┘  └─────────┘  └─────────┘  └─────────┘
```

## Workflow Categories

### Sales
- Lead capture and routing
- Order synchronization
- WhatsApp automation

### Finance
- Xero integration
- Invoice generation
- Payables automation

### Operations
- Job scheduling
- ServiceM8 updates

### Shopify
- Product sync
- Order webhooks
- Abandoned cart recovery

### Utils
- Reusable sub-workflows
- Common helpers

## Data Flow

TODO: Document data flow between systems

