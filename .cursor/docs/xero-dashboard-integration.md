---
created: 2025-12-09
updated: 2025-12-10
---

# Xero ↔ Dashboard ↔ AI-Core Integration

## Overview

This document describes the n8n workflow system connecting 3 separate companies to Xero.

### Companies & Business Models

| Company | Business Model | Core Entity | Key Document |
|---------|---------------|-------------|--------------|
| **HOZ** | B2C Home Improvement | Installation Job | Invoice |
| **TNER** | B2C Luggage Rental | Rental Booking | Invoice |
| **WRAP** | B2B Renovation Services | Project | Quotation → Invoice |

### System Components

- **Dashboard** (Next.js) - Company-specific forms and views
- **AI-Core** - WhatsApp/Telegram AI agents per company
- **Xero** - 3 separate tenants (one per company)
- **Supabase** - Single project, separate tables per company
- **n8n** - 15 workflows (5 per company)

---

## Data Architecture

### Single Source of Truth (SSOT)

| Data Type | SSOT Location | Reason |
|-----------|---------------|--------|
| **Financial** (amounts, payments, tax) | **Xero** | Accountant needs it there |
| **Operational** (scheduling, status, notes) | **Supabase** | Xero doesn't support these fields |

### Database Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPABASE (Single Project)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   HOZ Tables                TNER Tables              WRAP Tables     │
│   ══════════                ════════════             ═══════════     │
│   hoz_jobs                  tner_rentals             wrap_projects   │
│   hoz_job_payments          tner_payments            wrap_payments   │
│                                                      wrap_partners   │
│                                                                      │
│   Shared Tables                                                      │
│   ═════════════                                                      │
│   xero_contacts (company column)                                     │
│   xero_items (company column)                                        │
│   workflow_logs                                                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ENTRY POINTS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────┐          ┌──────────────────┐                        │
│   │    DASHBOARD     │          │     AI-CORE      │                        │
│   │   (Next.js)      │          │  (AI Agents)     │                        │
│   │                  │          │                  │                        │
│   │  • HOZ Forms     │          │  • HOZ WhatsApp  │                        │
│   │  • TNER Forms    │          │  • TNER WhatsApp │                        │
│   │  • WRAP Forms    │          │  • WRAP WhatsApp │                        │
│   │  • Calendar View │          │                  │                        │
│   └────────┬─────────┘          └────────┬─────────┘                        │
│            │                              │                                  │
│            │      HTTP Webhooks (company-specific)                          │
│            └──────────────┬───────────────┘                                  │
│                           ▼                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       n8n WORKFLOW HUB (15 Workflows)                        │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         HOZ WORKFLOWS (5)                            │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │  POST /hoz/jobs           │ Create/Update installation jobs         │   │
│   │  GET  /hoz/contacts       │ Customer autocomplete                   │   │
│   │  GET  /hoz/items          │ Product dropdown (locks, doors, gates)  │   │
│   │  POST /hoz/payments       │ Record payment + photo                  │   │
│   │  CRON hourly              │ Xero sync                               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        TNER WORKFLOWS (5)                            │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │  POST /tner/rentals       │ Create/Update rental bookings           │   │
│   │  GET  /tner/contacts      │ Customer autocomplete                   │   │
│   │  GET  /tner/items         │ Luggage sizes                           │   │
│   │  POST /tner/payments      │ Record payment + deposit                │   │
│   │  CRON hourly              │ Xero sync                               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        WRAP WORKFLOWS (5)                            │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │  POST /wrap/projects      │ Create quotation → convert to invoice   │   │
│   │  GET  /wrap/partners      │ B2B partner autocomplete                │   │
│   │  GET  /wrap/services      │ Service types                           │   │
│   │  POST /wrap/payments      │ Record payment                          │   │
│   │  CRON hourly              │ Xero sync                               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┬───────────────┐
            ▼               ▼               ▼               ▼
      ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
      │   Xero   │    │ Supabase │    │  Gmail   │    │  Photos  │
      │ 3 Tenants│    │ 1 Project│    │ (Email)  │    │(Xero Att)│
      └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

---

## Workflows Summary

### Total: 15 Workflows (5 per company)

| Company | # | Workflow | Trigger | Purpose |
|---------|---|----------|---------|---------|
| **HOZ** | 1 | hoz-job-manager | POST `/hoz/jobs` | Create/Update/Cancel installation jobs |
| | 2 | hoz-contact-search | GET `/hoz/contacts` | Customer autocomplete |
| | 3 | hoz-item-search | GET `/hoz/items` | Products: locks, doors, gates |
| | 4 | hoz-record-payment | POST `/hoz/payments` | Payment + photo → Xero |
| | 5 | hoz-xero-sync | Hourly | Sync Xero ↔ Supabase |
| **TNER** | 6 | tner-rental-manager | POST `/tner/rentals` | Create/Update rental bookings |
| | 7 | tner-contact-search | GET `/tner/contacts` | Customer autocomplete |
| | 8 | tner-item-search | GET `/tner/items` | Luggage sizes |
| | 9 | tner-record-payment | POST `/tner/payments` | Payment + deposit |
| | 10 | tner-xero-sync | Hourly | Sync Xero ↔ Supabase |
| **WRAP** | 11 | wrap-project-manager | POST `/wrap/projects` | Quotation → Invoice flow |
| | 12 | wrap-partner-search | GET `/wrap/partners` | B2B partner autocomplete |
| | 13 | wrap-service-search | GET `/wrap/services` | Service types |
| | 14 | wrap-record-payment | POST `/wrap/payments` | Payment recording |
| | 15 | wrap-xero-sync | Hourly | Sync Xero ↔ Supabase |

---

## Dashboard UI Fields by Company

When a user selects a company in the dashboard, show the appropriate form fields:

### HOZ: Installation Job Form

**Business**: B2C Home Improvement (Digital Locks, Doors, Gates)

| Section | Field | Type | Required | Notes |
|---------|-------|------|----------|-------|
| **Customer** | Customer Name | text + autocomplete | ✓ | Search `/hoz/contacts` |
| | Customer Phone | tel | ✓ | |
| | Customer Email | email | | For invoice |
| | Customer Address | textarea | ✓ | Installation location |
| **Product** | Product Type | dropdown | ✓ | `digital_lock`, `fire_door`, `gate`, `other` |
| | Product | dropdown + search | ✓ | Search `/hoz/items` |
| | Model/SKU | text | | Auto-fill from item |
| | Quantity | number | ✓ | Default: 1 |
| | Unit Price | currency | ✓ | Auto-fill from item |
| **Schedule** | Installation Date | date picker | ✓ | |
| | Installation Time | dropdown | | `9am-12pm`, `12pm-3pm`, `3pm-6pm` |
| **Notes** | Internal Notes | textarea | | Not sent to Xero |

**Form Actions**: `Create Job`, `Update Job`, `Cancel Job`, `Mark as Paid`

**Webhook Payload** (POST `/hoz/jobs`):

```json
{
  "action": "create",
  "job": {
    "customer_name": "John Doe",
    "customer_phone": "+6591234567",
    "customer_email": "john@example.com",
    "customer_address": "123 Main St, #01-01, S(123456)",
    "xero_contact_id": "abc-123",
    
    "product_type": "digital_lock",
    "line_items": [
      {
        "item_id": "xero-item-id",
        "code": "DL-SAMSUNG-609",
        "description": "Samsung SHP-DP609 Digital Lock",
        "quantity": 1,
        "unit_price": 450.00
      }
    ],
    
    "installation_date": "2025-01-20",
    "installation_time": "9am-12pm",
    
    "internal_notes": "Call before coming"
  }
}
```

