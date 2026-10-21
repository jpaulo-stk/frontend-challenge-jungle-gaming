// Typed Vite environment variables (see .env.example).
// Declaration merging with Vite's `ImportMetaEnv` requires an interface.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface ImportMetaEnv {
  /** "true" starts the simulated API (MSW + Socket.IO) before the app. */
  readonly VITE_ENABLE_MOCKS?: string;
  /** Socket.IO server origin; defaults to the mocked wss://realtime.kurio.test. */
  readonly VITE_REALTIME_URL?: string;
}
