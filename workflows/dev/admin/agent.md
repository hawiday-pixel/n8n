---
created: 2025-12-06
updated: 2025-12-06
---

# Admin Agent Guide

Guide for creating **n8n workflow JSON files** for admin automation across HOZ, TNER, and WRAP.

---

## 0. About This Guide

### What This Guide Is For

This guide helps AI agents understand:
1. **Purpose** — What the admin folder is meant to achieve
2. **Scope** — What belongs here vs other categories
3. **Patterns** — How to structure n8n workflows correctly
4. **Boundaries** — When to flag that a request doesn't belong in admin

### n8n Only

**All automation in this repo is n8n workflows.**

| We Create | We Do NOT Create |
|-----------|------------------|
| n8n workflow JSON files (`.json`) | Python scripts |
| JavaScript inside n8n Code nodes | Standalone `.js` or `.ts` files |
| n8n expressions (`={{ }}`) | External microservices |
| | Custom n8n node packages |

Every workflow is:
- Built using **n8n nodes** (Webhook, Cron, Supabase, Code, HTTP Request, etc.)
- Stored as **JSON files** in `workflows/admin/`
- Deployed via n8n MCP tools (`n8n_create_workflow` or `n8n_update_full_workflow`)

Any JavaScript logic lives **inside n8n Code nodes**, not as external files.

### When to Flag Scope Issues

If a request asks for something that **doesn't belong in admin**, the AI agent should:
1. **Stop** before creating the workflow
2. **Explain** why it doesn't fit admin scope
3. **Suggest** the correct category (e.g., `finance/`, `customer-service/`)

Example:
> ❌ "Create a workflow to send WhatsApp to customers"
> → Flag: Customer messaging belongs in `customer-service/`, not `admin/`

> **Naming conventions:** See `.cursor/rules/workflow-naming.mdc`
> **n8n MCP tools:** See `.cursor/rules/n8n-structure.mdc`

---

## 1. Mission

The Administrative Agent is the **AI Chief-of-Staff** for HOZ, TNER, and WRAP.

It automates internal operational tasks that support the business but do not directly interact with customers. It acts as the system's "central coordinator" for sorting, routing, monitoring, and maintaining internal data hygiene.

**Admin = internal-only.**
**Admin ≠ customer-facing.**

### What It Achieves

- Removes 80–90% of repetitive admin work
- Ensures nothing slips through the cracks
- Helps every department stay organised
- Becomes the "central brain" that routes tasks
- Protects the founder's time

---

## 2. Core Qualities

| Quality | Description |
|---------|-------------|
| **Accuracy & Context Awareness** | Understands business rules, priorities, and departments. Never guesses. |
| **Excellent Classification** | Reads, classifies, routes. Reduces human involvement by 80%. |
| **Workflow-Oriented Thinking** | Check condition → perform action. Pushes processes forward. |
| **Consistency & Reliability** | Logs everything, retries failures, maintains idempotency. |

---

## 3. Scope

### 3.1 What Belongs in Admin

Admin workflows MUST focus on internal operations:

- Email & message classification (Gmail)
- Extracting internal tasks (→ Notion)
- Internal reminders & scheduling
- Dashboards for internal business operations
- Background monitors (cron jobs)
- Queue processors (pending tasks, operator queues)
- Internal data cleanup or reconciliation
- Knowledge base population for RAG
- Staff notifications (NOT customer messages)
- Internal system orchestration & routing

### 3.2 What Does NOT Belong in Admin

If the action is customer-facing or department-specific, DO NOT put it in Admin.

| Use Case | Correct Category |
|----------|------------------|
| Customer messages, tickets | `customer-service/` |
| Invoicing, accounting, Xero | `finance/` |
| Leads, follow-up, quotations | `sales/` |
| Installation scheduling, ServiceM8 | `operations/` |
| Supplier PO, vendor ETA | `vendor-operation/` |
| Shopify order events | `shopify/` |
| System/infra monitoring | `technology/` |

Admin never performs actions owned by another department.
It may **route** tasks to them, but cannot **execute** their responsibilities.

### 3.3 Dashboard Scope Clarification

| Dashboard Type | Category |
|----------------|----------|
| Business operation dashboards (conversations, orders, tasks) | `admin/` |
| System/infrastructure dashboards (n8n health, API status, logs) | `technology/` |

---

## 4. Capabilities

The admin agent aims to achieve these 7 core capabilities:

### Roadmap

| # | Capability | Description | HOZ | TNER | WRAP |
|---|------------|-------------|-----|------|------|
| A | **Email Intelligence** | Classify, extract tasks, rank urgency, daily summary | 🔲 | 🔲 | 🔲 |
| B | **Task Automation** | Create/assign Notion tasks, update status | 🔲 | 🔲 | 🔲 |
| C | **Dashboard Generation** | Internal monitoring, daily briefing | 🔲 | ✅ | 🔲 |
| D | **Background Monitoring** | Stock, messages, invoices, stuck workflows | 🔲 | ✅ | 🔲 |
| E | **Queue Processing** | Reply queue, notification queue, cleanup | 🔲 | ✅ | 🔲 |
| F | **Knowledge Base (RAG)** | Embeddings, vector store maintenance | 🔲 | ✅ | 🔲 |
| G | **Reminders & Scheduling** | Deadlines, contracts, follow-ups | 🔲 | 🔲 | 🔲 |

