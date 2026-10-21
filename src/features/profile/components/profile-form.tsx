import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useChangePassword, useUpdateProfile } from "@/features/profile/api/profile-api";
import { profileFormSchema, type Profile, type ProfileForm } from "@/features/profile/api/schemas";
import { AvatarField } from "@/features/profile/components/avatar-field";
import { applyServerErrors } from "@/shared/lib/form-errors";
import { Button } from "@/shared/ui/button";
import { EnsField } from "@/shared/ui/ens-field";
import { PasswordField, TextField } from "@/shared/ui/form-field";

const emptyPasswords = { currentPassword: "", newPassword: "", confirmPassword: "" };

const toFormValues = (profile: Profile): ProfileForm => ({
  displayName: profile.displayName,
  username: profile.username,
  email: profile.email,
  ensName: profile.ensName ?? "",
  walletNickname: profile.walletNickname,
  ...emptyPasswords,
});

/**
 * "Perfil do colecionador": profile data and the optional password change share
 * one "Salvar", as in the layout. Each part reports its own errors on its fields.
 */
export function ProfileFormView({ profile }: { profile: Profile }) {
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const [status, setStatus] = useState("");
  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: toFormValues(profile),
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setStatus("");
    const { currentPassword, newPassword, ...data } = values;
    const messages: string[] = [];

    const dirty = form.formState.dirtyFields;
    if (
      dirty.displayName ||
      dirty.username ||
      dirty.email ||
      dirty.ensName ||
      dirty.walletNickname
    ) {
      try {
        const saved = await updateProfile.mutateAsync(data);
        form.reset({
          ...toFormValues(saved),
          currentPassword,
          newPassword,
          confirmPassword: values.confirmPassword,
        });
        messages.push("Dados do perfil salvos.");
      } catch (error) {
        const failure = error as Parameters<typeof applyServerErrors>[0];
        if (
          !applyServerErrors(failure, form.setError, [
            "displayName",
            "username",
            "email",
            "ensName",
            "walletNickname",
          ])
        ) {
          form.setError("root.server", { message: failure.message });
        }
        return;
      }
    }

    if (currentPassword || newPassword) {
      try {
        await changePassword.mutateAsync({ currentPassword, newPassword });
        form.reset({ ...form.getValues(), ...emptyPasswords });
        messages.push("Senha alterada.");
      } catch (error) {
        const failure = error as Parameters<typeof applyServerErrors>[0];
        if (!applyServerErrors(failure, form.setError, ["currentPassword", "newPassword"])) {
          form.setError("root.server", { message: failure.message });
        }
      }
    }

    const message = messages.length > 0 ? messages.join(" ") : "Nenhuma alteração para salvar.";
    setStatus(message);
    if (messages.length > 0) toast.success(message);
  });

  return (
    <form noValidate onSubmit={(event) => void onSubmit(event)} aria-labelledby="profile-title">
      <h1 id="profile-title" className="text-lg font-bold text-text">
        Perfil do colecionador
      </h1>
      {errors.root?.server && (
        <p
          role="alert"
          className="mt-4 rounded-md border-[1.5px] border-danger px-4 py-3 text-sm text-danger"
        >
          {errors.root.server.message}
        </p>
      )}

      <div className="mt-8 grid gap-x-7 gap-y-8 md:grid-cols-2">
        <TextField
          label="Nome de exibição"
          required
          autoComplete="name"
          error={errors.displayName?.message}
          {...form.register("displayName")}
        />
        <TextField
          label="Nome de usuário"
          required
          autoComplete="username"
          error={errors.username?.message}
          {...form.register("username")}
        />
        <TextField
          label="E-mail"
          type="email"
          required
          autoComplete="email"
          error={errors.email?.message}
          {...form.register("email")}
        />
        <EnsField required error={errors.ensName?.message} {...form.register("ensName")} />
        <TextField
          label="Apelido da carteira"
          required
          error={errors.walletNickname?.message}
          {...form.register("walletNickname")}
        />
        <AvatarField avatarUrl={profile.avatarUrl} name={profile.displayName} />
      </div>

      <fieldset className="mt-10 grid gap-y-6 md:w-[calc(50%-14px)]">
        <legend className="mb-6 text-lg font-bold text-text">Alterar senha</legend>
        <PasswordField
          label="Senha atual"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...form.register("currentPassword")}
        />
        <PasswordField
          label="Nova senha"
          autoComplete="new-password"
          hint="Mínimo de 8 caracteres."
          error={errors.newPassword?.message}
          {...form.register("newPassword")}
        />
        <PasswordField
          label="Confirmar nova senha"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...form.register("confirmPassword")}
        />
      </fieldset>

      <Button
        type="submit"
        size="sm"
        className="mt-8 h-10 w-[131px] text-base"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Salvando…" : "Salvar"}
      </Button>
      <p role="status" className="mt-3 min-h-5 text-sm text-success">
        {status}
      </p>
    </form>
  );
}