---

### TNER: Rental Booking Form

**Business**: B2C Luggage Rental

| Section | Field | Type | Required | Notes |
|---------|-------|------|----------|-------|
| **Customer** | Customer Name | text + autocomplete | ✓ | Search `/tner/contacts` |
| | Customer Phone | tel | ✓ | |
| | Customer Email | email | | |
| **Rental** | Luggage Size | dropdown | ✓ | `cabin`, `medium`, `large` |
| | Quantity | number | ✓ | Default: 1 |
| | Start Date | date picker | ✓ | Rental begins |
| | End Date | date picker | ✓ | Rental ends |
| | Rental Days | calculated | readonly | Auto-calculate |
| **Delivery** | Delivery Type | radio | ✓ | `delivery` / `self_collect` |
| | Delivery Address | textarea | if delivery | |
| | Delivery Date | date picker | if delivery | |
| | Delivery Time | dropdown | if delivery | `9am-12pm`, `12pm-3pm`, `3pm-6pm` |
| **Return** | Return Type | radio | ✓ | `pickup` / `drop_off` |
| | Pickup Address | textarea | if pickup | |
| | Return Date | date picker | if pickup | |
| | Return Time | dropdown | if pickup | |
| **Pricing** | Rental Amount | currency | ✓ | Auto-calc: days × rate |
| | Delivery Fee | currency | | If delivery selected |
| | Deposit | currency | | Refundable |
| | **Total** | currency | readonly | Sum |

**Form Actions**: `Create Booking`, `Update Booking`, `Cancel Booking`, `Record Delivery`, `Record Return`

**Status Flow**:
```
pending → confirmed → delivered → in_use → returned → completed
                  ↓
              cancelled
```

**Webhook Payload** (POST `/tner/rentals`):

```json
{
  "action": "create",
  "rental": {
    "customer_name": "Jane Smith",
    "customer_phone": "+6598765432",
    "customer_email": "jane@example.com",
    "xero_contact_id": null,
    
    "luggage_size": "large",
    "quantity": 2,
    
    "start_date": "2025-01-15",
    "end_date": "2025-01-25",
    
    "delivery_type": "delivery",
    "delivery_address": "456 Beach Rd, S(199123)",
    "delivery_date": "2025-01-15",
    "delivery_time": "9am-12pm",
    
    "return_type": "pickup",
    "return_address": "456 Beach Rd, S(199123)",
    "return_date": "2025-01-25",
    "return_time": "3pm-6pm",
    
    "rental_amount": 200.00,
    "delivery_fee": 20.00,
    "deposit": 50.00
  }
}
```

---

### WRAP: Project/Quotation Form

**Business**: B2B Renovation Services (Partners: Interior Designers, Architects)

| Section | Field | Type | Required | Notes |
|---------|-------|------|----------|-------|
| **Partner** | Partner | dropdown + search | ✓ | Search `/wrap/partners` |
| | Partner Company | text | readonly | Auto-fill from partner |
| | Partner Type | badge | readonly | `interior_designer`, `architect`, `digital_lock_partner` |
| | Contact Person | text | | |
| **Project** | Project Name | text | ✓ | |
| | Project Address | textarea | ✓ | Site location |
| | Project Description | textarea | | Scope of work |
| **Services** | Services | multi-select | ✓ | Search `/wrap/services` |
| | Add Custom Line | button | | Manual line items |
| **Quotation** | Quotation Amount | currency | ✓ | |
| | Quote Valid Until | date picker | | Default: 30 days |
| **Timeline** | Project Start Date | date picker | | Estimated |
| | Project End Date | date picker | | Estimated |
| **Notes** | Internal Notes | textarea | | |

**Form Actions**: 
- `Create Quotation` → Creates Xero Quote
- `Send Quotation` → Emails to partner
- `Convert to Invoice` → Quote accepted, create invoice
- `Update Project`
- `Mark Complete`

**Status Flow**:
```
draft → quoted → sent → accepted → invoiced → in_progress → completed
              ↓         ↓
          rejected   expired
```

**Webhook Payload** (POST `/wrap/projects`):

```json
{
  "action": "create_quote",
  "project": {
    "partner_id": "uuid-partner",
    "partner_name": "ABC Interior Design",
    "partner_company": "ABC Pte Ltd",
    "partner_type": "interior_designer",
    "xero_contact_id": "xyz-789",
    
    "project_name": "Condo Unit Wrapping - Blk 123",
    "project_address": "123 Condo Ave, #15-01, S(123456)",
    "project_description": "Full cabinet wrapping for kitchen and wardrobes",
    
    "line_items": [
      {
        "description": "Kitchen Cabinet Wrapping",
        "quantity": 1,
        "unit_price": 2500.00
      },
      {
        "description": "Wardrobe Wrapping x3",
        "quantity": 3,
        "unit_price": 800.00
      }
    ],
    
    "quotation_amount": 4900.00,
    "quote_valid_until": "2025-02-15",
    
    "project_start_date": "2025-02-01",
    "project_end_date": "2025-02-15"
  }
}
```

**Convert Quote to Invoice** (action: `convert_to_invoice`):
```json
{
  "action": "convert_to_invoice",
  "project_id": "uuid-project",
  "xero_quote_id": "quote-123",
  "invoice_amount": 4900.00
}
```

---

## Workflow Details by Company

### HOZ Workflows

#### 1. hoz-job-manager

**Trigger**: POST `/hoz/jobs`

**Actions**:
| Action | Description | Xero API |
|--------|-------------|----------|
| `create` | New job + Xero invoice | POST `/Invoices` |
| `update` | Update job + invoice | POST `/Invoices/{id}` |
| `reschedule` | Change install date | POST `/Invoices/{id}` |
| `cancel` | Void invoice | POST `/Invoices/{id}` Status=VOIDED |

**Flow**:
```
Webhook → Validate → Get/Create Contact → Create Invoice → Save to hoz_jobs → Respond
```

#### 2. hoz-contact-search

**Trigger**: GET `/hoz/contacts?q=john`

**Returns**: Matching contacts from `xero_contacts` WHERE company='HOZ'

#### 3. hoz-item-search

**Trigger**: GET `/hoz/items?q=samsung`

**Returns**: Products from `xero_items` WHERE company='HOZ'

#### 4. hoz-record-payment

**Trigger**: POST `/hoz/payments`

**Flow**:
```
Webhook → Create Xero Payment → Upload Photo Attachment → Update hoz_jobs → Respond
```

#### 5. hoz-xero-sync

**Trigger**: Hourly schedule

**Syncs**: Xero invoices → `hoz_jobs` (payment_status, amount_paid)

---

### TNER Workflows

#### 6. tner-rental-manager

**Trigger**: POST `/tner/rentals`

**Actions**:
| Action | Description | Xero API |
|--------|-------------|----------|
| `create` | New rental booking | POST `/Invoices` |
| `update` | Update booking | POST `/Invoices/{id}` |
| `deliver` | Mark delivered | Update `tner_rentals` |
| `return` | Mark returned | Update `tner_rentals` |
| `cancel` | Cancel + void | POST `/Invoices/{id}` |

