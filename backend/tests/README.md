# Tests

Zero new dependencies — this uses Node's built-in test runner (`node:test` /
`node:assert`, stable since Node 18/20) via `tsx`, which is already a
project dependency. No Jest/Vitest/Mocha/supertest added.

```
tests/
  unit/          pure logic — some need the generated Prisma client just to
                 import the module they're testing (see below), but touch
                 no database themselves.
  integration/   exercise the real service layer (shipment.service,
                 order.service, dispute.service, admin.service) against a
                 real, migrated Postgres database.
  helpers/       shared fixture creation (users/products/orders) + cleanup.
```

## Running

```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL at minimum
npm run prisma:generate
npm run prisma:migrate:deploy   # or prisma:migrate for a dev DB

# Recommended: point DATABASE_URL at a disposable test database, not your
# real dev data — the integration tests create and delete real rows.

TRACKING_SIMULATE=true \
TRACKINGMORE_WEBHOOK_SECRET=test-secret@example.com \
npm test
```

Two env vars gate parts of the suite (both optional — the affected tests
skip themselves with a note if unset, rather than failing):

- `TRACKING_SIMULATE=true` — required for the AWB-verification and
  tracking-sync tests, since without it they'd need a real TrackingMore API
  key to verify AWBs against. Simulation mode is the same one
  `tracking.service.ts` uses for local development.
- `TRACKINGMORE_WEBHOOK_SECRET=<any value>` — required for the webhook
  signature tests, which sign a payload with this same value and confirm
  `verifyTrackingMoreWebhookSignature` accepts it (and rejects tampering).

`npm run test:unit` runs only the fully DB-free subset.

## Why this couldn't be verified end-to-end while writing it

This was built in a sandboxed environment without egress to
`binaries.prisma.sh`, so `prisma generate` couldn't produce a real query
engine there and none of the Prisma-backed code could be executed. What
*was* verified in that environment:

- The hand-written migration SQL, run against a real local Postgres
  instance (including the historical-data backfill), and confirmed
  idempotent on a second run.
- `tests/unit/shipment-status-transitions.test.ts`, which imports only
  `shipment.constants.ts` — a `type`-only import of `@prisma/client`, so it
  never touches the unavailable engine. This actually caught a real bug
  (an `OUT_FOR_DELIVERY -> SHIPPED` transition that contradicted the rank
  table the sync logic relies on) before this ever reached you.
- Everything else here — including the rest of this file's suite — is
  written and reviewed but not executed by that process. Run it for real
  in an environment with normal internet access before deploying.
