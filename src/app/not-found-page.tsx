import { Link } from "@tanstack/react-router";

import { PageShell } from "@/shared/ui/page-shell";

export function NotFoundPage() {
  return (
    <PageShell title="Página não encontrada">
      <p className="mt-4 text-sm leading-6 text-text-muted">
        O endereço que você acessou não existe ou foi removido.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex h-11 items-center rounded-md bg-primary px-6 font-bold text-bg"
      >
        Voltar para o início
      </Link>
    </PageShell>
  );
}
