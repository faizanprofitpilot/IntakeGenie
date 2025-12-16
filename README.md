# IntakeGenie MVP

After-hours and no-answer legal intake voice agent for law firms. Routes calls to an AI agent when firms are closed or don't answer, collects structured intake, and emails summaries to the firm.

## Tech Stack

- **Next.js 14** (App Router) with TypeScript
- **Supabase** (Auth + Database + RLS)
- **Twilio Voice** (Call routing + speech recognition)
- **Deepgram** (Transcription)
- **OpenAI** (Structured intake extraction + summarization)
- **Resend** (Email delivery)
- **Tailwind CSS** (Styling)

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Twilio account with a phone number
- Deepgram API key
- OpenAI API key
- Resend API key

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd web
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor and run the migration file:
   ```bash
   # Copy contents of web/sql/migrations.sql
   # Paste into Supabase SQL Editor and execute
   ```
3. Get your Supabase credentials:
   - Go to Project Settings → API
   - Copy `Project URL` (NEXT_PUBLIC_SUPABASE_URL)
   - Copy `anon public` key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - Copy `service_role` key (SUPABASE_SERVICE_ROLE_KEY) - keep this secret!

### 3. Twilio Setup

1. Sign up at https://www.twilio.com
2. Purchase a phone number (Voice-enabled)
3. Get your credentials:
   - Account SID (TWILIO_ACCOUNT_SID)
   - Auth Token (TWILIO_AUTH_TOKEN)
   - Phone number in E.164 format (TWILIO_NUMBER, e.g., +15551234567)

4. Configure webhooks in Twilio Console:
   - Go to Phone Numbers → Manage → Active Numbers → [Your Number]
   - Under "Voice & Fax", set:
     - **A CALL COMES IN**: `https://your-domain.com/api/twilio/voice`
     - **STATUS CALLBACK URL**: `https://your-domain.com/api/twilio/status`
     - Method: POST

### 4. Deepgram Setup

1. Sign up at https://www.deepgram.com
2. Create an API key
3. Copy the API key (DEEPGRAM_API_KEY)

### 5. OpenAI Setup

1. Sign up at https://platform.openai.com
2. Create an API key
3. Copy the API key (OPENAI_API_KEY)

### 6. Resend Setup

1. Sign up at https://resend.com
2. Create an API key
3. Verify a sender domain (or use the default for testing)
4. Copy the API key (RESEND_API_KEY)

### 7. Environment Variables

Create a `.env.local` file in the `web` directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_NUMBER=your_twilio_phone_number_e164_format
# Optional: For single-firm MVP
FIRM_ID=optional_firm_id_for_single_firm_setup

# Deepgram
DEEPGRAM_API_KEY=your_deepgram_api_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Resend
RESEND_API_KEY=your_resend_api_key

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
# For production, use your actual domain:
# NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 8. Local Development with ngrok

For local development, you need to expose your local server to the internet for Twilio webhooks:

1. Install ngrok: https://ngrok.com/download
2. Start your Next.js dev server:
   ```bash
   npm run dev
   ```
3. In another terminal, start ngrok:
   ```bash
   ngrok http 3000
   ```
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. Update `.env.local`:
   ```env
   NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
   ```
6. Update Twilio webhooks to use the ngrok URL:
   - `https://abc123.ngrok.io/api/twilio/voice`
   - `https://abc123.ngrok.io/api/twilio/status`

**Note**: ngrok URLs change on free tier restarts. For production, use a permanent domain.

### 9. Seed Data (Optional)

After creating a user account, you can seed a test firm:

1. Log in to the app
2. Go to Supabase SQL Editor
3. Get your user ID from `auth.users` table
4. Run:
   ```sql
   INSERT INTO firms (
     owner_user_id,
     firm_name,
     forward_to_number,
     notify_emails,
     mode,
     timezone,
     open_days,
     open_time,
     close_time,
     failover_ring_seconds
   ) VALUES (
     'your-user-id-here',
     'Demo Law Firm',
     '+15551234567',
     ARRAY['your-email@example.com'],
     'both',
     'America/New_York',
     ARRAY[1,2,3,4,5],
     '09:00',
     '17:00',
     20
   );
   ```

Or use the settings page in the app to create your firm configuration.

## Running the Application

```bash
npm run dev
```

Visit http://localhost:3000 (or your ngrok URL)

## Project Structure

```
web/
├── app/
│   ├── api/
│   │   ├── twilio/          # Twilio webhooks
│   │   │   ├── voice/       # Incoming call handler
│   │   │   ├── failover/    # Failover handler
│   │   │   ├── gather/      # Speech recognition handler
│   │   │   ├── stream/       # Media stream (placeholder)
│   │   │   ├── status/      # Call status callback
│   │   │   └── recording-status/ # Recording callback
│   │   └── process-call/    # Post-call processing
│   ├── (auth)/
│   │   └── login/           # Login page
│   ├── dashboard/           # Dashboard
│   ├── settings/            # Firm settings
│   └── calls/               # Call logs
├── lib/
│   ├── clients/             # API clients
│   ├── agent/               # Agent prompts
│   └── utils/                # Utilities
├── components/              # React components
├── types/                   # TypeScript types
└── sql/                     # Database migrations
```

## Key Features

- **After-Hours Routing**: Automatically routes calls to AI agent outside business hours
- **No-Answer Failover**: Routes to agent if firm doesn't answer during business hours
- **Structured Intake**: Collects name, contact info, incident details, injuries, treatment, insurance
- **Emergency Detection**: Detects emergencies and instructs callers to call 911
- **Automatic Processing**: Transcribes, summarizes, and emails intake summaries
- **Call Logs**: View all calls with filters, transcripts, and recordings

## Testing

1. Create a user account via the login page
2. Configure firm settings (forward-to number, business hours, etc.)
3. Call your Twilio number
4. Complete the intake conversation with the AI agent
5. Check your email for the intake summary
6. View the call in the dashboard/calls page

## Production Deployment

1. Deploy to Vercel, Railway, or your preferred platform
2. Set environment variables in your hosting platform
3. Update Twilio webhooks to use your production domain
4. Update `NEXT_PUBLIC_APP_URL` to your production domain
5. Ensure Resend sender domain is verified

## Troubleshooting

- **Webhooks not working**: Ensure ngrok is running (dev) or domain is correct (prod)
- **Calls not routing**: Check firm settings and business hours configuration
- **Transcription failing**: Verify Deepgram API key and recording URL
- **Emails not sending**: Check Resend API key and sender domain verification
- **RLS errors**: Ensure user is authenticated and owns the firm

## License

MIT
