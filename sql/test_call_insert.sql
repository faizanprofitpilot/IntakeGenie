-- Test script to manually insert a call record
-- This helps verify if the schema allows inserts
-- Replace the UUIDs with your actual firm_id

-- First, get your firm_id:
-- SELECT id, firm_name FROM firms LIMIT 1;

-- Then test insert (replace 'YOUR_FIRM_ID' with actual UUID):
/*
INSERT INTO calls (
  firm_id,
  vapi_conversation_id,
  from_number,
  to_number,
  status,
  urgency,
  twilio_call_sid,
  started_at
) VALUES (
  'YOUR_FIRM_ID'::uuid,
  'test-conversation-' || extract(epoch from now())::text,
  '+15551234567',
  '+15559876543',
  'in_progress',
  'normal',
  NULL,
  NOW()
) RETURNING id, vapi_conversation_id, started_at;
*/

-- If this works, the schema is fine and the issue is in the code/webhook
-- If this fails, there's a schema constraint issue