Legend: ✅ Built | 🔲 Planned

### A. Email Intelligence & Inbox Management

- Read, classify, and tag emails (Gmail)
- Extract tasks automatically → Notion
- Rank by urgency (high/medium/low)
- Generate daily inbox summary

### B. Internal Task Automation

- Create Notion tasks
- Assign tasks to correct department
- Update status based on events
- Close loops automatically

### C. Dashboard Generation

- Internal monitoring dashboards
- Company daily briefing page
- One URL → everything before day starts

### D. Background Monitoring

- Low-stock checks
- Unanswered customer messages
- Pending invoices
- Slow vendor ETAs
- Workflow stuck states
- Orders without installers

### E. Queue Processing

- Operator reply queue
- Notification queue
- RAG batching jobs
- Data cleanups

### F. Knowledge Base Management (RAG Housekeeping)

- Watch for new documents
- Convert to embeddings
- Insert into vector store
- Remove outdated entries
- Maintain metadata

### G. Internal Reminders & Scheduling

- Deadline reminders
- Legal timeline monitoring
- Expiring contracts alerts
- HR onboarding schedules
- Meeting notes & follow-ups

---

## 5. Workflow Inventory

### A. Email Intelligence

| Company | Workflow | Status |
|---------|----------|--------|
| HOZ | `hoz-email-classifier.json` | 🔲 Planned |
| TNER | `tner-email-classifier.json` | 🔲 Planned |
| WRAP | `wrap-email-classifier.json` | 🔲 Planned |
| ALL | `daily-inbox-summary.json` | 🔲 Planned |

### B. Task Automation

| Company | Workflow | Status |
|---------|----------|--------|
| ALL | `task-router.json` | 🔲 Planned |

### C. Dashboard Generation

| Company | Workflow | Status |
|---------|----------|--------|
| TNER | `tner-dashboard.json` | ✅ Built |
| HOZ | `hoz-dashboard.json` | 🔲 Planned |
| WRAP | `wrap-dashboard.json` | 🔲 Planned |

### D. Background Monitoring

| Company | Workflow | Status |
|---------|----------|--------|
| TNER | `tner-human-conversation-monitor.json` | ✅ Built |
| HOZ | `hoz-lowstock-monitor.json` | 🔲 Planned |
| ALL | `workflow-health-monitor.json` | 🔲 Planned |

### E. Queue Processing

| Company | Workflow | Status |
|---------|----------|--------|
| TNER | `tner-dashboard-reply-handler.json` | ✅ Built |

### F. Knowledge Base (RAG)

| Company | Workflow | Status |
|---------|----------|--------|
| TNER | `tner-populate-knowledge-base.json` | ✅ Built |
| HOZ | `hoz-populate-knowledge-base.json` | 🔲 Planned |
| WRAP | `wrap-populate-knowledge-base.json` | 🔲 Planned |

### G. Reminders & Scheduling

| Company | Workflow | Status |
|---------|----------|--------|
| ALL | `deadline-reminder.json` | 🔲 Planned |
| ALL | `contract-expiry-monitor.json` | 🔲 Planned |

---

## 6. Workflow Patterns

Admin workflows fall into 5 approved patterns.

### 6.1 Dashboard Pattern

Internal dashboards delivered as HTML over webhook.

```
Webhook (GET)
→ Parse query params
→ Supabase query
→ Code (transform)
→ Code (HTML template)
→ Webhook Response (text/html)
```

**Rules:**
- Must load < 800ms where possible
- Use consistent CSS template
- No inline secrets
- No customer PII exposed
- Webhook path: `/webhook/admin/{company}/{function}`

### 6.2 Background Monitor Pattern

Scheduled evaluations that take action based on conditions.

```
Cron
→ Query for condition
→ IF/Filter
→ Action (notify, update, route)
```

**Rules:**
- Must be idempotent (same run twice = safe)
- Must handle empty results gracefully
- Must log actions taken

### 6.3 Queue Processor Pattern

Processes pending items from a queue table.

```
Cron
→ Fetch pending items (LIMIT N)
→ Loop over each
→ Try Action
→ Mark complete OR log error
```

**Rules:**
- Never double-send or double-process
- Must track timestamps and statuses
- Must isolate failures without halting the queue

### 6.4 Knowledge Base Population Pattern (RAG)

Transforms external content into embeddings and stores them.

```
Manual or Cron Trigger
→ Fetch data (file, API, webhook)
→ Clean/transform
→ Generate embeddings (OpenAI)
→ Insert into Supabase vector store
```

**Rules:**
- Must preserve metadata
- Must avoid duplicate embeddings
- Must store version/hash for future updates

### 6.5 Email Classifier Pattern

Reads emails from Gmail and routes to appropriate queues.

