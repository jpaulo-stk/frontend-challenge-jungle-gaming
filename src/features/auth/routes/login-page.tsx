import { getRouteApi } from "@tanstack/react-router";

import { AuthDialog } from "@/features/auth/components/auth-dialog";
import { LoginForm } from "@/features/auth/components/login-form";

const routeApi = getRouteApi("/_catalog/entrar");

export function LoginPage() {
  const { redirect } = routeApi.useSearch();
  return (
    <AuthDialog
      mode="login"
      redirect={redirect}
      title="Entrar"
      description="Entre para gerenciar sua carteira, coleção e perfil de criador."
    >
      <LoginForm redirect={redirect} />
    </AuthDialog>
  );
}
