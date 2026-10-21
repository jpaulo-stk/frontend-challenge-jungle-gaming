import { Outlet } from "@tanstack/react-router";

import { AppFooter } from "@/shared/ui/app-footer";
import { AppHeader } from "@/shared/ui/app-header";
import { AppTabBar } from "@/shared/ui/app-tab-bar";

// Cart count and session come from the API once those features exist.
const VISITOR = { cartCount: 0, user: null };

export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-sm focus:bg-primary focus:px-4 focus:py-2 focus:text-bg"
      >
        Pular para o conteúdo
      </a>
      <AppHeader cartCount={VISITOR.cartCount} user={VISITOR.user} />
      <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <AppFooter />
      <AppTabBar cartCount={VISITOR.cartCount} />
    </div>
  );
}
