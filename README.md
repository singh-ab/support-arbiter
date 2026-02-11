# Support Arbiter - Multi Agent Customer Support

Next.js app with a Hono API and a simple multi agent AI system.

## What it does

1. Stores users, conversations, messages, orders, deliveries, invoices, payments, refunds
2. Routes each incoming message to a specialized agent using an LLM router
3. Enforces tools first behavior in sub agents by calling DB backed tools before generating text

## Tech

1. Next.js App Router UI
2. Hono API mounted at `/api/*`
3. Prisma with PostgreSQL
4. Vercel AI SDK with Google Gemini via `@ai-sdk/google`

## Quick start

1. Install

```bash
npm install
```

1. Create `.env` from `.env.example` and set values

Required

```env
DATABASE_URL="postgresql://..."
GOOGLE_GENERATIVE_AI_API_KEY="..."
```

Optional

```env
GOOGLE_GENERATIVE_AI_MODEL="gemini-2.5-flash"
```

1. Database

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

1. Run

```bash
npm run dev
```

## API

1. `GET /api/health`
2. `POST /api/chat/messages`
3. `GET /api/chat/conversations?userId=demo-user`
4. `GET /api/chat/conversations/:id`
5. `DELETE /api/chat/conversations/:id`
6. `GET /api/agents`
7. `GET /api/agents/:type/capabilities`

## Seeded examples

The seed creates a demo user and sample data.

Demo user

1. Email `demo@acme.com`
2. UI uses `userId=demo-user` and the server maps it to the seeded demo user id

Orders

1. Order number `A10001` status `SHIPPED` carrier `UPS` tracking `1Z999AA10123456784`
2. Order number `A10002` status `PROCESSING` carrier `USPS` tracking `94001118992238569210`

Invoices

1. Invoice number `INV-10001` status `PAID` total `129.99 USD`
2. Invoice number `INV-10002` status `OPEN` total `49.99 USD`

Refunds

1. Payment for `INV-10001` has a refund row with status `NONE`

## Test queries

Use these in the UI after seeding.

1. `Where is my order A10001?`
2. `Check delivery status for A10002`
3. `Can I get invoice INV-10001?`
4. `Do I have a refund for INV-10001?`
5. `How do I reset my password?`

If you see quota errors from Gemini, verify `GOOGLE_GENERATIVE_AI_API_KEY` and your Google project quotas.
