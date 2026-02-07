 # CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (localhost:3000, uses webpack)
pnpm build        # Production build (uses webpack)
pnpm start        # Run production build
pnpm lint         # ESLint (flat config, ESLint 9)
```

Package manager is **pnpm**. No test framework is configured yet.

> **Note:** Turbopack is disabled due to a pre-existing pnpm symlink case-sensitivity issue on Windows. The `--webpack` flag is used for both dev and build. The webpack build has a known Next.js 16 bug ([#87719](https://github.com/vercel/next.js/issues/87719)) causing `_global-error` prerender failure — this does not affect dev server or runtime behavior.

## Architecture

- **Framework:** Next.js 16 with App Router, React 19, TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/postcss`), no `tailwind.config.js` — theme is defined inline in `app/globals.css` using `@theme`
- **UI Components:** shadcn/ui (`radix-nova` style) built on Radix UI primitives, stored in `components/ui/`
- **Icons:** Lucide React
- **Database:** MongoDB via Mongoose (connection string: `mongodb://localhost:27017/hackathon`)
- **Path aliases:** `@/*` maps to the project root

## Project: Unheard

Anonymous campus rumor verification platform. Key concepts:

- **Users** are identified by SHA-256 hashed tokens (no stored identity)
- **Posts** go through lifecycle: open → verified/false/disputed (via evaluation)
- **Trust Score** = credibility-weighted agreeableness + relation bonus
- **Credibility** tracks user accuracy; settlement adjusts after evaluation
- **Relations** link evidence posts; community votes determine relevance
- **Tombstone protocol** handles post deletion with cascading score recalculation

## Directory Structure

```
lib/
  constants.ts          # All magic numbers and thresholds
  crypto.ts             # SHA-256, token generation, hashing helpers
  auth.ts               # Request authentication, cooldown checks
  rate-limit.ts         # Daily post rate limiting
  trust-score.ts        # Trust score calculation (weighted avg + relations)
  credibility.ts        # Settlement tables, cooldown enforcement
  evaluation.ts         # Post evaluation sweep logic
  email.ts              # Nodemailer transport (console in dev)
  db/
    connection.ts       # Mongoose singleton (HMR-safe)
    models/             # 7 Mongoose models + barrel export

app/
  api/                  # API routes (auth, posts, relations, evaluate)
  (auth)/               # Route group: register, verify
  (main)/               # Route group: feed, posts, profile (with header)

components/
  ui/                   # shadcn/ui primitives
  auth/                 # AuthProvider, register/verify/token forms
  layout/               # Header with nav
  posts/                # PostCard, PostForm, PostDetail, StatusBadge, TrustScore
  interactions/         # RatingInput, InteractionSummary
  relations/            # RelationList, RelationCard, LinkRelationForm
  profile/              # CredibilityCard

hooks/
  use-auth.ts           # Auth context consumer
  use-api.ts            # Authenticated fetch wrapper
```

## Key Patterns

- **Class merging:** Use `cn()` from `@/lib/utils` (clsx + tailwind-merge) for all conditional/merged class names
- **Component variants:** CVA (class-variance-authority) for type-safe variant props on UI components
- **Compound components:** UI components like Card export subcomponents (CardHeader, CardTitle, etc.)
- **Polymorphic rendering:** Radix `Slot` via `asChild` prop on components like Button
- **Data attributes:** Components use `data-slot`, `data-variant`, `data-size` for styling hooks
- **Dark mode:** `.dark` class strategy with OkLch CSS custom properties for both modes
- **Server Components:** RSC enabled (`"rsc": true` in components.json); mark client components with `"use client"`
- **Auth:** Token stored in localStorage, injected via Bearer header by `useApi()` hook
- **DB connection:** Mongoose singleton cached on `global` to survive HMR

## Adding shadcn/ui Components

Config is in `components.json`. Use `pnpm dlx shadcn@latest add <component>` to add new components. They install to `components/ui/`.
