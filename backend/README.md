# Agri Marketplace — Backend (Phase 1 + Phase 2 partial)

Node.js/Express backend for the multi-category agricultural marketplace, written in
**TypeScript**. Built with **PostgreSQL + Prisma**, **JWT auth** (access + rotating
refresh tokens), **email OTP** verification, **Google Sign-In**, **Razorpay**
payments, **Cloudinary** image storage, and **Socket.IO** for live order-status
updates.

## What's implemented

| Module | Covers |
|---|---|
| **Auth** (`/auth`, `/users`) | Register + email OTP verification, login, Google OAuth sign-in/link, JWT access/refresh with rotation, forgot/reset password, profile + profile image, address book, login history |
| **Catalog** (`/categories`, `/products`, `/wishlist`) | Category/sub-category CRUD (admin), product CRUD with images (Cloudinary) and variants, search/filter/sort/pagination, nearby-products (Haversine distance), top-deals, reviews with rating aggregation + moderation, wishlist |
| **Cart** (`/cart`) | Add/update/remove items, live price computation, stock checks |
| **Orders** (`/orders`) | Checkout (cart → order, race-safe stock decrement, address selection), order history, status updates with full audit history, cancellation with stock restoration, live push over Socket.IO |
| **Payments** (`/payments`) | Razorpay order creation, client-side signature verification, server-to-server webhook (idempotent, signature-verified against the raw payload) |
| **Sellers** (`/sellers`) | Application/verification workflow (auto-promotes to the `SELLER` role on approval), profile with payout bank details + service area, dashboard (active listings, orders to fulfill, revenue), analytics (daily sales trend, top products, order-status breakdown), and a reviews inbox (`GET /sellers/reviews` — every review left on their products: reviewer name + photo, rating, comment, which product; this is what a frontend "Feedback" button/section for sellers should call) |
| **Notifications & Feedback** (`/notifications`) | In-app + email notifications with per-user, per-type preferences (mute specific types, toggle channels globally); feedback submission (works anonymously or logged in), admin triage/response |
| **Mandi Price Intelligence** (`/mandi`) | Markets + crops (admin-managed), price entry (single + bulk upload), state→district→market cascading filters, price history for charting, favorite markets, price threshold alerts (wired into the notification system above) — plus an *optional* sync from data.gov.in's real Agmarknet dataset, inactive until you supply your own API key |
| **Weather Intelligence** (`/weather`) | Current conditions + up to 16-day forecast via Open-Meteo (free, no API key needed), DB-backed cache (`WeatherCache`) to avoid re-fetching the same location on every request |
| **Admin Console** (`/admin`) | Platform-wide analytics (user/seller counts, total orders, GMV + monthly GMV trend, order-status breakdown), user management (list/search/filter, activate/deactivate, role changes), a cross-product review moderation queue, and product oversight that (unlike the public catalog) also shows inactive listings. Category CRUD, review approval actions, and the seller-verification console already existed in Catalog/Sellers — this module adds what didn't: user management and platform-wide analytics. |
| **Seed Store** (`/seeds`) | A fully independent sub-marketplace — own categories, catalog (with variety/sowing-season/germination-rate fields, plus variants and images), reviews, wishlist, cart, checkout, orders with status tracking, and its own Razorpay integration (own webhook endpoint too). Deliberately *not* built by reusing `Product`/`Order` — the spec calls for genuinely separate structures, and the frontend's `SeedCartContext` already assumes that independence. The "AI seed advisor" mentioned alongside this in the spec is intentionally excluded — that belongs with AI Farm Advisory (3.9), which needs its own provider decision first. |

Full endpoint list is in Swagger at `/api-docs` once the server is running.

## Not yet built

The original spec has 13 modules; this covers everything except:

- **3.6 Land Marketplace** — listings + site-visit request workflow
- **3.7 Machinery & Equipment Rental** — rental bookings with date ranges
- **3.9 AI Farm Advisory Suite** — crop/disease/soil/fertilizer/irrigation/weather advice, AI chat, voice, and the seed advisor referenced in 3.5

Ask to continue building either of these and it'll plug into the same `src/modules/<name>/`
pattern and the existing Prisma schema.

## Seed Store routing — mount order matters

