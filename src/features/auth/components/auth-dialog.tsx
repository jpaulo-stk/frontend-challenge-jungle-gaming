import { Link, useRouter } from "@tanstack/react-router";
import { cn } from "cn";
import { useRef, useState, type ReactNode } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";

type AuthDialogProps = {
  mode: "login" | "register";
  redirect: string | undefined;
  title: string;
  description: string;
  children: ReactNode;
};

const tabClassName =
  "text-xl font-bold transition-colors hover:text-primary-hi data-[status=active]:text-primary-hi";

// Closing goes back; guards redirect with replace, so the private page is not in history
export function AuthDialog({ mode, redirect, title, description, children }: AuthDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  // Opened by navigation: give focus back to whatever opened it
  const opener = useRef<HTMLElement | null>(null);

  const leave = () => {
    if (router.history.canGoBack()) {
      router.history.back();
      return;
    }
    void router.navigate({ to: "/" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        onOpenAutoFocus={() => {
          opener.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
        }}
        onCloseAutoFocus={(event) => {
          // Also fires when a successful login unmounts the dialog
          if (open) return;
          event.preventDefault();
          opener.current?.focus();
          leave();
        }}
        className={cn(
          "gap-0 overflow-y-auto px-6 pt-10 pb-8 md:border-b-10 md:border-b-primary md:px-19.5 md:pt-8 md:pb-10",
          mode === "login" ? "md:min-h-150" : "md:min-h-164",
          "max-md:inset-0 max-md:top-0 max-md:left-0 max-md:h-dvh max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-none max-md:border-0",
        )}
      >
        <p
          aria-hidden="true"
          className="mt-10 text-center text-3xl font-bold tracking-[0.18em] text-text md:hidden"
        >
          KURIO
        </p>

        <nav aria-label="Acesso à conta" className="hidden justify-center gap-2 md:flex">
          <Link
            to="/entrar"
            search={(previous) => ({ ...previous, redirect })}
            className={tabClassName}
            activeOptions={{ includeSearch: false }}
          >
            Entrar
          </Link>
          <span aria-hidden="true" className="w-px bg-primary" />
          <Link
            to="/criar-conta"
            search={(previous) => ({ ...previous, redirect })}
            className={tabClassName}
            activeOptions={{ includeSearch: false }}
          >
            Criar conta
          </Link>
        </nav>

        <DialogTitle className="mt-20 text-center text-xl font-bold md:sr-only">
          {title}
        </DialogTitle>
        <DialogDescription className="mt-8 text-center text-sm leading-5 text-text max-md:sr-only">
          {description}
        </DialogDescription>

        <div className="mt-6 md:mt-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