**Special Logic**: 
- Invoice includes rental + delivery fee + deposit
- Deposit tracked separately for refund

#### 7. tner-contact-search

**Trigger**: GET `/tner/contacts?q=jane`

#### 8. tner-item-search

**Trigger**: GET `/tner/items?q=large`

**Returns**: Luggage sizes with daily rates

#### 9. tner-record-payment

**Trigger**: POST `/tner/payments`

**Special**: Handles deposit separately from rental payment

#### 10. tner-xero-sync

**Trigger**: Hourly schedule

---

### WRAP Workflows

#### 11. wrap-project-manager

**Trigger**: POST `/wrap/projects`

**Actions**:
| Action | Description | Xero API |
|--------|-------------|----------|
| `create_quote` | Create Xero quotation | POST `/Quotes` |
| `send_quote` | Email quotation | POST `/Quotes/{id}/Email` |
| `accept_quote` | Mark accepted | POST `/Quotes/{id}` |
| `convert_to_invoice` | Quote → Invoice | POST `/Invoices` from Quote |
| `update` | Update project | POST `/Quotes/{id}` or `/Invoices/{id}` |
| `complete` | Mark complete | Update `wrap_projects` |

**Xero Quote → Invoice Flow**:
```
POST /wrap/projects (action: create_quote)
  → Xero POST /Quotes
  → Save xero_quote_id to wrap_projects

POST /wrap/projects (action: convert_to_invoice)
  → Xero POST /Invoices (with QuoteID reference)
  → Save xero_invoice_id to wrap_projects
```

#### 12. wrap-partner-search

**Trigger**: GET `/wrap/partners?q=abc`

**Returns**: B2B partners from `wrap_partners` table

#### 13. wrap-service-search

**Trigger**: GET `/wrap/services?q=wrap`

**Returns**: Service types/packages

#### 14. wrap-record-payment

**Trigger**: POST `/wrap/payments`

#### 15. wrap-xero-sync

**Trigger**: Hourly schedule

**Syncs**: Both quotes and invoices

---

## Database Schema

### HOZ Tables

```sql
-- HOZ: Installation Jobs
CREATE TABLE hoz_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Xero references
  xero_invoice_id TEXT UNIQUE,
  xero_invoice_number TEXT,
  xero_contact_id TEXT,
  
  -- Customer
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  customer_address TEXT NOT NULL,
  
  -- Product
  product_type TEXT,  -- 'digital_lock', 'fire_door', 'gate', 'other'
  product_model TEXT,
  
  -- Line items stored as JSONB
  line_items JSONB,
  
  -- Schedule
  installation_date DATE,
  installation_time TEXT,  -- '9am-12pm', '12pm-3pm', '3pm-6pm'
  
  -- Status
  job_status TEXT DEFAULT 'pending',  
  -- pending → confirmed → completed → cancelled
  payment_status TEXT DEFAULT 'unpaid',  
  -- unpaid → partial → paid
  
  -- Financials
  amount DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  
  -- Internal
  internal_notes TEXT,
  sync_source TEXT DEFAULT 'dashboard',  -- dashboard, n8n, xero_sync
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  synced_at TIMESTAMPTZ
);

-- HOZ: Payment records
CREATE TABLE hoz_job_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES hoz_jobs(id),
  xero_payment_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT,  -- 'cash', 'paynow', 'bank_transfer', 'card'
  reference TEXT,
  has_attachment BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hoz_jobs_status ON hoz_jobs(job_status);
CREATE INDEX idx_hoz_jobs_date ON hoz_jobs(installation_date);
CREATE INDEX idx_hoz_jobs_xero ON hoz_jobs(xero_invoice_id);
```

### TNER Tables

```sql
-- TNER: Luggage Rentals
CREATE TABLE tner_rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Xero references
  xero_invoice_id TEXT UNIQUE,
  xero_invoice_number TEXT,
  xero_contact_id TEXT,
  
  -- Customer
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  
  -- Rental details
  luggage_size TEXT NOT NULL,  -- 'cabin', 'medium', 'large'
  quantity INTEGER DEFAULT 1,
  
  -- Rental period
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rental_days INTEGER GENERATED ALWAYS AS (end_date - start_date) STORED,
  
  -- Delivery (outbound)
  delivery_type TEXT NOT NULL,  -- 'delivery', 'self_collect'
  delivery_address TEXT,
  delivery_date DATE,
  delivery_time TEXT,
  delivery_status TEXT,  -- 'scheduled', 'out_for_delivery', 'delivered'
  delivered_at TIMESTAMPTZ,
  
  -- Return (inbound)
  return_type TEXT NOT NULL,  -- 'pickup', 'drop_off'
  return_address TEXT,
  return_date DATE,
  return_time TEXT,
  return_status TEXT,  -- 'scheduled', 'collected', 'received'
  returned_at TIMESTAMPTZ,
  
  -- Status tracking
  rental_status TEXT DEFAULT 'pending',
  -- pending → confirmed → delivered → in_use → returned → completed
  -- or → cancelled
  
  -- Financials
  rental_amount DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  deposit DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (rental_amount + delivery_fee + deposit) STORED,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  deposit_refunded BOOLEAN DEFAULT false,
  payment_status TEXT DEFAULT 'unpaid',
  
  -- Internal
  internal_notes TEXT,
  sync_source TEXT DEFAULT 'dashboard',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  synced_at TIMESTAMPTZ
);

-- TNER: Payment records
CREATE TABLE tner_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID REFERENCES tner_rentals(id),
  xero_payment_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  payment_type TEXT,  -- 'rental', 'deposit', 'deposit_refund'
  payment_date DATE NOT NULL,
  payment_method TEXT,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tner_rentals_status ON tner_rentals(rental_status);
CREATE INDEX idx_tner_rentals_dates ON tner_rentals(start_date, end_date);
CREATE INDEX idx_tner_rentals_delivery ON tner_rentals(delivery_date);
```

### WRAP Tables

```sql
-- WRAP: B2B Projects (Quotation → Invoice flow)
CREATE TABLE wrap_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Xero references (both quote AND invoice)
  xero_quote_id TEXT,
  xero_quote_number TEXT,
  xero_invoice_id TEXT,
  xero_invoice_number TEXT,
  xero_contact_id TEXT,
  
  -- Partner (B2B relationship)
  partner_id UUID REFERENCES wrap_partners(id),
  partner_name TEXT NOT NULL,
  partner_company TEXT,
  partner_type TEXT,  -- 'interior_designer', 'architect', 'digital_lock_partner'
  contact_person TEXT,
  
  -- Project details
  project_name TEXT NOT NULL,
  project_address TEXT,
  project_description TEXT,
  
  -- Line items stored as JSONB
  line_items JSONB,
  
  -- Financials
  quotation_amount DECIMAL(10,2),
  invoice_amount DECIMAL(10,2),  -- May differ after negotiation
  amount_paid DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  project_status TEXT DEFAULT 'draft',
  -- draft → quoted → sent → accepted → invoiced → in_progress → completed
  -- or → rejected / expired
  payment_status TEXT DEFAULT 'unpaid',
  
  -- Dates
  quote_date DATE,
  quote_valid_until DATE,
  quote_sent_at TIMESTAMPTZ,
  quote_accepted_at TIMESTAMPTZ,
  invoice_date DATE,
  project_start_date DATE,
  project_end_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Internal
  internal_notes TEXT,
  sync_source TEXT DEFAULT 'dashboard',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  synced_at TIMESTAMPTZ
);

-- WRAP: B2B Partners
CREATE TABLE wrap_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  xero_contact_id TEXT,
  
  company_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  
  partner_type TEXT NOT NULL,  -- 'interior_designer', 'architect', 'digital_lock_partner'
  commission_rate DECIMAL(5,2),  -- If applicable
  payment_terms TEXT,  -- 'net_30', 'net_60', 'cod'
  
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- WRAP: Payment records
CREATE TABLE wrap_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES wrap_projects(id),
  xero_payment_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_wrap_projects_status ON wrap_projects(project_status);
CREATE INDEX idx_wrap_projects_partner ON wrap_projects(partner_id);
CREATE INDEX idx_wrap_partners_type ON wrap_partners(partner_type);
```