`/seeds` (the seed catalog itself) and `/seeds/categories`, `/seeds/wishlist`, `/seeds/cart`,
`/seeds/orders`, `/seeds/payments` are separate routers in `routes/index.ts`. The specific
ones **must** be registered before the bare `/seeds` mount — Express matches prefixes in
registration order, so `/seeds` alone would otherwise swallow `/seeds/categories` and try to
route `categories` into `seed.routes.ts`'s `GET /:slug` handler as if it were a seed's slug.
If you ever reorder these, keep the specific prefixes first.

## On the two external data sources

- **Weather (Open-Meteo)**: genuinely free, no API key, no signup — verified via their public docs. `OPEN_METEO_BASE_URL` in `.env` only needs to change if you're self-hosting their (also open-source) service.
- **Mandi prices (data.gov.in)**: the real dataset ("Variety-wise Daily Market Prices of Commodity") requires *your own* free API key and the dataset's current resource ID, so it's optional — set `DATA_GOV_IN_API_KEY` and `DATA_GOV_IN_RESOURCE_ID` in `.env` and `POST /mandi/sync` pulls real records. Without either seller entering data manually via `POST /mandi/prices` / `/mandi/prices/bulk` still works with zero setup. The field mapping in `src/modules/mandi/ingestion.service.ts` (`State`/`District`/`Market`/`Commodity`/`Variety`/`Arrival_Date`/`Min_Price`/`Max_Price`/`Modal_Price`, PascalCase) has been **confirmed against a live response with a real key** — it's not a guess anymore.

## "Feedback" means two different things here — on purpose, kept apart

- **`/sellers/reviews`** is a seller's view of the existing product **Review** system
  (`Product` → `Review`, the same thing `POST /products/:id/reviews` writes to). It's
  everything a customer said about their products — rating, comment, reviewer name +
  profile picture, which product — newest first. If your frontend shows sellers a
  button labeled "Feedback," this is the endpoint it should call.
- **`/notifications/feedback`** is a *separate*, already-existing model — bug reports,
  feature requests, complaints, submitted by anyone (logged in or not) about the
  platform itself, triaged by admins. Nothing to do with product reviews.

They're named differently in the API specifically so they don't get confused with each
other later — worth keeping that distinction in mind if you add more to either one.

## Cloudinary cleanup — what's covered

Every image this project stores in Cloudinary is cleaned up when it stops being
referenced, so nothing accumulates as orphaned storage:
- **Product images**: deleting one image, or deleting the whole product, removes the
  matching Cloudinary asset(s).
- **Profile pictures**: replacing one (`POST /users/me/image`) deletes the old asset;
  `DELETE /users/me/image` removes the picture entirely (also from Cloudinary).
- **Category images**: same as profile pictures — replacing or deleting a category's
  image cleans up Cloudinary. (This one required a small schema change: `Category`
  didn't originally store the image's `publicId`, so there was nothing to delete by —
  fixed by adding `Category.imagePublicId`, same pattern already used for `User` and
  `ProductImage`.)

All of these are "best-effort" deletes (`.catch(() => {})`) — if Cloudinary is briefly
unreachable, the database operation still succeeds rather than failing the user's
request over a storage-cleanup step; you'd just be left with one orphaned asset to
clean up later rather than a broken delete/update.

## Tech stack & key decisions

