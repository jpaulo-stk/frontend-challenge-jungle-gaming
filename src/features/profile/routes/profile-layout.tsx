import { Link, Outlet } from "@tanstack/react-router";

import { PageShell } from "@/shared/ui/page-shell";

export function ProfileLayout() {
  return (
    <PageShell title="Meu perfil">
      <nav aria-label="Seções do perfil" className="mt-6 flex gap-6 text-text-muted">
        <Link
          to="/perfil/dados"
          className="data-[status=active]:text-primary-hi data-[status=active]:underline"
        >
          Dados do perfil
        </Link>
        <Link
          to="/perfil/carteiras"
          className="data-[status=active]:text-primary-hi data-[status=active]:underline"
        >
          Carteiras
        </Link>
      </nav>
      <Outlet />
    </PageShell>
  );
}
