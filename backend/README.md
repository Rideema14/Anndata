<<<<<<< HEAD
# Agri Marketplace — Backend (Phase 1)

Node.js/Express backend for the multi-category agricultural marketplace. Built with
**PostgreSQL + Prisma**, **JWT auth** (access + rotating refresh tokens), **email OTP**
verification, **Google Sign-In**, **Razorpay** payments, **Cloudinary** image storage,
and **Socket.IO** for live order-status updates.

## What's implemented (Phase 1)

This phase delivers a complete, working core commerce loop end-to-end:
=======
# Agri Marketplace — Backend (Phase 1 + Phase 2 partial)

Node.js/Express backend for the multi-category agricultural marketplace, written in
**TypeScript**. Built with **PostgreSQL + Prisma**, **JWT auth** (access + rotating
refresh tokens), **email OTP** verification, **Google Sign-In**, **Razorpay**
payments, **Cloudinary** image storage, and **Socket.IO** for live order-status
updates.

## What's implemented
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a

| Module | Covers |
|---|---|
| **Auth** (`/auth`, `/users`) | Register + email OTP verification, login, Google OAuth sign-in/link, JWT access/refresh with rotation, forgot/reset password, profile + profile image, address book, login history |
| **Catalog** (`/categories`, `/products`, `/wishlist`) | Category/sub-category CRUD (admin), product CRUD with images (Cloudinary) and variants, search/filter/sort/pagination, nearby-products (Haversine distance), top-deals, reviews with rating aggregation + moderation, wishlist |
| **Cart** (`/cart`) | Add/update/remove items, live price computation, stock checks |
| **Orders** (`/orders`) | Checkout (cart → order, race-safe stock decrement, address selection), order history, status updates with full audit history, cancellation with stock restoration, live push over Socket.IO |
| **Payments** (`/payments`) | Razorpay order creation, client-side signature verification, server-to-server webhook (idempotent, signature-verified against the raw payload) |
<<<<<<< HEAD

Full endpoint list is in Swagger at `/api-docs` once the server is running.

## Not yet built (Phase 2+)

The original spec has 13 modules; this phase covers 3.1–3.4. Still to build, in
roughly the order they'd naturally get layered on:
=======
| **Sellers** (`/sellers`) | Application/verification workflow (auto-promotes to the `SELLER` role on approval), profile with payout bank details + service area, dashboard (active listings, orders to fulfill, revenue), analytics (daily sales trend, top products, order-status breakdown) — all via raw SQL aggregation since it spans Order/OrderItem/Product |
| **Notifications & Feedback** (`/notifications`) | In-app + email notifications with per-user, per-type preferences (mute specific types, toggle channels globally); feedback submission (works anonymously or logged in), admin triage/response |

Full endpoint list is in Swagger at `/api-docs` once the server is running.

## Not yet built

The original spec has 13 modules; this covers 3.1–3.4 and 3.11–3.12. Still to build:
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a

- **3.5 Seed Store** — dedicated sub-marketplace (own cart/orders/reviews/wishlist + AI seed advisor)
- **3.6 Land Marketplace** — listings + site-visit request workflow
- **3.7 Machinery & Equipment Rental** — rental bookings with date ranges
- **3.8 Mandi Price Intelligence** — price history, favorite mandis, threshold alerts
- **3.9 AI Farm Advisory Suite** — crop/disease/soil/fertilizer/irrigation/weather advice, AI chat, voice
<<<<<<< HEAD
- **3.10 Weather Intelligence** — external API integration + caching (cache layer already scaffolded in `src/config/cache.js`)
- **3.11 Seller Management & Analytics** — seller onboarding/verification, dashboard, analytics
- **3.12 Notifications & Feedback** — in-app notifications, preferences, feedback capture
- **3.13 Admin Console** — platform-wide analytics, moderation console, seed/reset tooling
=======
- **3.10 Weather Intelligence** — external API integration + caching (cache layer already scaffolded in `src/config/cache.ts`)
- **3.13 Admin Console** — platform-wide analytics, seed/reset tooling (category CRUD and review moderation already exist from Catalog; the seller-verification console already exists from Sellers)
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a

