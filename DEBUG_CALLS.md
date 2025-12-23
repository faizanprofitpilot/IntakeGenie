# Debugging Call Logs Not Appearing

## Step 1: Check if Webhook is Being Called

In your Vercel logs, search for:
- `[Vapi Webhook] ========== WEBHOOK REQUEST RECEIVED ==========`
- If you see this, the webhook is being called ✅
- If you DON'T see this, the webhook URL might be wrong in Vapi dashboard ❌

## Step 2: Check Firm Lookup

Look for these log messages:
- `[Vapi Webhook] Resolved firmId: <some-uuid>` ✅ Firm found
- `[Vapi Webhook] CRITICAL: Could not resolve firmId` ❌ Firm not found

If firmId is not found, check:
1. Does your firm have `vapi_assistant_id` populated?
2. Does your firm have `vapi_phone_number_id` populated?
3. Run: `sql/check_firm_vapi_fields.sql` to verify

## Step 3: Check Call Insert

Look for these log messages:
- `[Vapi Webhook] ✅ Call upserted successfully` ✅ Call created
- `[Vapi Webhook] ❌ Failed to upsert call:` ❌ Insert failed
- `[Upsert Call] Error creating call:` ❌ Database error

If insert fails, check the error message for:
- Column doesn't exist errors
- Constraint violations
- RLS policy blocking

## Step 4: Verify Your Firm Has Required Fields

Run this in Supabase SQL Editor:
```sql
SELECT 
  id,
  firm_name,
  vapi_assistant_id,
  vapi_phone_number_id,
  inbound_number_e164
FROM firms
WHERE owner_user_id = auth.uid()
LIMIT 1;
```

Make sure:
- `vapi_assistant_id` is NOT NULL
- `vapi_phone_number_id` is NOT NULL
- `inbound_number_e164` is NOT NULL

## Step 5: Test Manual Insert

Run `sql/test_call_insert.sql` with your actual firm_id to verify the schema allows inserts.

## Common Issues:

1. **Firm not found**: Assistant ID or Phone Number ID doesn't match what Vapi is sending
2. **Webhook not called**: Check Vapi dashboard webhook URL configuration
3. **RLS blocking**: Service client should bypass RLS, but verify
4. **Missing fields**: Firm doesn't have required Vapi fields populated

