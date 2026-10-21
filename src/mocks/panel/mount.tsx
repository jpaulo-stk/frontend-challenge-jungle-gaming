import { createRoot } from "react-dom/client";

import { MockPanel } from "@/mocks/panel/mock-panel";

export function mountMockPanel(): void {
  const container = document.createElement("div");
  container.id = "kurio-mock-panel";
  document.body.append(container);
  createRoot(container).render(<MockPanel />);
}
