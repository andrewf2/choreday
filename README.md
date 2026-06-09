# Chore Checker AI

Parents define exactly what "done" means for each chore. Children complete it and
upload a photo. Claude (vision) evaluates the photo against each standard
independently — returning **done / not done / unclear** with a score and feedback.
Parents keep final authority and can approve, reject, or override the AI.

## Stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS 4**
- **Prisma 6** + **SQLite** for persistence
- **Anthropic Claude** (`claude-opus-4-8`, vision + structured output) for evaluation

## Setup

```bash
npm install

# Configure your Anthropic key (required for AI evaluation; the rest works without it)
cp .env.example .env
# then edit .env and set ANTHROPIC_API_KEY=sk-ant-...

# Database: migrate + seed demo profiles and chores
npx prisma migrate dev
npm run db:seed

npm run dev
```

Open http://localhost:3500 and log in. After login you're routed to the parent or
child dashboard based on your account type. "Log out" is in the header.

## Demo logins (from the seed)

All demo accounts use the password `password`:

- **sam** — Sam (Parent): creates chores, reviews submissions.
- **ava** / **leo** — children: submit photos, view feedback.

## How it works

1. **Parent** creates a chore: name, description, definition of done, assigned child,
   and a checklist of standards.
2. **Child** opens the chore and uploads a photo (and an optional note).
3. The photo is sent to Claude with the standards. The AI evaluates each standard on
   visible evidence only — if something can't be verified it returns **unclear**, never
   an assumed failure. The result (score, overall status, per-standard verdicts) is
   stored.
4. **Parent** reviews the submission and **approves**, **rejects**, or **overrides** the
   AI decision. Approve completes the chore; reject sends it back to active.

If the AI call fails (e.g. no API key), the submission is still saved and flagged for
**manual review** — uploads never fail because of the AI.

## Project layout

- `prisma/schema.prisma` — data model (User, Chore, Standard, Submission, SubmissionPhoto, ItemResult)
- `prisma/seed.ts` — demo data
- `src/lib/db.ts` — Prisma client singleton
- `src/lib/session.ts` — cookie-based "acting as" profile
- `src/lib/ai/evaluate.ts` — Claude vision evaluation
- `src/lib/storage.ts` — photo storage (`uploads/`, served via `/api/uploads/[...path]`)
- `src/app/parent/*` — parent dashboard, create chore, chore detail, review
- `src/app/child/*` — child dashboard, chore detail, submit, submission feedback
