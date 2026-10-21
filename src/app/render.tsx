import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AppProviders } from "@/app/providers";

/** Mounts the app. Kept out of main.tsx so the entry chunk stays tiny (see there). */
export function renderApp(container: HTMLElement): void {
  createRoot(container).render(
    <StrictMode>
      <AppProviders />
    </StrictMode>,
  );
}
