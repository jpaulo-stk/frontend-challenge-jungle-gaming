import { useQuery } from "@tanstack/react-query";
import { Outlet, useMatchRoute } from "@tanstack/react-router";

import { useSessionExpiry } from "@/app/use-session-expiry";
import { cartQueryOptions } from "@/shared/cart/cart-api";
import { useSession } from "@/shared/session/session-api";
import { useLogout } from "@/shared/session/use-logout";
import { AppFooter } from "@/shared/ui/app-footer";
import { AppHeader } from "@/shared/ui/app-header";
import { AppTabBar } from "@/shared/ui/app-tab-bar";
import { LiveAnnouncer } from "@/shared/ui/live-announcer";

export function RootLayout() {
  useSessionExpiry();
  const session = useSession();
  const logout = useLogout();
  const cart = useQuery(cartQueryOptions);
  const cartCount = cart.data?.itemCount ?? 0;
  const user = session.data ? { name: session.data.user.displayName } : null;
  // The detail page has its own fixed purchase bar on mobile, as in the Figma frame.
  const onDetail = Boolean(useMatchRoute()({ to: "/nft/$nftId" }));

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-sm focus:bg-primary focus:px-4 focus:py-2 focus:text-bg"
      >
        Pular para o conteúdo
      </a>
      <AppHeader
        cartCount={cartCount}
        user={user}
        onLogout={() => {
          logout.mutate();
        }}
        loggingOut={logout.isPending}
      />
      <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <AppFooter />
      {!onDetail && <AppTabBar cartCount={cartCount} />}
      <LiveAnnouncer />
    </div>
  );
}
