# Aandata — Smart Farming. Better Decisions.

AI-powered agricultural marketplace and farming assistance platform for
Indian farmers. **This is the frontend only** — mock data throughout,
built so a backend can be dropped in later without UI rewrites (see
`docs/API_INTEGRATION.md`).

## Stack

React 19 · Vite · TypeScript · Tailwind CSS v4 · React Router 7 ·
Framer Motion · Recharts · Lucide · Axios · vite-plugin-pwa

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

Open the printed local URL. A mock user (Rajesh Kumar — buyer **and**
seller on one account) is auto-signed-in so the shell can be explored
immediately; a real login screen is built in Phase 2.

```bash
npm run build      # production build to dist/
npm run preview    # preview the production build locally
```

## Known limitations (by design, for this milestone)

- **No route guarding.** `/admin/*` and `/seller/*` are reachable by anyone
  in this build — there's no backend to check roles against yet. When
  auth is connected, add a `RequireRole` wrapper around these route groups.
- **State doesn't persist across a refresh.** Cart, wishlist, orders,
  listings, etc. live in React context (in-memory) rather than
  localStorage or a backend, so a page refresh resets them. This was a
  deliberate choice to avoid modeling a fake persistence layer that would
  need to be thrown away once the backend lands — flag if you'd prefer
  localStorage-backed mocks in the meantime.
- **No photography.** Product/land/machinery imagery uses consistent icon
  placeholders rather than stock photos, since sourcing real images isn't
  meaningful for a mock-data build — swap in real seller-uploaded images
  once the backend provides them.

## Where things are

```
src/
├── components/       common/ layout/ (marketplace/ ai/ mandi/ seller/ admin/ added as those phases land)
├── context/           LanguageContext, AuthContext, AppModeContext
├── data/mock/          centralized mock datasets — never inline mock arrays in a page
├── layouts/            AppLayout (main shell), AuthLayout (auth screens)
├── locales/             en.json, hi.json + registry of planned languages
├── pages/                one folder per feature area, mirrors the route map
├── routes/               AppRouter.tsx (all routes), navConfig.ts (nav items)
├── services/             api.ts (Axios client) + per-feature service modules
├── types/                 shared TypeScript types
└── utils/                  cn(), formatINR(), date/percent formatting helpers
```

## Build status — phase by phase

This project is being built in the phased order from the original brief,
checked for compile/runtime errors after each phase before moving on.

- ✅ **Phase 1 — Setup, theme, routing, layout, nav, language system.** Done.
  Project scaffold, design tokens, Tailwind v4 theme, self-hosted fonts
  (Manrope/Inter/Hind), full i18n system (English + Hindi, 9 more languages
  wired into the picker as "coming soon"), all ~55 SRS routes wired with
  code-split lazy loading, responsive shell (desktop sidebar / mobile bottom
  nav), Buy↔Sell switch, notification bell, language switcher, PWA manifest
  + icons.
- 🟡 **Home & Profile pages** were pulled forward from Phase 3 because they
  anchor the shell and needed real content to prove the architecture end to
  end — including the **mandatory one-account, buyer+seller dual-role**
  requirement, visible on the Profile page and in the header's profile menu.
- ✅ **Phase 2 — Auth screens, Settings.** Login → OTP → session, Register,
  Forgot/Reset Password, Settings (language, notification toggles, logout),
  all wired to the mock `authService`.
- ✅ **Phase 3 — Marketplace, Cart, Wishlist.** Full product catalog with
  specs/variants/reviews, search + filter + sort, category pages, product
  details, a real cart (`CartContext`: add/remove/quantity/save-for-later),
  wishlist (`WishlistContext`).
- ✅ **Phase 4 — Checkout, Orders, Notifications.** 4-step checkout that
  places a real mock order and clears the cart, order history, order
  tracking with the full Placed→Confirmed→Packed→Shipped→Delivered stages,
  notification center shared with the header bell (`NotificationContext`).