Ask to continue building any of these and it'll plug into the same `src/modules/<name>/`
pattern and the existing Prisma schema.

## Tech stack & key decisions

<<<<<<< HEAD
=======
- **TypeScript**, strict mode. Every third-party surface this project touches
  (`req.user`, `req.rawBody`, Socket.IO's custom socket fields) is properly typed via
  declaration merging in `src/types/express.d.ts`. The `razorpay` package doesn't ship
  reliable types, so `src/types/razorpay.d.ts` hand-declares just the slice this
  project calls.
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
- **PostgreSQL via Prisma** — chosen over MongoDB because orders/payments/inventory need
  real transactions, and the domain (users→addresses, orders→items→payments 1:1,
  cart→items, category→subcategory→product) is inherently relational. `Json` columns
  (`Product.specifications`, `ProductVariant.attributes`) give you Mongo-like flexibility
  exactly where the data genuinely varies, without losing integrity everywhere else.
<<<<<<< HEAD
- **Plain JavaScript**, not TypeScript — say the word if you'd rather have it typed.
- **Prisma pinned to 5.22.x** rather than the current major (Prisma 7 shipped a large
  ESM/config rewrite in late 2025). This is a deliberate, stable choice — bump it
  yourself when you're ready, it's just a version bump in `package.json`.
=======
- **Prisma pinned to 5.22.x** rather than the current major (Prisma 7 shipped a large
  ESM/config rewrite in late 2025). Deliberate, stable choice — bump it yourself when
  you're ready, it's just a version bump in `package.json`.
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
- **Socket.IO** stands in for the original spec's STOMP-over-WebSocket — same result
  (live order-status push), more idiomatic in the Express ecosystem.
- **Refresh token rotation**: refresh tokens are opaque random strings (not JWTs),
  stored only as a SHA-256 hash (`RefreshToken` table), and rotated on every use — a
  leaked DB dump can't be replayed, and reuse of an old token is detectable.
- **Razorpay webhook**: verified against the *raw* request bytes (captured via the
<<<<<<< HEAD
  `verify` hook on `express.json()` in `app.js`), not a re-serialized body — a common
=======
  `verify` hook on `express.json()` in `app.ts`), not a re-serialized body — a common
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
  gotcha that silently breaks HMAC verification if you get it wrong.
- **Checkout race safety**: stock is decremented inside the order transaction using a
  guarded `UPDATE ... WHERE stock >= quantity`, not a plain decrement — two concurrent
  checkouts for the last unit can't both succeed.
