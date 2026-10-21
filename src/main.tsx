import "@/styles/globals.css";

async function bootstrap() {
  // The entry holds only this bootstrap: React, the app and the simulated
  // backend are separate chunks that download in parallel from the start.
  // Nothing renders (so no request leaves) before the mocks answer.
  // socket.io-client captures the WebSocket constructor when imported, so the
  // app only loads it on demand, after this point (shared/realtime/socket.ts).
  const app = import("@/app/render");
  if (import.meta.env.VITE_ENABLE_MOCKS === "true") {
    const { startMocks } = await import("@/mocks/browser");
    await startMocks();
  }

  const { renderApp } = await app;

  const container = document.getElementById("root");
  if (!container) throw new Error("Root element #root not found in index.html");
  renderApp(container);
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