- ✅ **Phase 5 — Mandi, Weather.** Cascading State→District→Mandi→Crop
  filters, favorites, price alerts, a Recharts price-history chart with
  7d/30d/3m ranges, and a full weather page (current/hourly/7-day/advice).
- ✅ **Phase 6 — Krishi AI.** All 10 sub-features: Crop Advisor, Disease
  Detection (camera/upload with loading/success/error/retry states), Soil
  Analysis (manual entry or report upload, visual Good/Medium/Low bars),
  Fertilizer Advice, Irrigation Advice, Crop Rotation planner, AI Chat
  (Hindi/English pattern-matched mock responses), Voice Assistant
  (ready/listening/processing/response states), and AI History pulling
  real entries logged by the other features (`AiContext`).
- ✅ **Phase 7 — Seed Store.** Dedicated catalog, details, and a genuinely
  separate cart + order history from the main marketplace (`SeedCartContext`),
  per the SRS's "Seed Store is a dedicated sub-marketplace" requirement.
- ✅ **Phase 8 — Land Marketplace.** Listings, details with a map
  placeholder, and a working visit-request flow with status tracking
  (`LandContext`).
- ✅ **Phase 9 — Machinery Rental.** Listings, details with a real booking
  form, and a bookings history page (`MachineryContext`).
- ✅ **Phase 10 — Seller Tools.** Seller hub, 5-step onboarding that adds
  the seller role to the *same* account (never a second login), dashboard
  with Recharts sales/revenue charts, My Listings (active/pending/inactive
  tabs with activate/deactivate/delete), a 7-step Add Product flow that
  actually publishes into My Listings, Orders-to-Fulfill with status
  advancement, and full Analytics (`SellerContext`).
- ✅ **Phase 11 — Admin Console.** Dashboard with GMV trend chart, Users
  table, Seller application approve/reject queue, Product moderation
  (remove), Categories overview, Review moderation (remove), Seed
  management table, and platform Analytics (`AdminContext`).
- ✅ **Phase 12 — Final pass.** Skip-to-content link for keyboard users,
  full route smoke test (every route returns 200, deep links work), PWA
  manifest/icons/offline shell confirmed via `vite-plugin-pwa`.

`npx tsc --noEmit` and `npm run build` both pass clean across the whole app.
Every route in the original SRS route map (section 57) is now backed by a
real, interactive page — nothing left as a placeholder.

## Gap-closing pass (against the real Smart_Krishi_Requirements.docx SRS)

After cross-checking against the actual uploaded SRS document (not just the
build brief), three gaps were closed:

- **Profile & address editing.** `/profile/edit` for name/phone/email/
  location, plus a full address book on the Profile page (add, edit,
  delete, set default) — previously read-only.
- **Nearby Products & Top Deals.** The Marketplace page now shows two
  horizontal rails above the main grid: Top Deals (products with a real
  `originalPrice` discount) and Near You (sorted toward the signed-in
  user's city). Hidden during an active search to keep results focused.
- **Seller-side Land & Machinery listings.** `/seller/add-land` and
  `/seller/add-machinery` let a seller publish their own listings, which
  now appear merged with the mock catalog on `/land` and `/machinery`
  (`LandContext`/`MachineryContext` each expose `allListings` combining
  seller-published + seed data).

Known remaining gaps from the SRS, not yet closed: category/sub-category
hierarchy is flat (no sub-categories), and there's no feedback module or
login-history page (neither was in the original route map either).

## Conventions to keep in mind when continuing this build

- Centralize new mock data under `src/data/mock/`, never inline in a page.
- Every service method should be written so swapping its mock branch for a
  real `api.get/post(...)` call requires no changes in the component that
  calls it.
- New user-facing strings go in **both** `src/locales/en.json` and
  `src/locales/hi.json`, under a sensible namespace — `t()` is fully typed
  against the English file's key paths.
- No dead buttons — every interactive element should do something, even if
  it's just local mock state changing.
