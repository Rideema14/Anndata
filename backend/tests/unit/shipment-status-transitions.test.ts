import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ORDER_STATUS_TRANSITIONS,
  ORDER_STATUS_RANK,
  SHIPMENT_STATUS_RANK,
  SHIPMENT_STATUS_TO_ORDER_STATUS,
  TERMINAL_SHIPMENT_STATUSES,
} from '../../src/modules/order/shipment.constants';

describe('ORDER_STATUS_TRANSITIONS', () => {
  it('rejects the specific invalid transitions called out in the spec', () => {
    assert.ok(!ORDER_STATUS_TRANSITIONS.DELIVERED.includes('SHIPPED'), 'DELIVERED -> SHIPPED must be rejected');
    assert.ok(!ORDER_STATUS_TRANSITIONS.DELIVERED.includes('PROCESSING'), 'DELIVERED -> PROCESSING must be rejected');
    assert.ok(!ORDER_STATUS_TRANSITIONS.SHIPPED.includes('PENDING'), 'SHIPPED -> PENDING must be rejected');
  });

  it('never allows moving backwards to PENDING or CONFIRMED from anywhere but PENDING itself', () => {
    for (const [from, tos] of Object.entries(ORDER_STATUS_TRANSITIONS)) {
      if (from === 'PENDING') continue;
      assert.ok(!tos.includes('PENDING'), `${from} -> PENDING must be rejected`);
      if (from !== 'CONFIRMED') {
        assert.ok(!tos.includes('CONFIRMED'), `${from} -> CONFIRMED must be rejected`);
      }
    }
  });

  it('allows the normal happy-path progression', () => {
    assert.ok(ORDER_STATUS_TRANSITIONS.PENDING.includes('CONFIRMED'));
    assert.ok(ORDER_STATUS_TRANSITIONS.CONFIRMED.includes('SHIPPED'));
    assert.ok(ORDER_STATUS_TRANSITIONS.SHIPPED.includes('OUT_FOR_DELIVERY'));
    assert.ok(ORDER_STATUS_TRANSITIONS.OUT_FOR_DELIVERY.includes('DELIVERED'));
  });

  it('only allows DISPUTED to be reached from DELIVERED', () => {
    for (const [from, tos] of Object.entries(ORDER_STATUS_TRANSITIONS)) {
      if (from === 'DELIVERED') continue;
      assert.ok(!tos.includes('DISPUTED'), `${from} -> DISPUTED must be rejected (only DELIVERED may reach DISPUTED)`);
    }
  });

  it('lets a resolved dispute return to DELIVERED, or record a courier-confirmed return', () => {
    assert.deepEqual(ORDER_STATUS_TRANSITIONS.DISPUTED.sort(), ['DELIVERED', 'RETURNED'].sort());
  });

  it('has no outgoing transitions from terminal states', () => {
    assert.deepEqual(ORDER_STATUS_TRANSITIONS.CANCELLED, []);
    assert.deepEqual(ORDER_STATUS_TRANSITIONS.RETURNED, []);
  });

  it('every listed target transition strictly increases (or holds, for the DISPUTED side-state) rank — never regresses', () => {
    for (const [from, tos] of Object.entries(ORDER_STATUS_TRANSITIONS)) {
      const fromRank = ORDER_STATUS_RANK[from as keyof typeof ORDER_STATUS_RANK];
      for (const to of tos) {
        const toRank = ORDER_STATUS_RANK[to];
        assert.ok(toRank >= fromRank, `${from}(${fromRank}) -> ${to}(${toRank}) must not decrease rank`);
      }
    }
  });
});

describe('SHIPMENT_STATUS_RANK', () => {
  it('ranks the happy path strictly increasing', () => {
    const happyPath = ['AWB_SUBMITTED', 'AWB_VERIFIED', 'PICKUP_CONFIRMED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'] as const;
    for (let i = 1; i < happyPath.length; i++) {
      assert.ok(
        SHIPMENT_STATUS_RANK[happyPath[i]] > SHIPMENT_STATUS_RANK[happyPath[i - 1]],
        `${happyPath[i]} must rank higher than ${happyPath[i - 1]}`,
      );
    }
  });

  it('never ranks DELIVERY_FAILED below OUT_FOR_DELIVERY, so a failed-attempt event cannot silently downgrade the shipment', () => {
    assert.ok(SHIPMENT_STATUS_RANK.DELIVERY_FAILED >= SHIPMENT_STATUS_RANK.OUT_FOR_DELIVERY);
  });

  it('ranks RETURNED as terminal (same as DELIVERED), so a stale in-transit event can never overwrite it', () => {
    assert.equal(SHIPMENT_STATUS_RANK.RETURNED, SHIPMENT_STATUS_RANK.DELIVERED);
  });
});

describe('TERMINAL_SHIPMENT_STATUSES', () => {
  it('only DELIVERED and RETURNED stop the tracking cron from polling further', () => {
    assert.deepEqual(TERMINAL_SHIPMENT_STATUSES.sort(), ['DELIVERED', 'RETURNED'].sort());
  });
});

describe('SHIPMENT_STATUS_TO_ORDER_STATUS', () => {
  it('every mapped OrderStatus target is a real, valid transition from CONFIRMED (the state after AWB submission)', () => {
    // Every shipment-driven status must be reachable from the order-status
    // graph without ever needing a manual/seller-only hop — i.e. the whole
    // chain from CONFIRMED onward must exist for courier-only advancement
    // to work at all.
    const reachableFromConfirmed = new Set<string>(['CONFIRMED']);
    let grew = true;
    while (grew) {
      grew = false;
      for (const from of reachableFromConfirmed) {
        for (const to of ORDER_STATUS_TRANSITIONS[from as keyof typeof ORDER_STATUS_TRANSITIONS] ?? []) {
          if (!reachableFromConfirmed.has(to)) {
            reachableFromConfirmed.add(to);
            grew = true;
          }
        }
      }
    }
    for (const target of Object.values(SHIPMENT_STATUS_TO_ORDER_STATUS)) {
      assert.ok(reachableFromConfirmed.has(target as string), `${target} must be reachable from CONFIRMED via ORDER_STATUS_TRANSITIONS`);
    }
  });
});