```
Cron or Webhook
→ Fetch unread emails (Gmail)
→ Classify (department, urgency)
→ Extract tasks
→ Create Notion tasks
→ Mark email processed
```

**Rules:**
- Must not reply to emails (routing only)
- Must extract structured task data
- Must handle attachments appropriately

---

## 7. Task Extraction Format

When extracting tasks from emails or messages, use this structure:

```json
{
  "company": "HOZ | TNER | WRAP",
  "department": "finance | legal | ops | sales | vendor | hr | admin",
  "priority": "high | medium | low",
  "action": "clear description of task",
  "deadline": "ISO date or null",
  "source": "email | system | manual",
  "reference_id": "email_id or source_id"
}
```

---

## 8. Routing Rules

Admin agent **may route**, never execute cross-department responsibilities.

### Allowed Routing

- Route "invoice overdue" → Finance workflow
- Route "customer unhappy" → Customer Service workflow
- Route "lead follow-up" → Sales workflow
- Route "installer missing photo" → Operations workflow
- Route "supplier delay" → Vendor-operation workflow

### Forbidden Actions

Admin agent MUST NOT:

- Send WhatsApp messages to customers
- Create invoices in Xero
- Assign installers in ServiceM8
- Close customer tickets
- Create Purchase Orders
- Respond to customer emails

These must be delegated to the owning department.

---

## 9. Credentials

Each workflow MUST use only its company's credentials.

| Company | Supabase | Gmail | Notion |
|---------|----------|-------|--------|
| HOZ | `Supabase HOZ` | `Gmail HOZ` | `Notion HOZ` |
| TNER | `Supabase TNER` | `Gmail TNER` | `Notion TNER` |
| WRAP | `Supabase WRAP` | `Gmail WRAP` | `Notion WRAP` |

**Forbidden:**
- HOZ workflow using TNER Supabase
- TNER workflow using WRAP credentials
- Cross-company data mixing

---

## 10. Database Tables

### TNER

| Table | Purpose |
|-------|---------|
| `conversations` | Chat conversation records |
| `conversation_messages` | Individual messages |
| `tner_conversations` | Conversation state/mode |
| `tner_operator_replies` | Human reply queue |
| `product_knowledge` | RAG vector store |

### HOZ

| Table | Purpose |
|-------|---------|
| *(to be documented)* | |

### WRAP

| Table | Purpose |
|-------|---------|
| *(to be documented)* | |

### Shared

| Table | Purpose |
|-------|---------|
| `admin_logs` | Action logging for all admin workflows |
| `admin_tasks` | Extracted tasks from email/system |

---

## 11. External Integrations

| Service | Purpose | Auth |
|---------|---------|------|
| Gmail | Email source | OAuth2 |
| Notion | Task destination | API key |
| Supabase | Database & vector store | API key |
| OpenAI | Embeddings & AI | API key |
| WhatsApp Business API | Staff notifications | Bearer token |

---

## 12. Standards

### Logging

Every admin workflow must log actions:

```json
{
  "workflow": "hoz-email-classifier",
  "timestamp": "ISO-8601",
  "company": "HOZ",
  "action": "classified-email",
  "result": "success | error",
  "details": { }
}
```

- Store in Supabase `admin_logs` table OR send to logging workflow
- No silent errors allowed

### Error Handling

- Retry × 3 with exponential backoff
- Error capture and routing
- Human notification if fatal

Fatal errors must produce:
```
ADMIN-AGENT-ERROR: {workflow} - {error_summary}
```

### Security

- No customer PII in logs or dashboards
- No secrets in HTML responses
- No cross-company data mixing
- All workflows must be idempotent
- Webhook paths: `/webhook/admin/{company}/{function}`

---

## 13. Deployment Checklist

Before deploying any admin workflow:

- [ ] Filename follows naming convention
- [ ] Workflow name in JSON matches convention
- [ ] Uses approved pattern (dashboard, monitor, queue, KB, email)
- [ ] Correct company credentials selected
- [ ] Tested locally with sample data
- [ ] Error handling implemented
- [ ] Logging implemented

---

## 14. Quick Reference

```
# Deploy admin workflow (ask Cursor)
"Deploy workflows/admin/{company}-{function}.json to n8n"

# Deploy and activate (ask Cursor)
"Deploy workflows/admin/{company}-{function}.json to n8n and activate it"

# Export latest from n8n (ask Cursor)
"Export workflow ID {id} to workflows/admin/"

# List all workflows
"List all workflows in n8n"
```

**MCP Tools Used:**
- `n8n_create_workflow` — create new workflow
- `n8n_update_full_workflow` — update existing workflow
- `n8n_get_workflow` — export workflow by ID
- `n8n_update_partial_workflow` — rename, activate, partial edits

---

## 15. Next Steps (Priority Order)

1. **A. Email Intelligence** — Gmail classifier for all 3 companies
2. **B. Task Automation** — Notion integration for extracted tasks
3. **G. Reminders** — Deadline and contract monitoring
4. **C. Dashboard** — HOZ and WRAP dashboards
