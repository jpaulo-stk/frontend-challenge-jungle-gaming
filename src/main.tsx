import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@/styles/globals.css";

async function bootstrap() {
  // The app downloads while the simulated backend starts; nothing renders (so
  // no request leaves) before the mocks answer. socket.io-client captures the
  // WebSocket constructor when imported, so the app only loads it on demand,
  // after this point (see shared/realtime/socket.ts).
  const app = import("@/app/providers");
  if (import.meta.env.VITE_ENABLE_MOCKS === "true") {
    const { startMocks } = await import("@/mocks/browser");
    await startMocks();
  }

  const { AppProviders } = await app;

  const container = document.getElementById("root");
  if (!container) throw new Error("Root element #root not found in index.html");

  createRoot(container).render(
    <StrictMode>
      <AppProviders />
    </StrictMode>,
  );
}

/** A boot that fails (a chunk that did not download, say) never leaves a blank page. */
function showBootError(error: unknown) {
  reportError(error);
  const container = document.getElementById("root");
  if (!container) return;
  const message = document.createElement("p");
  message.setAttribute("role", "alert");
  message.style.cssText = "padding: 2rem 1rem; text-align: center";
  message.textContent = "Não foi possível carregar a Kurio. ";
  const reload = document.createElement("a");
  reload.href = window.location.href;
  reload.textContent = "Recarregar";
  reload.style.textDecoration = "underline";
  message.append(reload);
  container.replaceChildren(message);
}

bootstrap().catch(showBootError);