### Shared Tables

```sql
-- Shared: Xero items cache (all companies)
CREATE TABLE xero_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,  -- 'HOZ', 'TNER', 'WRAP'
  item_id TEXT NOT NULL,
  code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  unit_price DECIMAL(10,2),
  account_code TEXT,
  is_sold BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  synced_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company, item_id)
);

-- Shared: Xero contacts cache (all companies)
CREATE TABLE xero_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,  -- 'HOZ', 'TNER', 'WRAP'
  contact_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  is_customer BOOLEAN DEFAULT true,
  is_supplier BOOLEAN DEFAULT false,
  synced_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company, contact_id)
);

-- Shared: Workflow logs (debugging)
CREATE TABLE workflow_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT,
  workflow_name TEXT NOT NULL,
  execution_id TEXT,
  level TEXT DEFAULT 'info',  -- 'info', 'warn', 'error'
  message TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_xero_items_company ON xero_items(company);
CREATE INDEX idx_xero_contacts_company ON xero_contacts(company);
CREATE INDEX idx_workflow_logs_time ON workflow_logs(created_at DESC);
```

---

## Dashboard Integration

### Company-Specific API Client (TypeScript)

```typescript
// dashboard/lib/n8n-client.ts

const N8N_BASE_URL = process.env.N8N_WEBHOOK_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': N8N_API_KEY
};

// ===========================================
// HOZ API FUNCTIONS
// ===========================================

export const hozApi = {
  // Create installation job
  async createJob(job: HozJobData) {
    const response = await fetch(`${N8N_BASE_URL}/hoz/jobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'create', job })
    });
    return response.json();
  },

  // Update job
  async updateJob(job: HozJobData) {
    const response = await fetch(`${N8N_BASE_URL}/hoz/jobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'update', job })
    });
    return response.json();
  },

  // Cancel job
  async cancelJob(jobId: string) {
    const response = await fetch(`${N8N_BASE_URL}/hoz/jobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'cancel', job: { id: jobId } })
    });
    return response.json();
  },

  // Search contacts
  async searchContacts(query: string) {
    const response = await fetch(
      `${N8N_BASE_URL}/hoz/contacts?q=${encodeURIComponent(query)}`,
      { headers }
    );
    return response.json();
  },

  // Search items
  async searchItems(query: string) {
    const response = await fetch(
      `${N8N_BASE_URL}/hoz/items?q=${encodeURIComponent(query)}`,
      { headers }
    );
    return response.json();
  },

  // Record payment
  async recordPayment(jobId: string, payment: PaymentData, photoFile?: File) {
    const attachments = photoFile ? [await fileToAttachment(photoFile)] : [];
    
    const response = await fetch(`${N8N_BASE_URL}/hoz/payments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ job_id: jobId, payment, attachments })
    });
    return response.json();
  }
};

// ===========================================
// TNER API FUNCTIONS
// ===========================================

export const tnerApi = {
  // Create rental booking
  async createRental(rental: TnerRentalData) {
    const response = await fetch(`${N8N_BASE_URL}/tner/rentals`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'create', rental })
    });
    return response.json();
  },

  // Update rental
  async updateRental(rental: TnerRentalData) {
    const response = await fetch(`${N8N_BASE_URL}/tner/rentals`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'update', rental })
    });
    return response.json();
  },

  // Mark as delivered
  async markDelivered(rentalId: string, timestamp?: string) {
    const response = await fetch(`${N8N_BASE_URL}/tner/rentals`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        action: 'deliver', 
        rental: { id: rentalId, delivered_at: timestamp || new Date().toISOString() }
      })
    });
    return response.json();
  },

  // Mark as returned
  async markReturned(rentalId: string, timestamp?: string) {
    const response = await fetch(`${N8N_BASE_URL}/tner/rentals`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        action: 'return', 
        rental: { id: rentalId, returned_at: timestamp || new Date().toISOString() }
      })
    });
    return response.json();
  },

  // Cancel rental
  async cancelRental(rentalId: string) {
    const response = await fetch(`${N8N_BASE_URL}/tner/rentals`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'cancel', rental: { id: rentalId } })
    });
    return response.json();
  },

  // Search contacts
  async searchContacts(query: string) {
    const response = await fetch(
      `${N8N_BASE_URL}/tner/contacts?q=${encodeURIComponent(query)}`,
      { headers }
    );
    return response.json();
  },

  // Search items (luggage sizes)
  async searchItems(query: string) {
    const response = await fetch(
      `${N8N_BASE_URL}/tner/items?q=${encodeURIComponent(query)}`,
      { headers }
    );
    return response.json();
  },

  // Record payment
  async recordPayment(rentalId: string, payment: PaymentData) {
    const response = await fetch(`${N8N_BASE_URL}/tner/payments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ rental_id: rentalId, payment })
    });
    return response.json();
  }
};

// ===========================================
// WRAP API FUNCTIONS
// ===========================================

