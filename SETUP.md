# Setup

## Requirements

1. Node.js 20 or newer
2. PostgreSQL
3. Google Gemini API key

## Steps

1. Install dependencies

```bash
npm install
```

1. Create `.env`

```bash
cp .env.example .env
```

Minimum required values

```env
DATABASE_URL="postgresql://user:pass@host:port/db?schema=public"
GOOGLE_GENERATIVE_AI_API_KEY="your key"
```

Optional

```env
GOOGLE_GENERATIVE_AI_MODEL="gemini-2.5-flash"
```

1. Generate, migrate, seed

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

1. Start dev server

```bash
npm run dev
```

Open <http://localhost:3000>

## Quick verification

1. Load the UI
2. Send `Where is my order A10001?`
3. Confirm you get an answer and you see a Thinking message while waiting

## Common issues

1. Database connection fails
   Check `DATABASE_URL` and that Postgres is reachable
2. Gemini returns 401
   Check `GOOGLE_GENERATIVE_AI_API_KEY`
3. Gemini returns 429 quota
   Check quotas in your Google project and retry after the delay
