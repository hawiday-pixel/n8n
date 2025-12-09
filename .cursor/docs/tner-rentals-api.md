---
created: 2025-12-09
updated: 2025-12-09
---

# TNER Rentals API - Integration Guide for ai-core

## Overview

This document describes how **ai-core** should integrate with the TNER Rental Manager n8n workflow to manage luggage rentals, Xero invoices, and Supabase records.

## Endpoint

```
POST https://n8n.srv1081114.hstgr.cloud/webhook/tner/rentals
Content-Type: application/json
```

## Source of Truth (CRITICAL)

| Data Type | Source | ai-core Behavior |
|-----------|--------|------------------|
| **Financials** (amounts, payment) | Xero | Read from Xero, write via this API |
| **Logistics** (dates, status) | Supabase | Read/write via Supabase directly OR this API |

**Rule**: When updating `rental_amount` or `delivery_fee`, the workflow automatically updates Xero first, then Supabase.

---

## Actions

### 1. CREATE - New Rental + Xero Invoice

Creates a rental record in Supabase AND creates an AUTHORISED invoice in Xero.

**Request:**
```json
{
  "action": "create",
  "rental": {
    "customer_name": "John Doe",           // REQUIRED
    "customer_email": "john@example.com",  // optional
    "customer_phone": "+6591234567",       // optional
    "customer_address": "123 Street\nSingapore 123456", // optional
    "start_date": "2025-01-15",            // REQUIRED (YYYY-MM-DD)
    "end_date": "2025-01-20",              // REQUIRED (YYYY-MM-DD)
    "luggage_size": "medium",              // small|medium|large|cabin
    "luggage_model": "Rimowa Original",    // optional
    "luggage_color": "silver",             // optional
    "quantity": 1,                         // default: 1
    "delivery_type": "delivery",           // delivery|collection
    "delivery_address": "456 Ave",         // optional
    "delivery_date": "2025-01-14",         // optional
    "delivery_time": "14:00",              // optional
    "delivery_notes": "Ring doorbell",     // optional
    "return_type": "collection",           // delivery|collection
    "return_address": "456 Ave",           // optional
    "return_date": "2025-01-21",           // optional
    "return_time": "10:00",                // optional
    "return_notes": "Leave at lobby",      // optional
    "rental_amount": 80,                   // REQUIRED - goes to Xero
    "delivery_fee": 15,                    // optional - goes to Xero
    "deposit_amount": 50,                  // optional
    "booking_source": "dashboard"          // dashboard|website|whatsapp
  },
  "changed_by": "API: Dashboard",          // optional - for audit log
  "note": "Created via dashboard"          // optional
}
```

**Response (201):**
```json
{
  "success": true,
  "action": "create",
  "rental_id": "3a62d93c-ed5e-4639-89ee-ae535d024213",
  "rental_ref": "TNER-0200",
  "xero_invoice_id": "28cfc521-a18e-490e-a51d-d5a68fa103f3",
  "xero_invoice_number": "TNER-0200",
  "message": "Rental created successfully"
}
```

**ai-core should:**
- Store `rental_id` for future operations
- Store `xero_invoice_id` if needed for direct Xero queries
- Use `rental_ref` (TNER-0200) for customer-facing display

---

### 2. UPDATE - Update Rental Details

Updates rental details. **Automatically updates Xero if amounts change**.

**Request:**
```json
{
  "action": "update",
  "rental_id": "3a62d93c-ed5e-4639-89ee-ae535d024213",  // REQUIRED
  "rental": {
    // Include ONLY fields you want to change
    "rental_amount": 120,      // Will trigger Xero update
    "delivery_fee": 25,        // Will trigger Xero update
    "start_date": "2025-01-16" // Will NOT trigger Xero update
  },
  "changed_by": "Dashboard: Admin User",
  "note": "Customer requested date change"
}
```

**Response (200):**
```json
{
  "success": true,
  "action": "update",
  "rental_id": "3a62d93c-ed5e-4639-89ee-ae535d024213",
  "changes_count": 2,
  "xero_updated": true,  // true if amounts changed, false otherwise
  "message": "Rental updated successfully"
}
```

**Updatable fields:**
| Field | Triggers Xero Update? |
|-------|----------------------|
| `rental_amount` | ✅ Yes |
| `delivery_fee` | ✅ Yes |
| `customer_name`, `customer_phone`, `customer_email`, `customer_address` | ❌ No |
| `start_date`, `end_date` | ❌ No |
| `luggage_size`, `luggage_model`, `luggage_color`, `quantity` | ❌ No |
| `delivery_type`, `delivery_address`, `delivery_date`, `delivery_time`, `delivery_notes` | ❌ No |
| `return_type`, `return_address`, `return_date`, `return_time`, `return_notes` | ❌ No |

**⚠️ Important**: The workflow will fail if the Xero invoice has a payment applied. Handle this case in ai-core by checking payment status before allowing amount edits.

---

### 3. STATUS CHANGES - Lifecycle Actions

Change the rental status. Does NOT touch Xero (logistics only).

**Actions available:**
| Action | Status Before | Status After | Timestamp Set |
|--------|--------------|--------------|---------------|
| `confirm` | pending | confirmed | - |
| `prepare` | confirmed | preparing | - |
| `deliver` | preparing | delivered | `delivered_at` |
| `pickup` | delivered | return_pending | `picked_up_at` |
| `return` | return_pending | returned | `returned_at` |
| `complete` | returned | completed | `completed_at` |

