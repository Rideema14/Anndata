/**
 * Tracking cron compatibility entry point.
 *
 * Automatic third-party shipment tracking has intentionally been removed
 * from the current application. Shipment information is seller-submitted and
 * delivery is verified manually by an administrator.
 *
 * This module remains so older startup/import code can safely import the
 * scheduler without bringing back the removed tracking provider.
 */

export async function runTrackingCron(): Promise<void> {
  // Intentionally empty: there is no external tracking provider to poll.
}

export async function trackingCron(): Promise<void> {
  await runTrackingCron();
}

export function startTrackingCron(): { stop: () => void } {
  return {
    stop: () => undefined,
  };
}

export default startTrackingCron;
