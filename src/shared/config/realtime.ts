/**
 * Origin of the Socket.IO server. With mocks enabled the default host is
 * intercepted by MSW and no connection ever leaves the browser.
 */
export const REALTIME_URL = import.meta.env.VITE_REALTIME_URL ?? "wss://realtime.kurio.test";
