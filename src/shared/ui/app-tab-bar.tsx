import { Link } from "@tanstack/react-router";
import { Heart, House, ScanSearch, ShoppingCart, UserRound } from "lucide-react";

type AppTabBarProps = {
  cartCount: number;
};

const tabClassName =
  "relative inline-flex size-12 items-center justify-center rounded-full text-text-dim transition-colors outline-none data-[status=active]:text-primary-hi focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-6";

/** Mobile bottom navigation (72px bar with a raised 56px action in the middle). */
export function AppTabBar({ cartCount }: AppTabBarProps) {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 h-18 rounded-t-3xl border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto grid h-full max-w-md grid-cols-5 items-center justify-items-center px-4">
        <li>
          <Link to="/" activeOptions={{ exact: true }} className={tabClassName}>
            <House aria-hidden="true" />
            <span className="sr-only">Início</span>
          </Link>
        </li>
        <li>
          <Link to="/favoritos" className={tabClassName}>
            <Heart aria-hidden="true" />
            <span className="sr-only">Lista de interesse</span>
          </Link>
        </li>
        <li>
          <Link
            to="/"
            hash="busca"
            className="-mt-10 inline-flex size-14 items-center justify-center rounded-full bg-linear-to-b from-primary-alt to-primary text-primary-foreground shadow-[0_0_0_6px_var(--color-bg)] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:size-6"
          >
            <ScanSearch aria-hidden="true" />
            <span className="sr-only">Explorar coleções</span>
          </Link>
        </li>
        <li>
          <Link to="/carrinho" className={tabClassName}>
            <ShoppingCart aria-hidden="true" />
            <span className="sr-only">
              Carrinho, {cartCount} {cartCount === 1 ? "item" : "itens"}
            </span>
            {cartCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-1.5 right-1 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-4 font-bold text-primary-foreground"
              >
                {cartCount}
              </span>
            )}
          </Link>
        </li>
        <li>
          <Link to="/perfil" className={tabClassName}>
            <UserRound aria-hidden="true" />
            <span className="sr-only">Perfil</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
