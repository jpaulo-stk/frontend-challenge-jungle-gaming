import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Toaster } from "sonner";

import { queryClient } from "@/app/query-client";
import { router } from "@/app/router";
// Registers the checkout draft's identity listener
import "@/shared/checkout/checkout-draft";
import { RealtimeProvider } from "@/shared/realtime/realtime-provider";
import { TooltipProvider } from "@/shared/ui/tooltip";

// Dev only, never in the production bundle
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
      <RealtimeProvider>
        <TooltipProvider delayDuration={300}>
          <RouterProvider router={router} />
        </TooltipProvider>
      </RealtimeProvider>
      <Toaster position="bottom-right" theme="dark" closeButton />
      {ReactQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools buttonPosition="bottom-left" />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}
