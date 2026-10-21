import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useRegister } from "@/features/auth/api/auth-api";
import {
  PASSWORD_MIN_LENGTH,
  registerFormSchema,
  type RegisterForm,
} from "@/features/auth/api/schemas";
import { SocialLogin } from "@/features/auth/components/social-login";
import { applyServerErrors } from "@/shared/lib/form-errors";
import { Button } from "@/shared/ui/button";
import { PasswordField, TextField } from "@/shared/ui/form-field";

type RegisterFormProps = {
  redirect: string | undefined;
};

export function RegisterForm({ redirect }: RegisterFormProps) {
  const router = useRouter();
  const register = useRegister();
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(({ confirmPassword: _confirm, ...values }) => {
    register.mutate(values, {
      onSuccess: ({ user }) => {
        toast.success(`Conta criada. Boas-vindas, ${user.displayName}!`);
        void router.navigate({ href: redirect ?? "/", replace: true });
      },
      onError: (error) => {
        // EMAIL_TAKEN / USERNAME_TAKEN land on their own field.
        if (!applyServerErrors(error, form.setError, ["username", "email", "password"])) {
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
          label="Nome de usuário"
          hideLabel
          autoComplete="username"
          placeholder="Nome de usuário"
          required
          error={errors.username?.message}
          {...form.register("username")}
        />
        <TextField
          label="E-mail"
          hideLabel
          type="email"
          autoComplete="email"
          placeholder="Digite seu e-mail"
          required
          error={errors.email?.message}
          {...form.register("email")}
        />
        <PasswordField
          label="Senha"
          hideLabel
          autoComplete="new-password"
          placeholder="Senha"
          required
          hint={`Mínimo de ${String(PASSWORD_MIN_LENGTH)} caracteres.`}
          error={errors.password?.message}
          {...form.register("password")}
        />
        <PasswordField
          label="Confirmar senha"
          hideLabel
          autoComplete="new-password"
          placeholder="Confirmar senha"
          required
          error={errors.confirmPassword?.message}
          {...form.register("confirmPassword")}
        />
      </div>
      <Button type="submit" className="mt-6 w-full text-base" disabled={register.isPending}>
        {register.isPending ? "Criando conta…" : "Criar conta"}
      </Button>

      <SocialLogin />

      <p className="mt-10 text-center text-sm text-text-muted md:hidden">
        Já tem uma conta?{" "}
        <Link
          to="/entrar"
          search={(previous) => ({ ...previous, redirect })}
          className="text-primary-hi"
        >
          Entre
        </Link>
      </p>
    </form>
  );
}
