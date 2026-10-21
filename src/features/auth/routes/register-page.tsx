import { getRouteApi } from "@tanstack/react-router";

import { AuthDialog } from "@/features/auth/components/auth-dialog";
import { RegisterForm } from "@/features/auth/components/register-form";

const routeApi = getRouteApi("/_catalog/criar-conta");

export function RegisterPage() {
  const { redirect } = routeApi.useSearch();
  return (
    <AuthDialog
      mode="register"
      redirect={redirect}
      title="Criar perfil de colecionador"
      description="Crie seu perfil de colecionador e conecte uma carteira quando quiser."
    >
      <RegisterForm redirect={redirect} />
    </AuthDialog>
  );
}