export const wrapApi = {
  // Create quotation
  async createQuote(project: WrapProjectData) {
    const response = await fetch(`${N8N_BASE_URL}/wrap/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'create_quote', project })
    });
    return response.json();
  },

  // Send quotation email
  async sendQuote(projectId: string, email: string, message?: string) {
    const response = await fetch(`${N8N_BASE_URL}/wrap/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        action: 'send_quote', 
        project: { id: projectId },
        to_email: email,
        message
      })
    });
    return response.json();
  },

  // Accept quotation
  async acceptQuote(projectId: string) {
    const response = await fetch(`${N8N_BASE_URL}/wrap/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'accept_quote', project: { id: projectId } })
    });
    return response.json();
  },

  // Convert quote to invoice
  async convertToInvoice(projectId: string, invoiceAmount?: number) {
    const response = await fetch(`${N8N_BASE_URL}/wrap/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        action: 'convert_to_invoice', 
        project: { id: projectId, invoice_amount: invoiceAmount }
      })
    });
    return response.json();
  },

  // Update project
  async updateProject(project: WrapProjectData) {
    const response = await fetch(`${N8N_BASE_URL}/wrap/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'update', project })
    });
    return response.json();
  },

  // Mark complete
  async markComplete(projectId: string) {
    const response = await fetch(`${N8N_BASE_URL}/wrap/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'complete', project: { id: projectId } })
    });
    return response.json();
  },

  // Search partners
  async searchPartners(query: string) {
    const response = await fetch(
      `${N8N_BASE_URL}/wrap/partners?q=${encodeURIComponent(query)}`,
      { headers }
    );
    return response.json();
  },

  // Search services
  async searchServices(query: string) {
    const response = await fetch(
      `${N8N_BASE_URL}/wrap/services?q=${encodeURIComponent(query)}`,
      { headers }
    );
    return response.json();
  },

  // Record payment
  async recordPayment(projectId: string, payment: PaymentData) {
    const response = await fetch(`${N8N_BASE_URL}/wrap/payments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ project_id: projectId, payment })
    });
    return response.json();
  }
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================

async function fileToAttachment(file: File) {
  const base64 = await fileToBase64(file);
  return {
    filename: file.name,
    content_type: file.type,
    data: base64
  };
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
  });
}

// ===========================================
// TYPE DEFINITIONS
// ===========================================

interface HozJobData {
  id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  xero_contact_id?: string;
  product_type?: string;
  line_items: LineItem[];
  installation_date: string;
  installation_time?: string;
  internal_notes?: string;
}

interface TnerRentalData {
  id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  xero_contact_id?: string;
  luggage_size: 'cabin' | 'medium' | 'large';
  quantity: number;
  start_date: string;
  end_date: string;
  delivery_type: 'delivery' | 'self_collect';
  delivery_address?: string;
  delivery_date?: string;
  delivery_time?: string;
  return_type: 'pickup' | 'drop_off';
  return_address?: string;
  return_date?: string;
  return_time?: string;
  rental_amount: number;
  delivery_fee?: number;
  deposit?: number;
}

interface WrapProjectData {
  id?: string;
  partner_id?: string;
  partner_name: string;
  partner_company?: string;
  partner_type?: string;
  xero_contact_id?: string;
  project_name: string;
  project_address?: string;
  project_description?: string;
  line_items: LineItem[];
  quotation_amount: number;
  quote_valid_until?: string;
  project_start_date?: string;
  project_end_date?: string;
}

interface LineItem {
  item_id?: string;
  code?: string;
  description: string;
  quantity: number;
  unit_price: number;
}

interface PaymentData {
  amount: number;
  payment_date: string;
  payment_method?: string;
  reference?: string;
}
```

---

## AI-Core Integration

### Agent Tools (for WhatsApp/Telegram)

```typescript
// ai-core/tools/xero-tools.ts

const N8N_BASE_URL = process.env.N8N_WEBHOOK_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

// Tool 1: Create Invoice
export const createInvoiceTool = {
  name: 'create_xero_invoice',
  description: 'Create a new invoice in Xero for a customer',
  parameters: {
    type: 'object',
    properties: {
      customer_name: { type: 'string', description: 'Customer full name' },
      customer_phone: { type: 'string', description: 'Customer phone number' },
      job_title: { type: 'string', description: 'Service or product title' },
      amount: { type: 'number', description: 'Total amount in SGD' },
      installation_date: { type: 'string', description: 'Date in YYYY-MM-DD format' }
    },
    required: ['customer_name', 'job_title', 'amount']
  },
  execute: async (params: any, context: AgentContext) => {
    const response = await fetch(`${N8N_BASE_URL}/job-manager`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': N8N_API_KEY
      },
      body: JSON.stringify({
        action: 'create',
        company: context.company,  // From agent context
        job: {
          customer_name: params.customer_name,
          customer_phone: params.customer_phone,
          job_title: params.job_title,
          amount: params.amount,
          installation_date: params.installation_date
        }
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      return `✅ Invoice ${result.xero_invoice_number} created for ${params.customer_name}. Amount: $${params.amount}`;
    } else {
      return `❌ Failed to create invoice: ${result.error}`;
    }
  }
};

// Tool 2: Get Job Status
export const getJobStatusTool = {
  name: 'get_job_status',
  description: 'Check the status of a job by invoice number',
  parameters: {
    type: 'object',
    properties: {
      invoice_number: { type: 'string', description: 'Invoice number like INV-0001' }
    },
    required: ['invoice_number']
  },
  execute: async (params: any) => {
    const response = await fetch(
      `${N8N_BASE_URL}/jobs/by-invoice/${params.invoice_number}`,
      { headers: { 'X-API-Key': N8N_API_KEY } }
    );
    
    const { job } = await response.json();
    
    if (job) {
      return `📋 Invoice ${job.xero_invoice_number}:
- Customer: ${job.customer_name}
- Service: ${job.job_title}
- Amount: $${job.amount}
- Date: ${job.installation_date}
- Status: ${job.job_status}
- Payment: ${job.payment_status}`;
    } else {
      return `❌ Invoice ${params.invoice_number} not found`;
    }
  }
};

// Tool 3: Reschedule Job
export const rescheduleJobTool = {
  name: 'reschedule_job',
  description: 'Change the installation date for a job',
  parameters: {
    type: 'object',
    properties: {
      invoice_number: { type: 'string' },
      new_date: { type: 'string', description: 'New date in YYYY-MM-DD format' }
    },
    required: ['invoice_number', 'new_date']
  },
  execute: async (params: any, context: AgentContext) => {
    // First get job by invoice number
    const getResponse = await fetch(
      `${N8N_BASE_URL}/jobs/by-invoice/${params.invoice_number}`,
      { headers: { 'X-API-Key': N8N_API_KEY } }
    );
    const { job } = await getResponse.json();
    
    if (!job) {
      return `❌ Invoice ${params.invoice_number} not found`;
    }
    
    // Reschedule
    const response = await fetch(`${N8N_BASE_URL}/job-manager`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': N8N_API_KEY
      },
      body: JSON.stringify({
        action: 'reschedule',
        company: context.company,
        job: {
          xero_invoice_id: job.xero_invoice_id,
          installation_date: params.new_date
        }
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      return `✅ Job rescheduled to ${params.new_date}`;
    } else {
      return `❌ Failed to reschedule: ${result.error}`;
    }
  }
};
```

---

## Company/Tenant Mapping

Each company has its own Xero tenant:

| Company | Xero Tenant Name | Supabase Project |
|---------|------------------|------------------|
| HOZ | Contains "HOZ" | `mflugfhpjpxuwnjrkrgp` |
| TNER | Contains "TNER" or "ALWC" | `mgldctmrbajwqcwqywjj` |
| WRAP | Contains "WRAP" | TBD |

**Tenant Detection Code**:

```javascript
// Determine company from Xero tenant name
function getCompanyFromTenant(tenantName) {
  const name = tenantName.toUpperCase();
  
  if (name.includes('HOZ')) return 'HOZ';
  if (name.includes('TNER') || name.includes('ALWC')) return 'TNER';
  if (name.includes('WRAP')) return 'WRAP';
  
  return null;  // Unknown tenant
}
```

---

## Webhook Endpoints Summary

### HOZ Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/hoz/jobs` | POST | Create/Update/Cancel installation jobs |
| `/hoz/contacts` | GET | Customer autocomplete |
| `/hoz/items` | GET | Products: locks, doors, gates |
| `/hoz/payments` | POST | Record payment + photo |
| `/hoz/jobs/:id` | GET | Get job details |

### TNER Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/tner/rentals` | POST | Create/Update/Deliver/Return rentals |
| `/tner/contacts` | GET | Customer autocomplete |
| `/tner/items` | GET | Luggage sizes |
| `/tner/payments` | POST | Record payment + deposit |
| `/tner/rentals/:id` | GET | Get rental details |

### WRAP Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/wrap/projects` | POST | Quotation → Invoice workflow |
| `/wrap/partners` | GET | B2B partner autocomplete |
| `/wrap/services` | GET | Service types |
| `/wrap/payments` | POST | Record payment |
| `/wrap/projects/:id` | GET | Get project details |

---

## Implementation Phases

### Phase 1: HOZ (Simplest Model)

**Why first**: Single touchpoint (installation), straightforward invoice flow

```
1. hoz-job-manager       → Create/Update jobs, sync to Xero
2. hoz-contact-search    → Customer autocomplete
3. hoz-item-search       → Product dropdown
4. hoz-record-payment    → Payment + photo attachment
5. hoz-xero-sync         → Background sync
```

**Database**: Create `hoz_jobs`, `hoz_job_payments` tables

**Outcome**: Full HOZ workflow operational

---

### Phase 2: TNER (Complex Rental Lifecycle)

**Why second**: Multi-touchpoint (deliver → use → return), more status tracking

```
6. tner-rental-manager   → Booking + delivery + return handling
7. tner-contact-search   → Customer autocomplete
8. tner-item-search      → Luggage sizes
9. tner-record-payment   → Payment + deposit handling
10. tner-xero-sync       → Background sync
```

**Database**: Create `tner_rentals`, `tner_payments` tables

**Outcome**: Full rental booking system operational

---

### Phase 3: WRAP (B2B Quotation Flow)

**Why last**: Quote → Invoice conversion, B2B partner management

```
11. wrap-project-manager → Quotation → Invoice workflow
12. wrap-partner-search  → B2B partner autocomplete
13. wrap-service-search  → Service types
14. wrap-record-payment  → Payment recording
15. wrap-xero-sync       → Background sync
```

**Database**: Create `wrap_projects`, `wrap_partners`, `wrap_payments` tables

**Xero API**: Uses `/Quotes` endpoint (different from HOZ/TNER)

**Outcome**: Full B2B project & quotation system operational

---

### Phase 4: AI Integration (All Companies)

```
16. Connect AI-Core tools to each company's workflows
17. WhatsApp bot for HOZ (installation inquiries)
18. WhatsApp bot for TNER (rental bookings)
19. WhatsApp bot for WRAP (quote requests)
```

**Outcome**: AI agents can create/query across all companies

---

### Build Order Summary

| Order | Company | Workflows | Complexity |
|-------|---------|-----------|------------|
| 1st | HOZ | 1-5 | ⭐⭐ Medium |
| 2nd | TNER | 6-10 | ⭐⭐⭐ High |
| 3rd | WRAP | 11-15 | ⭐⭐⭐⭐ Complex |
| 4th | AI | Tools | ⭐⭐ Medium |

---

## n8n Node Reference

### Key Nodes Used

| Node | Type | Purpose |
|------|------|---------|
| `n8n-nodes-base.webhook` | Trigger | API endpoints |
| `n8n-nodes-base.scheduleTrigger` | Trigger | Background sync |
| `n8n-nodes-base.httpRequest` | Action | Xero API calls |
| `n8n-nodes-base.supabase` | Action | Database operations |
| `n8n-nodes-base.switch` | Logic | Route by action type |
| `n8n-nodes-base.if` | Logic | Conditional branching |
| `n8n-nodes-base.code` | Transform | Data transformation |
| `n8n-nodes-base.respondToWebhook` | Action | Return API response |
| `n8n-nodes-base.splitInBatches` | Loop | Process multiple items |

### Xero API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/connections` | GET | List Xero tenants |
| `/api.xro/2.0/Invoices` | GET/POST | Manage invoices |
| `/api.xro/2.0/Contacts` | GET/POST | Manage contacts |
| `/api.xro/2.0/Items` | GET | List products |
| `/api.xro/2.0/Payments` | POST | Record payments |
| `/api.xro/2.0/Invoices/{id}/Attachments/{filename}` | PUT | Upload photos |
| `/api.xro/2.0/Invoices/{id}/Email` | POST | Send invoice email |

---

## Credentials Required

| Service | Credential Type | Notes |
|---------|-----------------|-------|
| Xero | `xeroOAuth2Api` | OAuth2 connection to Xero |
| Supabase | `supabaseApi` | One per company (HOZ/TNER/WRAP) |
| Gmail | `gmailOAuth2` | For invoice emails (optional) |

---

## File Naming Convention

Per workspace rules, each company has its own workflows:

### HOZ Workflows

| # | Filename | JSON Name |
|---|----------|-----------|
| 1 | `hoz-job-manager.json` | `HOZ \| Finance \| job-manager` |
| 2 | `hoz-contact-search.json` | `HOZ \| Finance \| contact-search` |
| 3 | `hoz-item-search.json` | `HOZ \| Finance \| item-search` |
| 4 | `hoz-record-payment.json` | `HOZ \| Finance \| record-payment` |
| 5 | `hoz-xero-sync.json` | `HOZ \| Finance \| xero-sync` |

### TNER Workflows

| # | Filename | JSON Name |
|---|----------|-----------|
| 6 | `tner-rental-manager.json` | `TNER \| Finance \| rental-manager` |
| 7 | `tner-contact-search.json` | `TNER \| Finance \| contact-search` |
| 8 | `tner-item-search.json` | `TNER \| Finance \| item-search` |
| 9 | `tner-record-payment.json` | `TNER \| Finance \| record-payment` |
| 10 | `tner-xero-sync.json` | `TNER \| Finance \| xero-sync` |

### WRAP Workflows

| # | Filename | JSON Name |
|---|----------|-----------|
| 11 | `wrap-project-manager.json` | `WRAP \| Finance \| project-manager` |
| 12 | `wrap-partner-search.json` | `WRAP \| Finance \| partner-search` |
| 13 | `wrap-service-search.json` | `WRAP \| Finance \| service-search` |
| 14 | `wrap-record-payment.json` | `WRAP \| Finance \| record-payment` |
| 15 | `wrap-xero-sync.json` | `WRAP \| Finance \| xero-sync` |

All workflows stored in: `workflows/finance/`

---

## Xero API Reference (Detailed)

### Important Limitations

The **native n8n Xero node** only supports:
- Contacts: Create, Get, GetAll, Update
- Invoices: Create, Get, GetAll, Update

**For all other operations, use HTTP Request node:**

| Operation | Native Node | HTTP Request Required |
|-----------|-------------|----------------------|
| Create Invoice | ✅ Yes | Optional |
| Upload Attachment | ❌ No | ✅ Required |
| Bank Transactions | ❌ No | ✅ Required |
| Record Payments | ❌ No | ✅ Required |
| Multi-tenant control | Partial | ✅ Full control |

---

### Multi-Tenant OAuth2 Configuration

Each company (HOZ/TNER/WRAP) has its own Xero tenant. Every API call must include the `xero-tenant-id` header.

**Step 1: Get Available Tenants**

```
GET https://api.xero.com/connections

Response:
[
  {
    "id": "a1b2c3d4-1111-2222-3333-444455556666",
    "tenantId": "c9c062fb-aaaa-bbbb-cccc-ddddeeeeffff",
    "tenantType": "ORGANISATION",
    "tenantName": "HOZ Trading Pte Ltd",
    "createdDateUtc": "2024-05-10T10:00:00Z"
  },
  {
    "tenantId": "d8e9f0a1-2222-3333-4444-555566667777",
    "tenantName": "TNER Pte Ltd"
  }
]
```

**Step 2: HTTP Request Node Headers (for every Xero call)**

```json
{
  "xero-tenant-id": "={{$json['tenantId']}}",
  "Accept": "application/json",
  "Content-Type": "application/json"
}
```

**n8n HTTP Request Node Config:**
- **Method**: GET/POST
- **URL**: `https://api.xero.com/api.xro/2.0/{endpoint}`
- **Authentication**: Predefined Credential Type → Xero
- **Headers**: As above (add via expression)

---

### Create Invoice - Full Payload Example

**Endpoint:** `POST https://api.xero.com/api.xro/2.0/Invoices`

**Payload Structure:**

```json
{
  "Invoices": [
    {
      "Type": "ACCREC",
      "Contact": {
        "ContactID": "c3ed6a30-1234-5678-9abc-0123456789ab"
      },
      "Date": "2025-01-10",
      "DueDate": "2025-01-24",
      "InvoiceNumber": "INV-10025",
      "Reference": "Dashboard Job #12345",
      "LineAmountTypes": "Exclusive",
      "LineItems": [
        {
          "Description": "Samsung SHP-DP609 Digital Lock",
          "Quantity": 1,
          "UnitAmount": 350.00,
          "AccountCode": "200",
          "TaxType": "OUTPUT2",
          "ItemCode": "DL-SAMSUNG-609"
        },
        {
          "Description": "Installation Service",
          "Quantity": 1,
          "UnitAmount": 80.00,
          "AccountCode": "200",
          "TaxType": "OUTPUT2"
        }
      ],
      "Status": "AUTHORISED"
    }
  ]
}
```

**n8n Expression Example (using $json from previous node):**

```json
{
  "Invoices": [
    {
      "Type": "ACCREC",
      "Contact": {
        "ContactID": "={{ $json.xero_contact_id }}"
      },
      "Date": "={{ $json.job.installation_date }}",
      "DueDate": "={{ $now.plus(14, 'days').toFormat('yyyy-MM-dd') }}",
      "InvoiceNumber": "={{ $json.invoice_number }}",
      "LineAmountTypes": "Exclusive",
      "LineItems": "={{ $json.job.line_items }}",
      "Status": "AUTHORISED"
    }
  ]
}
```

**Important Notes:**
- Use `ContactID` when you have it (from lookup)
- Set `LineAmountTypes` to match your pricing (Exclusive = add GST on top)
- Use existing `AccountCode` from Xero Chart of Accounts
- Create as `DRAFT` first if validation needed, then update to `AUTHORISED`

---

### Create/Lookup Contact

**Lookup Contact by Email:**

```
GET https://api.xero.com/api.xro/2.0/Contacts?where=EmailAddress=="customer@example.com"

Response:
{
  "Contacts": [
    {
      "ContactID": "c3ed6a30-1234-5678-9abc-0123456789ab",
      "Name": "John Doe",
      "EmailAddress": "customer@example.com",
      "IsCustomer": true
    }
  ]
}
```

**n8n URL Expression (URL-encoded):**

```
https://api.xero.com/api.xro/2.0/Contacts?where=EmailAddress%3D%3D%22{{ $json.customer_email }}%22
```

**Create New Contact:**

```
POST https://api.xero.com/api.xro/2.0/Contacts

{
  "Contacts": [
    {
      "Name": "John Doe",
      "FirstName": "John",
      "LastName": "Doe",
      "EmailAddress": "john@example.com",
      "IsCustomer": true,
      "Addresses": [
        {
          "AddressType": "STREET",
          "AddressLine1": "123 Main St",
          "City": "Singapore",
          "PostalCode": "123456",
          "Country": "SG"
        }
      ],
      "Phones": [
        {
          "PhoneType": "DEFAULT",
          "PhoneNumber": "+6591234567"
        }
      ]
    }
  ]
}
```

**Contact Upsert Pattern (n8n flow):**

```
Webhook → HTTP GET /Contacts (search) → IF exists?
  → Yes: Use existing ContactID
  → No: HTTP POST /Contacts → Get new ContactID
→ Continue to Create Invoice
```

---

### Upload Attachment to Invoice

**Endpoint:** `POST https://api.xero.com/api.xro/2.0/Invoices/{InvoiceID}/Attachments/{FileName}`

**HTTP Request Node Config:**

| Setting | Value |
|---------|-------|
| Method | POST |
| URL | `https://api.xero.com/api.xro/2.0/Invoices/={{ $json.InvoiceID }}/Attachments/={{ $binary.data.fileName }}` |
| Authentication | Predefined Credential → Xero |
| Content-Type | `application/octet-stream` |
| Body Type | Binary |
| Send Binary Data | ✅ Yes |
| Binary Property | `data` |

**Headers:**
```json
{
  "xero-tenant-id": "={{ $json.tenantId }}",
  "Content-Type": "application/octet-stream",
  "Accept": "application/json"
}
```

**Important:** The file must be in binary format on the n8n item. For base64-encoded files from webhook:

```javascript
// Code node to convert base64 to binary
const base64Data = $json.attachments[0].data;
const fileName = $json.attachments[0].filename;
const mimeType = $json.attachments[0].content_type;

const binaryData = Buffer.from(base64Data, 'base64');

return {
  json: $json,
  binary: {
    data: {
      data: binaryData.toString('base64'),
      fileName: fileName,
      mimeType: mimeType
    }
  }
};
```

---

### Record Payment

**Endpoint:** `POST https://api.xero.com/api.xro/2.0/Payments`

**Payload:**

```json
{
  "Payments": [
    {
      "Invoice": {
        "InvoiceID": "abc-456-def"
      },
      "Account": {
        "Code": "090"
      },
      "Date": "2025-01-15",
      "Amount": 350.00,
      "Reference": "PayNow TXN123"
    }
  ]
}
```

**Notes:**
- `Account.Code` should be your bank account code from Xero
- PayNow typically uses a clearing account

---

### Send Invoice Email

**Endpoint:** `POST https://api.xero.com/api.xro/2.0/Invoices/{InvoiceID}/Email`

**Payload (optional customization):**

```json
{
  "MessageSubject": "Invoice INV-0001 from HOZ",
  "MessageBody": "Please find your invoice attached. Thank you for your business!"
}
```

---

## Supabase Webhook Integration

### When to Use Supabase Webhooks vs n8n Webhooks

| Trigger Source | Use Case |
|----------------|----------|
| **n8n Webhook** | Dashboard/AI-Core calls n8n directly |
| **Supabase Database Webhook** | React to database changes (INSERT/UPDATE/DELETE) |

For our architecture, we use **n8n Webhooks** as the primary trigger (dashboard calls n8n). Supabase webhooks are optional for real-time sync scenarios.

---

### Supabase Database Webhook Payload Structure

When Supabase triggers a webhook on table events:

**INSERT Payload:**

```json
{
  "type": "INSERT",
  "table": "installation_jobs",
  "schema": "public",
  "record": {
    "id": "f8e3d6f4-1234-5678-9abc-def012345678",
    "company": "HOZ",
    "customer_name": "John Doe",
    "job_status": "pending",
    "created_at": "2025-01-15T10:00:00Z"
  },
  "old_record": null
}
```

**UPDATE Payload:**

```json
{
  "type": "UPDATE",
  "table": "installation_jobs",
  "schema": "public",
  "record": {
    "id": "f8e3d6f4-1234-5678-9abc-def012345678",
    "job_status": "completed",
    "updated_at": "2025-01-15T14:30:00Z"
  },
  "old_record": {
    "id": "f8e3d6f4-1234-5678-9abc-def012345678",
    "job_status": "pending",
    "updated_at": "2025-01-15T10:00:00Z"
  }
}
```

**Accessing in n8n:**

```javascript
// In Code node or expressions
const eventType = $json.body.type;           // "INSERT" or "UPDATE"
const table = $json.body.table;              // "installation_jobs"
const record = $json.body.record;            // New data
const oldRecord = $json.body.old_record;     // Previous data (UPDATE only)
const jobId = record.id;
const newStatus = record.job_status;
const oldStatus = oldRecord?.job_status;
```

---

### Supabase Webhook Configuration

**In Supabase Dashboard:**

1. Go to **Database → Webhooks**
2. Click **New Webhook**
3. Configure:
   - **Name**: `n8n_job_updates`
   - **Table**: `installation_jobs`
   - **Events**: ☑ INSERT ☑ UPDATE
   - **Webhook URL**: Your n8n Production Webhook URL
   - **HTTP Method**: POST
   - **Headers**: Add `X-Webhook-Secret: your-secret-key`

**Validate Secret in n8n:**

```javascript
// Code node - validate webhook secret
const expectedSecret = $env.SUPABASE_WEBHOOK_SECRET;
const receivedSecret = $json.headers['x-webhook-secret'];

if (receivedSecret !== expectedSecret) {
  throw new Error('Invalid Supabase webhook secret');
}

return items;
```

---

## Best Practices & Patterns

### 1. Avoid Infinite Loops

When n8n writes to Supabase, and Supabase has webhooks that call n8n, you can create infinite loops.

**Solution: Add Source Tracking**

```sql
-- Add column to track update source
ALTER TABLE installation_jobs 
ADD COLUMN sync_source TEXT DEFAULT 'dashboard';
-- Values: 'dashboard', 'n8n', 'xero_sync'
```

**In n8n Upsert:**

```json
{
  "id": "={{ $json.job_id }}",
  "job_status": "processed",
  "sync_source": "n8n",
  "synced_at": "={{ new Date().toISOString() }}"
}
```

**In Webhook Handler:**

```javascript
// Skip if self-triggered
if ($json.body.record.sync_source === 'n8n') {
  return [];  // Skip processing
}

// Also skip if job already processed
if ($json.body.record.job_status === 'processed') {
  return [];
}

return items;
```

---

### 2. Idempotent Operations

Design workflows to be safely re-runnable:

```javascript
// Check if already processed before doing work
const existing = await supabase
  .from('installation_jobs')
  .select('xero_invoice_id')
  .eq('id', jobId)
  .single();

if (existing.xero_invoice_id) {
  // Already has invoice, update instead of create
  return { action: 'update', invoiceId: existing.xero_invoice_id };
} else {
  return { action: 'create' };
}
```

---

### 3. Contact Lookup/Create Pattern

Always check if contact exists before creating:

```
┌─────────────────┐
│ Get customer    │
│ email/name      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ HTTP GET        │
│ /Contacts?where │
│ EmailAddress==  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ IF contacts     │ Yes │ Use existing    │
│ array length > 0│────►│ ContactID       │
└────────┬────────┘     └────────┬────────┘
         │ No                     │
         ▼                        │
┌─────────────────┐               │
│ HTTP POST       │               │
│ /Contacts       │               │
│ (create new)    │               │
└────────┬────────┘               │
         │                        │
         └──────────┬─────────────┘
                    │
                    ▼
            ┌─────────────────┐
            │ Use ContactID   │
            │ for Invoice     │
            └─────────────────┘
```

---

### 4. Error Handling

Wrap Xero API calls with error handling:

```javascript
// Code node for error handling
try {
  const response = $json;
  
  if (response.ErrorNumber) {
    // Xero returned an error
    return {
      success: false,
      error: response.Message,
      errorCode: response.ErrorNumber
    };
  }
  
  // Success
  return {
    success: true,
    invoiceId: response.Invoices[0].InvoiceID,
    invoiceNumber: response.Invoices[0].InvoiceNumber
  };
  
} catch (e) {
  return {
    success: false,
    error: e.message
  };
}
```

---

### 5. Batch Operations with SplitInBatches

For syncing multiple items:

```
Schedule Trigger → GET /Items from Xero → SplitInBatches (10 per batch)
  → For each batch: Upsert to Supabase
  → Wait 100ms between batches (rate limiting)
```

**SplitInBatches Node Config:**
- Batch Size: 10
- Options: Reset on every execution ✅

---

### 6. Supabase Upsert Pattern

Use `ON CONFLICT` for deterministic upserts:

**Via HTTP Request to Supabase REST:**

```
POST https://<project>.supabase.co/rest/v1/xero_items

Headers:
{
  "apikey": "{{ $env.SUPABASE_SERVICE_KEY }}",
  "Authorization": "Bearer {{ $env.SUPABASE_SERVICE_KEY }}",
  "Content-Type": "application/json",
  "Prefer": "resolution=merge-duplicates,return=representation"
}

Body:
{
  "company": "HOZ",
  "item_id": "xero-item-123",
  "code": "DL-SAMSUNG",
  "name": "Samsung Digital Lock",
  "unit_price": 350.00,
  "synced_at": "2025-01-15T10:00:00Z"
}
```

**Via Supabase Node:**
- Resource: Row
- Operation: Upsert
- Table: `xero_items`
- On Conflict: `company, item_id`

---

### 7. Logging & Observability

Create a `workflow_logs` table for debugging:

```sql
CREATE TABLE workflow_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name TEXT NOT NULL,
  execution_id TEXT,
  level TEXT DEFAULT 'info',  -- info, warn, error
  message TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Log from n8n:**

```javascript
// Code node - log to Supabase
return {
  workflow_name: 'job-manager',
  execution_id: $execution.id,
  level: 'info',
  message: 'Invoice created successfully',
  payload: {
    job_id: $json.job_id,
    xero_invoice_id: $json.xero_invoice_id
  }
};
// → Supabase Insert to workflow_logs
```

---

## Research Sources

This documentation was enhanced with research from:

1. **n8n Official Docs** - Xero node, Webhook node, Supabase node
2. **Xero Developer API** - Invoice, Contact, Payment, Attachment endpoints
3. **Perplexity Research** - Multi-tenant OAuth2 patterns, API best practices
4. **n8n Community Templates** - Invoice processing workflows
5. **Supabase Docs** - Database webhooks, REST API

---

## Related Documentation

- [n8n MCP Rules](../rules/n8n-mcp.mdc) - Workflow building guidelines
- [Workflow Naming](../rules/workflow-naming.mdc) - Naming conventions
- [How to Deploy](./how-to-deploy.md) - Deployment process


