import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "cn";
import {
  CircleAlert,
  Download,
  Heart,
  LogOut,
  MapPin,
  ShoppingCart,
  TrendingUp,
  UserRound,
} from "lucide-react";

import { useLogout } from "@/shared/session/use-logout";
import { UnavailableAction } from "@/shared/ui/unavailable-action";

const itemClassName =
  "relative flex h-11.25 w-full items-center gap-3 px-4 text-[15px] text-primary-hi transition-colors hover:bg-surface-2 [&_svg]:size-5 [&_svg]:shrink-0 data-[status=active]:bg-surface-2 data-[status=active]:before:absolute data-[status=active]:before:inset-y-0 data-[status=active]:before:left-0 data-[status=active]:before:w-1.25 data-[status=active]:before:bg-primary";

const activeClassName =
  "lg:bg-surface-2 lg:before:absolute lg:before:inset-y-0 lg:before:left-0 lg:before:w-1.25 lg:before:bg-primary";

type ProfileMenuProps = {
  className?: string;
};

export function ProfileMenu({ className }: ProfileMenuProps) {
  const logout = useLogout();
  const onProfileIndex = useLocation({
    select: (location) => location.pathname === "/perfil" || location.pathname === "/perfil/",
  });

  return (
    <nav aria-labelledby="profile-menu-title" className={cn("bg-surface py-3", className)}>
      <h2
        id="profile-menu-title"
        className="px-4 pt-2 pb-3 text-lg font-bold text-text max-lg:sr-only"
      >
        Meu perfil
      </h2>
      <ul>
        <li>
          <Link to="/perfil/dados" className={cn(itemClassName, onProfileIndex && activeClassName)}>
            <UserRound aria-hidden="true" />
            Dados do perfil
          </Link>
        </li>
        <li>
          <Link to="/perfil/carteiras" className={itemClassName}>
            <MapPin aria-hidden="true" />
            Carteiras
          </Link>
        </li>
        <li>
          <UnavailableAction feature="O histórico de atividade" className={itemClassName}>
            <ShoppingCart aria-hidden="true" />
            Atividade
          </UnavailableAction>
        </li>
        <li>
          <Link to="/favoritos" className={itemClassName}>
            <Heart aria-hidden="true" />
            Lista de interesse
          </Link>
        </li>
        <li>
          <UnavailableAction feature="A área de ofertas" className={itemClassName}>
            <TrendingUp aria-hidden="true" />
            Ofertas
          </UnavailableAction>
        </li>
        <li>
          <UnavailableAction feature="A área de arquivos baixados" className={itemClassName}>
            <Download aria-hidden="true" />
            Arquivos baixados
          </UnavailableAction>
        </li>
        <li>
          <UnavailableAction feature="O suporte" className={itemClassName}>
            <CircleAlert aria-hidden="true" />
            Suporte
          </UnavailableAction>
        </li>
        <li className="mt-1 border-t border-border-strong pt-1">
          <button
            type="button"
            className={cn(itemClassName, "font-bold")}
            disabled={logout.isPending}
            onClick={() => {
              logout.mutate();
            }}
          >
            <LogOut aria-hidden="true" />
            Sair
          </button>
        </li>
      </ul>
    </nav>
  );
}