<<<<<<< HEAD
=======
- **Seller analytics/dashboard** use raw parameterized SQL (`prisma.$queryRaw`) rather
  than the query builder — the numbers span three joined tables (Order/OrderItem/Product)
  with `GROUP BY`/date-truncation the query builder can't express directly.
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Fill in real values — at minimum: `DATABASE_URL`, `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`, SMTP credentials (for OTP emails), Cloudinary credentials, and
Razorpay test keys (`RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` from the
[Razorpay dashboard](https://dashboard.razorpay.com/) test mode). `GOOGLE_CLIENT_ID`
is only required if you want Google sign-in to work.

### 3. Start Postgres
Either run it yourself, or use the bundled compose file:
```bash
docker compose up -d postgres
```

### 4. Run migrations + seed
```bash
npm run prisma:migrate   # creates the schema
npm run prisma:seed      # seeds the 7 categories + an admin login
```
The seed creates `admin@agrimarketplace.com` / `ChangeMe123!` — change this password
immediately in any shared environment.

### 5. Run the server
```bash
<<<<<<< HEAD
npm run dev     # nodemon, auto-reload
# or
npm start
=======
npm run dev       # tsx watch, auto-reload, no separate build step
npm run typecheck # tsc --noEmit, checks the whole project without producing output
npm run build      # compiles src/ -> dist/
npm start          # runs the compiled dist/server.js
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
```
API root: `http://localhost:5000/api/v1` · Swagger: `http://localhost:5000/api-docs`

### Razorpay webhook locally
Razorpay needs a public URL to call. Use a tunnel (e.g. `ngrok http 5000`) and
register `https://<tunnel>/api/v1/payments/webhook` in the Razorpay dashboard, with
the **same secret** as `RAZORPAY_WEBHOOK_SECRET` in `.env`.

## Project layout

```
src/
<<<<<<< HEAD
=======
  types/           Express Request/Socket.IO augmentation, hand-written Razorpay types
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
  config/          env, Prisma client, Cloudinary, Razorpay, mailer, cache, Socket.IO, Swagger
  common/
    middlewares/   auth, role guard, validation, rate limits, error handling, uploads
    utils/         ApiError, ApiResponse, JWT, OTP, pagination, slugify, logger
  modules/
    auth/          register/login/OTP/Google/refresh/profile/addresses
    catalog/       categories, products, reviews, wishlist
    cart/
    order/
    payment/
<<<<<<< HEAD
  routes/          mounts every module under /api/v1
  app.js           Express app + middleware
  server.js        HTTP server + Socket.IO + graceful shutdown
prisma/
  schema.prisma
  seed.js
```

Every module follows the same shape: `*.validation.js` (Zod schemas) →
`*.routes.js` → `*.controller.js` → `*.service.js` (all Prisma access lives in the
service layer). New modules plug into this without touching existing ones.

## Business-rule placeholders to revisit

A few numbers in `order.service.js` are reasonable defaults, not requirements from the
=======
    seller/        application/verification, dashboard, analytics
    notification/  in-app + email notifications, preferences, feedback
  routes/          mounts every module under /api/v1
  app.ts           Express app + middleware
  server.ts        HTTP server + Socket.IO + graceful shutdown
prisma/
  schema.prisma
  seed.ts
```

Every module follows the same shape: `*.validation.ts` (Zod schemas, each exporting
both the schema and its inferred `z.infer<>` type) → `*.routes.ts` → `*.controller.ts`
→ `*.service.ts` (all Prisma access lives in the service layer). New modules plug into
this without touching existing ones.

## Business-rule placeholders to revisit

A few numbers in `order.service.ts` are reasonable defaults, not requirements from the
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
spec — adjust them to your actual policy:
- Flat shipping fee ₹49, free above ₹999 subtotal
- Flat 5% tax
- No coupon/discount system yet (the `discount` column exists on `Order` for when you add one)

## A note on testing this without installing anything

<<<<<<< HEAD
Every file here was syntax-checked (`node --check`) and every relative `require()`
path was verified to resolve — but `npm install` needs network access this sandbox
doesn't have, so the actual dependency resolution and a live DB round-trip haven't
been run. Do a `npm install && npm run prisma:migrate` locally before trusting it
against real traffic.
=======
`npm install` needs network access this sandbox doesn't have, so a live DB round-trip
hasn't been run here. What *was* checked without it:
- TypeScript, `strict: true`, compiles cleanly against everything **except** the parts
  that genuinely need real installed dependencies to type-check (Prisma's generated
  client types are produced by `prisma generate`, which needs network on first run to
  fetch the query engine; Express/Zod/Socket.IO's real published types aren't
  resolvable without `node_modules`). A `declare module '*'` stub was used to at least
  isolate syntax and internal-consistency issues from that noise, but it can't validate
  third-party call signatures — for that, `npm run typecheck` locally is the real check.
- Every relative import path (214 of them) was verified to resolve to a real file, and
  every named/default import from a local module (248 of them) was cross-checked
  against that file's actual exports.
- One real bug was caught this way during the conversion: `updateProduct` was typed
  against Prisma's relation-style `ProductUpdateInput` instead of the scalar-FK
  `ProductUncheckedUpdateInput` it actually needed — fixed.

Do `npm install && npm run typecheck && npm run prisma:migrate` locally before trusting
this against real traffic.
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
