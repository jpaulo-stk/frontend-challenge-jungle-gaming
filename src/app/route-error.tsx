import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";

import { toAppError } from "@/shared/api/errors";
import { PageShell } from "@/shared/ui/page-shell";

export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const appError = toAppError(error);

  const retry = () => {
    reset();
    void router.invalidate();
  };

  return (
    <PageShell title="Algo deu errado">
      <p role="alert" className="mt-4 text-sm leading-6 text-text-muted">
        {appError.message}
      </p>
      <button
        type="button"
        onClick={retry}
        className="mt-8 inline-flex h-11 items-center rounded-md bg-primary px-6 font-bold text-bg"
      >
        Tentar novamente
      </button>
    </PageShell>
  );
}
