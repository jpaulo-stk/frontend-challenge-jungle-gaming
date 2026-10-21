import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useLogin } from "@/features/auth/api/auth-api";
import { loginRequestSchema, type LoginRequest } from "@/features/auth/api/schemas";
import { SocialLogin } from "@/features/auth/components/social-login";
import { applyServerErrors } from "@/shared/lib/form-errors";
import { Button } from "@/shared/ui/button";
import { PasswordField, TextField } from "@/shared/ui/form-field";
import { UnavailableAction } from "@/shared/ui/unavailable-action";

type LoginFormProps = {
  redirect: string | undefined;
};

export function LoginForm({ redirect }: LoginFormProps) {
  const router = useRouter();
  const login = useLogin();
  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: "", password: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: ({ user }) => {
        toast.success(`Bem-vindo de volta, ${user.displayName}.`);
        void router.navigate({ href: redirect ?? "/", replace: true });
      },
      onError: (error) => {
        if (!applyServerErrors(error, form.setError, ["email", "password"])) {
          form.setError("root.server", { message: error.message });
        }
      },
    });
  });

  return (
    <form noValidate onSubmit={(event) => void onSubmit(event)} className="flex flex-col">
      {errors.root?.server && (
        <p
          role="alert"
          className="mb-4 rounded-md border-[1.5px] border-danger px-4 py-3 text-sm text-danger"
        >
          {errors.root.server.message}
        </p>
      )}
      <div className="flex flex-col gap-4">
        <TextField
          label="E-mail"
          hideLabel
          type="email"
          autoComplete="email"
          placeholder="contato@email.com"
          required
          error={errors.email?.message}
          {...form.register("email")}
        />
        <PasswordField
          label="Senha"
          hideLabel
          autoComplete="current-password"
          placeholder="Senha"
          required
          error={errors.password?.message}
          {...form.register("password")}
        />
      </div>
      <UnavailableAction
        feature="A recuperação de senha"
        className="mt-3 self-end text-[15px] text-primary-hi hover:underline"
      >
        Esqueceu a senha?
      </UnavailableAction>
      <Button type="submit" className="mt-6 w-full text-base" disabled={login.isPending}>
        {login.isPending ? "Entrando…" : "Entrar"}
      </Button>

      <SocialLogin />

      <p className="mt-10 text-center text-sm text-text-muted md:hidden">
        Novo na Kurio?{" "}
        <Link
          to="/criar-conta"
          search={(previous) => ({ ...previous, redirect })}
          className="text-primary-hi"
        >
          Crie uma conta
        </Link>
      </p>
    </form>
  );
}
