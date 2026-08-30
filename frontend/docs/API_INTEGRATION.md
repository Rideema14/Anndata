# FarmVerse— Frontend API Integration Guide

This document describes what the **frontend currently expects** from the
backend, based on the mock data and TypeScript types already in the
codebase. Nothing here is a final contract — it's the shape the UI is built
against today, so the backend team has a concrete starting point. Adjust
freely; when a field changes, update the corresponding type in `src/types/`
and the frontend will surface the mismatch at compile time.

## How integration works

Every feature has a `service` module in `src/services/` (e.g.
`authService.ts`, and more added in later phases: `productService.ts`,
`cartService.ts`, `orderService.ts`, `sellerService.ts`, `mandiService.ts`,
`weatherService.ts`, `aiService.ts`, `seedService.ts`, `landService.ts`,
`machineryService.ts`, `notificationService.ts`). Components never import
mock data directly in the final version — they call a service method, which
today resolves mock data via `simulateRequest()` and later will call the
shared Axios client `api` from `src/services/api.ts`.

**To connect a real endpoint:** open the relevant service file, replace the
mock branch with `return (await api.get('/products')).data` (or `post`,
etc.), matching the response shape to the TypeScript type. No component code
needs to change as long as the resolved shape matches the type.

Base URL comes from `VITE_API_BASE_URL` (see `.env.example`).

Auth: the Axios instance (`src/services/api.ts`) already attaches
`Authorization: Bearer <token>` from `localStorage['aandata.authToken']` on
every request, so once `POST /auth/login` returns a real token, no other
code needs to change.

## Data shapes defined so far

### User (`src/types/index.ts`)

```ts
interface User {
  id: string
  name: string
  phone: string
  email?: string
  avatarUrl?: string
  location: string
  language: string          // ISO-ish code, e.g. "en" | "hi"
  roles: ('buyer' | 'seller' | 'admin')[]   // one account, multiple roles — see below
  sellerVerification: 'none' | 'pending' | 'verified' | 'rejected'
  addresses: Address[]
  createdAt: string         // ISO 8601
}

interface Address {
  id: string
  label: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}
```

**Important:** `roles` is an array on a single user record — there is no
separate seller account/table implied by the frontend. A user who applies
via `/seller/onboarding` and gets approved should simply gain `'seller'` in
their `roles` array (and `sellerVerification` moves to `'verified'`), not be
issued a second account or a second login.

### ProductSummary (`src/types/index.ts`) — expand in Phase 3

```ts
interface ProductSummary {
  id: string
  name: string
  category: string
  price: number
  unit: string          // e.g. "30 kg bag", "per unit"
  sellerName: string
  location: string
  rating: number
}
```

This will grow substantially in Phase 3 (marketplace) to include images,
description, specifications, variants, stock, and reviews — this is
intentionally the minimal teaser shape used on the Home page today.

### OrderSummary (`src/types/index.ts`) — expand in Phase 4

```ts
type OrderStatus = 'placed' | 'confirmed' | 'packed' | 'shipped' | 'delivered'

interface OrderSummary {
  id: string
  itemsLabel: string
  total: number
  status: OrderStatus
  placedAt: string       // ISO 8601
}
```

`status` maps directly to the 5-stage tracker in the SRS
(Placed → Confirmed → Packed → Shipped → Delivered). The frontend expects
a single current status per order today; if the backend sends a full status
history, the tracker component can be extended to render it (flag this to
the frontend team when the shape is finalized).

### AppNotification (`src/data/mock/mockNotifications.ts`)

```ts
type NotificationType = 'mandi_alert' | 'order_update' | 'seller_verification' | 'new_order' | 'ai_recommendation'

interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  createdAt: string
  read: boolean
}
```

### Auth session (mock today, `src/services/authService.ts`)

Expected real endpoints (names not final):

```
POST /auth/login          { phone, password? }        -> { user: User, token: string }
POST /auth/otp/request     { phone }                   -> { requestId: string }
POST /auth/otp/verify      { requestId, otp }           -> { user: User, token: string }
POST /auth/register        { name, phone, ... }         -> { user: User, token: string }
POST /auth/google           { idToken }                  -> { user: User, token: string }
GET  /auth/me                (Bearer token)               -> User
POST /auth/logout            (Bearer token)               -> 204
```

## Shapes not yet defined

The following are referenced in the SRS but not yet modeled in TypeScript,
because their pages haven't been built yet: full Product (with variants/
specs/images), Cart, Seller listing, Mandi price row (state → district →
mandi → crop), Weather forecast (hourly/7-day), AI response (per feature:
crop advisor, disease detection, soil analysis, etc.), Seed, Land listing,
Machinery listing. Each will be added here as its phase is implemented —
see the project's phase plan for the order.

## Roles & mode — a note for backend design

The frontend's `AppModeContext` (Buy/Sell switch) is **pure UI state** and
has no backend equivalent — don't build an endpoint for it. Only `roles` on
the `User` record needs backend support.
