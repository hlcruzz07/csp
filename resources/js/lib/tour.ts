import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './tour.css';

const STORAGE_PREFIX = 'tour-dismissed:';

/**
 * Starts a driver.js tour. Every step gets a "Skip tutorial" button and a
 * "Don't show this again" checkbox injected into its footer. Checking the
 * box persists the dismissal regardless of how the tour ends (skip button,
 * clicking outside, pressing Escape, or finishing normally).
 */
export function startTour({ steps, config }: any) {
    if (steps.length === 0) return null;

    const driverObj = driver({
        showProgress: true,
        allowClose: true,
        overlayOpacity: 0.55,
        smoothScroll: true,
        popoverClass: 'driver-tour-popover',
        steps,
        ...config,
    });

    driverObj.drive();
    return driverObj;
}
/** Clears the "don't show again" flag so the tour can run again. */
export function resetTour(tourId: string) {
    try {
        localStorage.removeItem(`${STORAGE_PREFIX}${tourId}`);
    } catch {
        // no-op
    }
}
