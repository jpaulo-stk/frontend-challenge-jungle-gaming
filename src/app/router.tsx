import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
} from "@tanstack/react-router";

import { queryClient } from "@/app/query-client";
import { NotFoundPage } from "@/app/not-found-page";
import { PagePending } from "@/app/page-pending";
import { RootLayout } from "@/app/root-layout";
import { RouteError } from "@/app/route-error";
import { parseSearch, stringifySearch } from "@/app/search-params";
import { authSearchSchema } from "@/features/auth/routes/auth-search-schema";
import { redirectIfSignedIn } from "@/features/auth/routes/redirect-if-signed-in";
import { requireAuth } from "@/features/auth/routes/require-auth";
import { catalogSearchSchema } from "@/features/catalog/routes/catalog-search";
import { HomeLayout } from "@/features/catalog/routes/home-layout";
import { loadNftDetail } from "@/features/nft-detail/routes/nft-detail-loader";
import { NftDetailPending } from "@/features/nft-detail/routes/nft-detail-pending";
import { loadOrder } from "@/features/orders/routes/order-loader";

// Every route but the home is lazy-loaded

type RouterContext = {
  queryClient: QueryClient;
};

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});

// Pathless layout: /entrar and /criar-conta open as dialogs over the home
const catalogLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_catalog",
  validateSearch: catalogSearchSchema,
  component: HomeLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => catalogLayoutRoute,
  path: "/",
});

const nftDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/nft/$nftId",
  loader: loadNftDetail,
  pendingComponent: NftDetailPending,
  pendingMs: 200,
  component: lazyRouteComponent(
    () => import("@/features/nft-detail/routes/nft-detail-page"),
    "NftDetailPage",
  ),
});

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/carrinho",
  component: lazyRouteComponent(() => import("@/features/cart/routes/cart-page"), "CartPage"),
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pagamento",
  beforeLoad: requireAuth,
  component: lazyRouteComponent(
    () => import("@/features/checkout/routes/checkout-page"),
    "CheckoutPage",
  ),
});

const orderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pedido/$orderId",
  beforeLoad: requireAuth,
  loader: loadOrder,
  component: lazyRouteComponent(() => import("@/features/orders/routes/order-page"), "OrderPage"),
});

const favoritesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/favoritos",
  beforeLoad: requireAuth,
  component: lazyRouteComponent(
    () => import("@/features/favorites/routes/favorites-page"),
    "FavoritesPage",
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => catalogLayoutRoute,
  path: "entrar",
  validateSearch: authSearchSchema,
  beforeLoad: redirectIfSignedIn,
  component: lazyRouteComponent(() => import("@/features/auth/routes/login-page"), "LoginPage"),
});

const registerRoute = createRoute({
  getParentRoute: () => catalogLayoutRoute,
  path: "criar-conta",
  validateSearch: authSearchSchema,
  beforeLoad: redirectIfSignedIn,
  component: lazyRouteComponent(
    () => import("@/features/auth/routes/register-page"),
    "RegisterPage",
  ),
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/perfil",
  beforeLoad: requireAuth,
  component: lazyRouteComponent(
    () => import("@/features/profile/routes/profile-layout"),
    "ProfileLayout",
  ),
});

const profileIndexRoute = createRoute({
  getParentRoute: () => profileRoute,
  path: "/",
  component: lazyRouteComponent(
    () => import("@/features/profile/routes/profile-data-page"),
    "ProfileIndexPage",
  ),
});

const profileDataRoute = createRoute({
  getParentRoute: () => profileRoute,
  path: "dados",
  component: lazyRouteComponent(
    () => import("@/features/profile/routes/profile-data-page"),
    "ProfileDataPage",
  ),
});

const walletsRoute = createRoute({
  getParentRoute: () => profileRoute,
  path: "carteiras",
  component: lazyRouteComponent(
    () => import("@/features/wallets/routes/wallets-page"),
    "WalletsPage",
  ),
});

// Dev-only component catalog, dropped from production builds
const devRoutes = import.meta.env.DEV
  ? [
      createRoute({
        getParentRoute: () => rootRoute,
        path: "/__ui",
        component: lazyRouteComponent(() => import("@/app/dev/ui-catalog-page"), "UiCatalogPage"),
      }),
    ]
  : [];

const routeTree = rootRoute.addChildren([
  ...devRoutes,
  catalogLayoutRoute.addChildren([homeRoute, loginRoute, registerRoute]),
  nftDetailRoute,
  cartRoute,
  checkoutRoute,
  orderRoute,
  favoritesRoute,
  profileRoute.addChildren([profileIndexRoute, profileDataRoute, walletsRoute]),
]);

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  parseSearch,
  stringifySearch,
  defaultNotFoundComponent: NotFoundPage,
  defaultPendingComponent: PagePending,
  defaultErrorComponent: RouteError,
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  // Module augmentation requires an interface.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Register {
    router: typeof router;
  }
}
