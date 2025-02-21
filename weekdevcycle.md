# Ballow Fruit Co. — AI Planner Dev Cycle

Weekly build plan for the AI Produce-to-Recipe Planner feature.

---

## Phase 1 — Auth Foundation ✅ COMPLETE

**What was built:**
- Installed `@supabase/ssr` package
- Added `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`
- Updated `lib/supabase.ts` with `getSupabaseServer()` and `getSupabaseBrowser()`
- Built `/auth/login` and `/auth/signup` pages
- Built `/api/auth/login`, `/api/auth/signup`, `/api/auth/logout` API routes
- Updated navbar: Planner link, Login button (logged out), initials circle → dashboard (logged in)

**One manual step still needed:**
Run this in the Supabase SQL Editor to link orders to user accounts:
```sql
ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
```

**Test:** Sign up at `/auth/signup` → confirm email → log in → navbar shows initials circle.

---

## Phase 2 — Database & Nutrition Layer

**Goal:** Create all new Supabase tables, enable pgvector for AI search, and build the static fruit nutrition data file.

**Steps:**
1. Run `CREATE EXTENSION IF NOT EXISTS vector;` in Supabase SQL Editor
2. Create tables: `recipes`, `user_preferences`, `meal_plans`, `recipe_ratings`
3. Enable Row Level Security (RLS) on all new tables
4. Create `match_recipes` Postgres function for vector search
5. Create `lib/nutrition.ts` — static shelf-life and nutrition data for all 6 fruits

**Key concept:** pgvector is a Supabase plugin that lets you store and search "embeddings" — the 768-number fingerprints that represent the meaning of text. Avocados get urgencyScore 10 (shelf life = 5 days). Lemons get urgencyScore 2 (shelf life = 21 days).

**Test:** Query `user_preferences` in Supabase — RLS should block access without auth.

---

## Phase 3 — Gemini Integration & Recipe Seeding

**Goal:** Connect to Gemini AI, embed ~30 starter recipes into the database.

**Steps:**
1. Get a free Gemini API key at `aistudio.google.com/app/apikey`
2. Add `GEMINI_API_KEY=AIza...` to `.env.local`
3. `npm install @google/generative-ai`
4. Create `lib/gemini.ts` — lazy singleton with `embedText()` and `generatePlanText()`
5. Write `scripts/embed-recipes.ts` — defines ~30 recipes covering all 6 fruits and all meal types (breakfast, lunch, dinner, snack, drink)
6. Run the seed script once: `npx ts-node scripts/embed-recipes.ts`

**Key concept:** Each recipe gets converted to a text string, sent to Gemini's `text-embedding-004` model, and the returned 768 numbers are stored in the `embedding` column. This is what makes the search smart later.

**Test:** Query `recipes` table — `embedding` column should be non-null with 768-value arrays.

---

## Phase 4 — RAG + Planning Engine

**Goal:** Build the retrieval system and scheduling algorithm that forms the brain of the planner.

**Steps:**
1. Create `lib/rag.ts` — embeds a query string, runs pgvector cosine similarity search, returns top-K matching recipes
2. Create `lib/planner.ts` — the full scheduling algorithm (urgency → retrieval → slot assignment → Gemini enrichment)
3. Build `app/api/planner/generate/route.ts` — main endpoint called when user hits "Generate Plan"
4. Build `app/api/user/preferences/route.ts` — GET and POST for dietary goals and allergies

**The algorithm:**
- Sort cart fruits by urgency (avocados first — 5-day shelf life)
- Build a query from the cart + user goals, embed it, retrieve 15-20 candidate recipes
- Assign recipes to days respecting shelf-life windows
- Call Gemini to add friendly per-day tips

**Test:** POST to `/api/planner/generate` with a sample cart, receive a valid 7-day JSON plan.

---

## Phase 5 — Planner UI

**Goal:** Build the `/planner` page — the main user-facing feature.

