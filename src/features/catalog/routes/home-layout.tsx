import { Outlet } from "@tanstack/react-router";

import { HomePage } from "@/features/catalog/routes/home-page";

/**
 * The home stays mounted under its child routes: /entrar and /criar-conta open
 * as dialogs over it, so a direct visit or refresh never shows a blank page.
 */
export function HomeLayout() {
  return (
    <>
      <HomePage />
      <Outlet />
    </>
  );
}
