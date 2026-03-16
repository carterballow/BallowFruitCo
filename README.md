# Ballow Fruit Co.

Direct->consumer storefront for a family fruit farm in Encinitas, CA. Built from scratch as a full-stack web project.

## What it does

- Browse and purchase fresh fruit (naval oranges, blood oranges, lemons, limes, pomegranates, avocados)
- Checkout via Stripe with email receipts through Resend
- Create an account and log in with Supabase Auth
- Generate a personalized 7 day meal plan based on what's in your cart, powered by Gemini AI and a vector-embedded recipe database

## Stack

- **Framework:** Next.js 16
- **Database & Auth:** Supabase (Postgres + pgvector + Row Level Security)
- **Payments:** Stripe
- **Email:** Resend
- **AI:** Google Gemini 2.5 Flash (plan generation) + Gemini Embedding (recipe search)
- **Deployment:** Vercel

## Local setup

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Copy `.env.local` and fill in your keys:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_URL=http://localhost:3000
```

3. Run the dev server:

```bash
npm run dev
```

4. Re seed the recipe database:

```bash
npx ts-node --esm scripts/embed-recipes.ts
npx ts-node --esm scripts/seed-knowledge.ts
```