**Steps:**
1. Build `app/planner/page.tsx` — auth-gated (redirects to login if not signed in)
2. Wire to `useCart()` context so the planner reads cart items directly
3. Build **PreferencesPanel** — dietary goals checkboxes, allergies, meals-per-day toggle
4. Build **CartSummary** — shows cart fruits with shelf-life warnings ("avocados: use within 5 days")
5. Build **GenerateButton** — spinner during the 3-8 second wait
6. Build **WeeklyPlanDisplay** — 7 day cards, each with meal rows, fruit chips, 5-star rating widget
7. Wire ratings to `app/api/planner/rate/route.ts`

**Test:** Full end-to-end — add fruit to cart → visit planner → generate → rate a recipe → regenerate and verify personalization shifted.

---

## Phase 6 — Dashboard & History

**Goal:** Give logged-in users a home base to see their past orders and past meal plans.

**Steps:**
1. Build `app/dashboard/page.tsx` — server component, queries Supabase directly
2. Build `app/api/planner/history/route.ts` — returns user's past plans ordered by date
3. Show past orders (from `orders` table where `user_id` matches)
4. Show past meal plans with ratings

**Test:** Generate a plan → go to `/dashboard` → past plan appears.

---

## Phase 7 — Feedback Loop + Polish

**Goal:** Make the personalization actually feel smart, and make the UI production-ready.

**Steps:**
1. Improve scoring in `lib/planner.ts` — liked recipe tags boost future queries; disliked recipe IDs filtered out
2. Add "Add to cart" buttons on planner recipe cards
3. Loading skeletons during plan generation
4. Mobile-responsive 7-day week view
5. Error states: Gemini rate limit hit, no matching recipes for cart combination

**Test:**
- Rate 3+ recipes 5 stars → regenerate → similar-style recipes should appear more
- Rate 3+ recipes 1 star → regenerate → those recipes should disappear
- Test on mobile — week view should be scrollable and readable

---

## Files Overview

### New files to create
- `lib/gemini.ts` — Gemini AI client
- `lib/nutrition.ts` — fruit shelf-life and nutrition data
- `lib/rag.ts` — recipe retrieval via vector search
- `lib/planner.ts` — the scheduling algorithm
- `scripts/embed-recipes.ts` — one-time recipe seeding script
- `app/planner/page.tsx` — the main planner UI
- `app/dashboard/page.tsx` — user history
- `app/api/planner/generate/route.ts`
- `app/api/planner/rate/route.ts`
- `app/api/planner/history/route.ts`
- `app/api/user/preferences/route.ts`

### Files already built (Phase 1)
- `lib/supabase.ts` — updated with SSR auth clients
- `components/navbar.tsx` — updated with auth state
- `app/auth/login/page.tsx`
- `app/auth/signup/page.tsx`
- `app/api/auth/login/route.ts`
- `app/api/auth/signup/route.ts`
- `app/api/auth/logout/route.ts`

---

## New Environment Variables Needed

```bash
# Already set in .env.local (Phase 1):
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# To add in Phase 3:
GEMINI_API_KEY=AIza...   # free at aistudio.google.com/app/apikey
```

---

## Verification Checklist

- [x] User can sign up, receive confirmation email, log in
- [x] Login/logout state reflected in navbar
- [ ] `/planner` requires auth — anonymous users redirected to login
- [ ] `recipes` table has non-null embeddings after seeding
- [ ] `match_recipes()` returns results in Supabase SQL Editor
- [ ] POST to `/api/planner/generate` returns valid 7-day JSON
- [ ] 7-day plan renders in UI with all days and meals
- [ ] Star rating saves to `recipe_ratings` table
- [ ] Regenerating after ratings shifts recipe emphasis
- [ ] Paid orders save with `user_id` (links to account)
- [ ] Past plans visible in `/dashboard`
- [ ] Avocados always assigned to days 1-3 (shelf-life constraint)