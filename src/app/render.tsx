import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AppProviders } from "@/app/providers";

export function renderApp(container: HTMLElement): void {
  createRoot(container).render(
    <StrictMode>
      <AppProviders />
    </StrictMode>,
  );
}