**Request:**
```json
{
  "action": "deliver",  // or confirm|prepare|pickup|return|complete
  "rental_id": "3a62d93c-ed5e-4639-89ee-ae535d024213",
  "changed_by": "Delivery Driver: Ahmad",
  "note": "Delivered to customer at lobby"
}
```

**Response (200):**
```json
{
  "success": true,
  "action": "deliver",
  "rental_id": "3a62d93c-ed5e-4639-89ee-ae535d024213",
  "old_status": "preparing",
  "new_status": "delivered",
  "message": "Rental status updated successfully"
}
```

---

### 4. CANCEL - Cancel Rental + Void Xero Invoice

Cancels the rental and **voids the Xero invoice**.

**Request:**
```json
{
  "action": "cancel",
  "rental_id": "3a62d93c-ed5e-4639-89ee-ae535d024213",
  "changed_by": "Dashboard: Admin User",
  "note": "Customer cancelled - full refund issued"
}
```

**Response (200):**
```json
{
  "success": true,
  "action": "cancel",
  "rental_id": "3a62d93c-ed5e-4639-89ee-ae535d024213",
  "xero_invoice_voided": true,
  "message": "Rental cancelled and Xero invoice voided"
}
```

**⚠️ Important**: Cannot void invoice if payment exists. Handle this in ai-core.

---

## Error Handling

**Common errors:**

| Error | Cause | ai-core Solution |
|-------|-------|------------------|
| `Missing required field: action` | No action specified | Validate payload before sending |
| `Invalid action: xxx` | Unknown action | Use only valid actions |
| `Rental not found` | Invalid rental_id | Verify rental exists in Supabase |
| `Rental is already cancelled` | Double cancel | Check status before cancel |
| `invalid input syntax for type uuid` | Malformed rental_id | Validate UUID format |
| Xero 400 error | Invoice has payment | Check payment_status before amount edit |

---

## ai-core Integration Pattern

### Recommended Service Structure

```typescript
// ai-core/src/services/tner-rental.service.ts

interface CreateRentalDTO {
  customer_name: string;
  start_date: string;
  end_date: string;
  rental_amount: number;
  // ... other fields
}

interface UpdateRentalDTO {
  rental_id: string;
  rental: Partial<RentalFields>;
  changed_by?: string;
  note?: string;
}

class TnerRentalService {
  private readonly WORKFLOW_URL = 'https://n8n.srv1081114.hstgr.cloud/webhook/tner/rentals';

  async createRental(data: CreateRentalDTO, user: string): Promise<CreateResponse> {
    const response = await fetch(this.WORKFLOW_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        rental: data,
        changed_by: `Dashboard: ${user}`,
      }),
    });
    return response.json();
  }

  async updateRental(data: UpdateRentalDTO): Promise<UpdateResponse> {
    // ⚠️ Check if amounts are changing and invoice is paid
    if (data.rental.rental_amount || data.rental.delivery_fee) {
      const existing = await this.getRentalFromSupabase(data.rental_id);
      if (existing.payment_status === 'paid') {
        throw new Error('Cannot edit amounts on paid invoice');
      }
    }

    return fetch(this.WORKFLOW_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        ...data,
      }),
    }).then(r => r.json());
  }

  async changeStatus(
    rental_id: string, 
    action: 'confirm' | 'prepare' | 'deliver' | 'pickup' | 'return' | 'complete',
    user: string,
    note?: string
  ): Promise<StatusResponse> {
    return fetch(this.WORKFLOW_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        rental_id,
        changed_by: `Dashboard: ${user}`,
        note,
      }),
    }).then(r => r.json());
  }

  async cancelRental(rental_id: string, user: string, reason: string): Promise<CancelResponse> {
    // ⚠️ Check if invoice has payment
    const existing = await this.getRentalFromSupabase(rental_id);
    if (existing.amount_paid > 0) {
      throw new Error('Cannot cancel - payment exists. Refund first.');
    }

    return fetch(this.WORKFLOW_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'cancel',
        rental_id,
        changed_by: `Dashboard: ${user}`,
        note: reason,
      }),
    }).then(r => r.json());
  }
}
```

---

## Dashboard UI Considerations

### Edit Rental Form

When user edits amounts:
1. Show warning: "Changing amounts will update the Xero invoice"
2. Disable amount fields if `payment_status === 'paid'`
3. After successful update, show toast with `xero_updated` status

### Cancel Button

1. Check `amount_paid > 0` before showing cancel option
2. If paid, show "Refund first" message instead
3. Require confirmation: "This will void the Xero invoice"

### Status Flow

Show status buttons based on current status:
```
pending → [Confirm]
confirmed → [Prepare]
preparing → [Mark Delivered]
delivered → [Mark Picked Up]
return_pending → [Mark Returned]
returned → [Complete]
```

---

## Testing Checklist

- [ ] Create rental → Invoice appears in Xero
- [ ] Update amounts → Xero invoice totals change
- [ ] Update dates only → Xero invoice unchanged, `xero_updated: false`
- [ ] Status changes → Supabase updated, Xero unchanged
- [ ] Cancel unpaid → Invoice voided in Xero
- [ ] Attempt cancel paid → Error handled gracefully

---

## Related Documentation

- [tner-xero-supabase-split.mdc](../rules/tner-xero-supabase-split.mdc) - Source of truth rules
- [Xero API Docs](https://developer.xero.com/documentation/api/invoices)
