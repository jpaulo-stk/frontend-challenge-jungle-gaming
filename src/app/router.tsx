import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
} from "@tanstack/react-router";

import { queryClient } from "@/app/query-client";
import { NotFoundPage } from "@/app/not-found-page";
import { RootLayout } from "@/app/root-layout";
import { RouteError } from "@/app/route-error";
import { authSearchSchema } from "@/features/auth/routes/auth-search-schema";
import { LoginPage } from "@/features/auth/routes/login-page";
import { RegisterPage } from "@/features/auth/routes/register-page";
import { requireAuth } from "@/features/auth/routes/require-auth";
import { CartPage } from "@/features/cart/routes/cart-page";
import { HomePage } from "@/features/catalog/routes/home-page";
import { CheckoutPage } from "@/features/checkout/routes/checkout-page";
import { NftDetailPage } from "@/features/nft-detail/routes/nft-detail-page";
import { OrderPage } from "@/features/orders/routes/order-page";
import { ProfileDataPage } from "@/features/profile/routes/profile-data-page";
import { ProfileLayout } from "@/features/profile/routes/profile-layout";
import { WalletsPage } from "@/features/wallets/routes/wallets-page";

type RouterContext = {
  queryClient: QueryClient;
};

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const nftDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/nft/$nftId",
  component: NftDetailPage,
});

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/carrinho",
  component: CartPage,
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pagamento",
  beforeLoad: ({ location }) => {
    requireAuth(location);
  },
  component: CheckoutPage,
});

const orderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pedido/$orderId",
  beforeLoad: ({ location }) => {
    requireAuth(location);
  },
  component: OrderPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/entrar",
  validateSearch: authSearchSchema,
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/criar-conta",
  validateSearch: authSearchSchema,
  component: RegisterPage,
});

// Desktop shows the side menu plus the profile form on `/perfil`; mobile turns
// `/perfil` into the section list and moves the form to `/perfil/dados`.
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/perfil",
  beforeLoad: ({ location }) => {
    requireAuth(location);
  },
  component: ProfileLayout,
});

const profileIndexRoute = createRoute({
  getParentRoute: () => profileRoute,
  path: "/",
  component: ProfileDataPage,
});

const profileDataRoute = createRoute({
  getParentRoute: () => profileRoute,
  path: "dados",
  component: ProfileDataPage,
});

const walletsRoute = createRoute({
  getParentRoute: () => profileRoute,
  path: "carteiras",
  component: WalletsPage,
});

// Component catalog for visual review. Development only: in production builds
// `import.meta.env.DEV` is false and the whole branch, import included, is dropped.
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
  homeRoute,
  nftDetailRoute,
  cartRoute,
  checkoutRoute,
  orderRoute,
  loginRoute,
  registerRoute,
  profileRoute.addChildren([profileIndexRoute, profileDataRoute, walletsRoute]),
]);

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  defaultNotFoundComponent: NotFoundPage,
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
