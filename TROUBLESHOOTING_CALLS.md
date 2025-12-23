# Troubleshooting: Calls Not Appearing

## Step 1: Verify Assistant Webhook Configuration

After clicking "Fix Webhook Configuration", verify it actually worked:

1. Open browser console
2. Run: `fetch('/api/vapi/verify-assistant?firmId=YOUR_FIRM_ID').then(r => r.json()).then(console.log)`
3. Check if `hasCorrectWebhook` is `true`

## Step 2: Check if Webhook is Being Called

When you make a call, check Vercel logs for:
- `[Vapi Webhook] ========== WEBHOOK REQUEST RECEIVED at [timestamp] ==========`

**If you DON'T see this:**
- Vapi is not calling your webhook
- Check Vapi dashboard → Assistants → Your Assistant → Server URL
- Should be: `https://www.intakegenie.xyz/api/vapi/webhook`

**If you DO see this:**
- Webhook is being called, but something else is failing
- Look for these messages:
  - `[Vapi Webhook] Resolved firmId:` - Firm lookup
  - `[Vapi Webhook] ✅ Call upserted successfully` - Call created
  - `[Vapi Webhook] ❌ Failed to upsert call:` - Insert failed

## Step 3: Check Phone Number Assignment

In Vapi dashboard:
1. Go to Phone Numbers
2. Find your number
3. Check if it has an Assistant assigned
4. If not, assign your assistant to the phone number

## Step 4: Manual Backfill

If webhook isn't working, you can manually backfill calls:
1. Go to dashboard
2. Use the backfill endpoint (if available) or manually trigger it

## Common Issues:

1. **No webhook logs** → Assistant doesn't have webhook URL set
2. **"Could not resolve firmId"** → Assistant ID or phone number ID doesn't match
3. **"Failed to upsert call"** → Database constraint or RLS issue
4. **Webhook logs but no calls** → Firm lookup failing, check assistant metadata

