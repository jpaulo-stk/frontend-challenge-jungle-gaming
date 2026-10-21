import { createRoot } from "react-dom/client";

import { MockPanel } from "@/mocks/panel/mock-panel";

/** Renders the panel in its own root, outside the application tree. */
export function mountMockPanel(): void {
  const container = document.createElement("div");
  container.id = "kurio-mock-panel";
  document.body.append(container);
  createRoot(container).render(<MockPanel />);
}
