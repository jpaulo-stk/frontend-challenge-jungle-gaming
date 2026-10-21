import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@/styles/globals.css";

async function bootstrap() {
  // The simulated backend must be running before the app module graph loads:
  // socket.io-client captures the WebSocket constructor when it is imported.
  if (import.meta.env.VITE_ENABLE_MOCKS === "true") {
    const { startMocks } = await import("@/mocks/browser");
    await startMocks();
  }

  const { AppProviders } = await import("@/app/providers");

  const container = document.getElementById("root");
  if (!container) throw new Error("Root element #root not found in index.html");

  createRoot(container).render(
    <StrictMode>
      <AppProviders />
    </StrictMode>,
  );
}

void bootstrap();
