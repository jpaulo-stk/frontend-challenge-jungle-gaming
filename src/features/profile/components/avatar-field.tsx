import { ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useRemoveAvatar, useUploadAvatar } from "@/features/profile/api/profile-api";
import { AVATAR_MAX_BYTES, AVATAR_TYPES } from "@/features/profile/api/schemas";
import { Button } from "@/shared/ui/button";
import { InlineError } from "@/shared/ui/inline-error";

type AvatarFieldProps = {
  avatarUrl: string | null;
  name: string;
};

/**
 * "Avatar": choose a file (type and size checked before upload, local preview
 * while it uploads) or remove it to go back to the default placeholder.
 */
export function AvatarField({ avatarUrl, name }: AvatarFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploadAvatar();
  const remove = useRemoveAvatar();
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const onFile = (file: File | undefined) => {
    if (!file) return;
    setError(undefined);
    if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) {
      setError("Use uma imagem PNG, JPEG ou WebP.");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setError("A imagem deve ter até 1 MB.");
      return;
    }
    setPreview(URL.createObjectURL(file));
    upload.mutate(file, {
      onSuccess: () => toast.success("Avatar atualizado."),
      onError: (failure) => {
        setError(failure.fields.avatar ?? failure.message);
      },
      onSettled: () => {
        setPreview(null);
      },
    });
  };

  const shown = preview ?? avatarUrl;
  const busy = upload.isPending || remove.isPending;

  return (
    <div>
      <p className="mb-3 text-[15px] text-text">Avatar</p>
      <div className="flex items-center gap-6" aria-busy={busy}>
        <span className="flex size-[50px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2 text-primary">
          {shown ? (
            <img src={shown} alt={`Avatar de ${name}`} className="size-full object-cover" />
          ) : (
            <ImageIcon aria-label="Sem avatar" className="size-6" />
          )}
        </span>
        <input
          ref={input}
          type="file"
          accept={AVATAR_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-label="Arquivo do avatar"
          onChange={(event) => {
            onFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          size="sm"
          className="h-10 w-[98px]"
          disabled={busy}
          aria-describedby={error ? "avatar-error" : undefined}
          onClick={() => input.current?.click()}
        >
          {upload.isPending ? "Enviando…" : "Alterar"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-10 font-normal"
          disabled={busy || !avatarUrl}
          onClick={() => {
            remove.mutate(undefined, {
              onSuccess: () => toast.success("Avatar removido."),
              onError: (failure) => {
                setError(failure.message);
              },
            });
          }}
        >
          Remover
        </Button>
      </div>
      <InlineError id="avatar-error" message={error} />
    </div>
  );
}
