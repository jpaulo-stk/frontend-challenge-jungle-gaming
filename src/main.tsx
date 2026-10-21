import "@/styles/globals.css";

async function bootstrap() {
  // App and mocks download in parallel; rendering waits for the mocks because
  // socket.io-client must see the intercepted WebSocket (it is imported later, on demand).
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
