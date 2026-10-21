import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Toaster } from "sonner";

import { queryClient } from "@/app/query-client";
import { router } from "@/app/router";
// Registers the checkout draft's identity listener before any login/logout.
import "@/shared/checkout/checkout-draft";
import { TooltipProvider } from "@/shared/ui/tooltip";

// Loaded on demand and only in development, so it never ships in the build.
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((module) => ({
        default: module.ReactQueryDevtools,
      })),
    )
  : null;

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <RouterProvider router={router} />
      </TooltipProvider>
      <Toaster position="bottom-right" theme="dark" closeButton />
      {ReactQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools buttonPosition="bottom-left" />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}
