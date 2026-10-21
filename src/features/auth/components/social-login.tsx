import { FacebookIcon, GoogleIcon } from "@/shared/ui/brand-icons";
import { UnavailableAction } from "@/shared/ui/unavailable-action";

const socialButton =
  "flex h-14 w-full items-center justify-center gap-3 rounded-md border-[1.5px] border-border text-sm text-text-muted aria-disabled:cursor-not-allowed md:h-10";

export function SocialLogin() {
  return (
    <div className="mt-8">
      <div className="relative flex items-center justify-center md:-mx-19.5">
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-border" />
        <p className="relative bg-surface px-3 text-[15px] text-text">Ou continue com</p>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <UnavailableAction feature="O login com Google" className={socialButton}>
          <GoogleIcon className="size-5" />
          Continuar com Google
        </UnavailableAction>
        <UnavailableAction feature="O login com Facebook" className={socialButton}>
          <FacebookIcon className="size-5" />
          Continuar com Facebook
        </UnavailableAction>
      </div>
    </div>
  );
}