- **TypeScript**, strict mode. Every third-party surface this project touches
  (`req.user`, `req.rawBody`, Socket.IO's custom socket fields) is properly typed via
  declaration merging in `src/types/express.d.ts`. The `razorpay` package doesn't ship
  reliable types, so `src/types/razorpay.d.ts` hand-declares just the slice this
  project calls.
- **PostgreSQL via Prisma** — chosen over MongoDB because orders/payments/inventory need
  real transactions, and the domain (users→addresses, orders→items→payments 1:1,
  cart→items, category→subcategory→product) is inherently relational. `Json` columns
  (`Product.specifications`, `ProductVariant.attributes`) give you Mongo-like flexibility
  exactly where the data genuinely varies, without losing integrity everywhere else.
- **Prisma pinned to 5.22.x** rather than the current major (Prisma 7 shipped a large
  ESM/config rewrite in late 2025). Deliberate, stable choice — bump it yourself when
  you're ready, it's just a version bump in `package.json`.
- **Socket.IO** stands in for the original spec's STOMP-over-WebSocket — same result
  (live order-status push), more idiomatic in the Express ecosystem.
- **Refresh token rotation**: refresh tokens are opaque random strings (not JWTs),
  stored only as a SHA-256 hash (`RefreshToken` table), and rotated on every use — a
  leaked DB dump can't be replayed, and reuse of an old token is detectable.
- **Razorpay webhook**: verified against the *raw* request bytes (captured via the
  `verify` hook on `express.json()` in `app.ts`), not a re-serialized body — a common
  gotcha that silently breaks HMAC verification if you get it wrong.
- **Checkout race safety**: stock is decremented inside the order transaction using a
  guarded `UPDATE ... WHERE stock >= quantity`, not a plain decrement — two concurrent
  checkouts for the last unit can't both succeed.
- **Seller analytics/dashboard** use raw parameterized SQL (`prisma.$queryRaw`) rather
  than the query builder — the numbers span three joined tables (Order/OrderItem/Product)
  with `GROUP BY`/date-truncation the query builder can't express directly.

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
npm run dev       # tsx watch, auto-reload, no separate build step
npm run typecheck # tsc --noEmit, checks the whole project without producing output
npm run build      # compiles src/ -> dist/
npm start          # runs the compiled dist/server.js
```
API root: `http://localhost:5000/api/v1` · Swagger: `http://localhost:5000/api-docs`

### Razorpay webhook locally
Razorpay needs a public URL to call. Use a tunnel (e.g. `ngrok http 5000`) and
register `https://<tunnel>/api/v1/payments/webhook` in the Razorpay dashboard, with
the **same secret** as `RAZORPAY_WEBHOOK_SECRET` in `.env`.

## Project layout

```
src/
  types/           Express Request/Socket.IO augmentation, hand-written Razorpay types
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
    seller/        application/verification, dashboard, analytics
    notification/  in-app + email notifications, preferences, feedback
    mandi/         markets, crops, prices, history, favorites, alerts, optional data.gov.in sync
    weather/       Open-Meteo integration + DB-backed cache
    admin/         user management, platform analytics, review moderation queue, product oversight
    seedstore/     independent seed catalog/cart/order/payment/review/wishlist (mirrors catalog+cart+order+payment)
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
spec — adjust them to your actual policy:
- Flat shipping fee ₹49, free above ₹999 subtotal
- Flat 5% tax
- No coupon/discount system yet (the `discount` column exists on `Order` for when you add one)

A couple more, elsewhere:
- `WEATHER_CACHE_TTL_MINUTES=30` — how long a cached forecast is served before re-fetching. Weather doesn't change fast enough to need much lower; raise it if you want to be gentler on Open-Meteo's free tier.
- Mandi price alerts have a 24-hour re-trigger cooldown per alert (`alert.service.ts`) so a price sitting past someone's threshold doesn't re-notify them on every single price tick.

## A note on testing this without installing anything

`npm install` needs network access this sandbox doesn't have, so a live DB round-trip
hasn't been run here. What *was* checked without it:
- Every relative import path (373 of them, across the whole project) was verified to
  resolve to a real file, and every named/default import from a local module (435 of
  them) was cross-checked against that file's actual exports.
- A manual, targeted re-check for the one class of Prisma typing mistake this project
  has actually hit before (using the relation-style `XUpdateInput` where scalar FK
  fields are being set directly, instead of `XUncheckedUpdateInput`) — none found in
  the admin/seedstore modules.
- Compound unique-key names used in code (e.g. `cartId_seedId_variantId`,
  `seedId_userId`) were checked against the exact field order in each model's
  `@@unique([...])` declaration — Prisma derives the key name from that order, so a
  mismatch there is a real, easy-to-make bug.
- `tsc --noEmit` against a temporary `declare module '*'` stub was tried and abandoned
  as not useful: without real `node_modules`, that stub can't provide named exports
  for anything (Prisma's generated model types, Express's `Request`, Zod's `infer`,
  etc.), so nearly every error it reported was "no exported member" noise, not a real
  bug. The checks above are what actually caught something.

Run `npm install && npm run typecheck && npm run prisma:migrate` locally before trusting
this against real traffic.
