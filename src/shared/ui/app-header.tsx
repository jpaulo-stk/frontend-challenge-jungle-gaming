import { Link } from "@tanstack/react-router";
import { LogIn, LogOut, Search, ShoppingCart, UserRound } from "lucide-react";

import { buttonVariants } from "@/shared/ui/button";
import { UnavailableAction } from "@/shared/ui/unavailable-action";

type AppHeaderProps = {
  cartCount: number;
  /** Signed-in collector, or null for visitors. */
  user: { name: string } | null;
  onLogout: () => void;
  loggingOut: boolean;
};

const navItemClassName =
  "flex h-full items-center border-b-2 border-transparent px-0.5 text-base text-text transition-colors hover:text-primary-hi data-[status=active]:border-primary-hi data-[status=active]:font-bold data-[status=active]:text-primary-hi";

const iconLinkClassName =
  "relative inline-flex size-10 items-center justify-center rounded-md text-text transition-colors hover:text-primary-hi [&_svg]:size-6";

export function AppHeader({ cartCount, user, onLogout, loggingOut }: AppHeaderProps) {
  return (
    <header className="hidden md:block">
      <div className="page-container">
        <div className="flex h-17.5 items-center justify-between gap-6 border-b border-border">
          <Link to="/" className="text-sm font-bold tracking-[0.18em] text-text">
            KURIO
          </Link>

          <nav aria-label="Principal" className="h-full">
            <ul className="flex h-full items-stretch gap-6 lg:gap-10">
              <li>
                <Link
                  to="/"
                  activeOptions={{ exact: true, includeHash: false }}
                  className={navItemClassName}
                >
                  Início
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  hash="catalogo"
                  activeOptions={{ exact: true, includeHash: true }}
                  className={navItemClassName}
                >
                  Mercado
                </Link>
              </li>
              <li>
                <UnavailableAction feature="A página de criadores" className={navItemClassName}>
                  Criadores
                </UnavailableAction>
              </li>
              <li>
                <UnavailableAction feature="A página Aprenda" className={navItemClassName}>
                  Aprenda
                </UnavailableAction>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/" hash="busca" className={iconLinkClassName}>
              <Search aria-hidden="true" />
              <span className="sr-only">Buscar NFTs</span>
            </Link>
            <Link to="/carrinho" className={iconLinkClassName}>
              <ShoppingCart aria-hidden="true" />
              <span className="sr-only">
                Carrinho, {cartCount} {cartCount === 1 ? "item" : "itens"}
              </span>
              {cartCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 right-0 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-4 font-bold text-primary-foreground"
                >
                  {cartCount}
                </span>
              )}
            </Link>
            {user ? (
              <>
                <Link
                  to="/perfil"
                  className={buttonVariants({ variant: "outline", size: "sm", className: "ml-2" })}
                >
                  <UserRound aria-hidden="true" className="size-4" />
                  <span className="max-w-32 truncate">{user.name}</span>
                </Link>
                <button
                  type="button"
                  title="Sair da conta"
                  disabled={loggingOut}
                  onClick={onLogout}
                  className={`${iconLinkClassName} disabled:opacity-50`}
                >
                  <LogOut aria-hidden="true" />
                  <span className="sr-only">Sair da conta</span>
                </button>
              </>
            ) : (
              <Link
                to="/entrar"
                className={buttonVariants({
                  size: "sm",
                  className: "ml-2 h-8.5 gap-1.5 px-2.5 text-base [&_svg]:size-5",
                })}
              >
                <LogIn aria-hidden="true" />
                Entrar
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
