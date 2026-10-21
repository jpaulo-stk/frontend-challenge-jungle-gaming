import { Link, Outlet } from "@tanstack/react-router";

export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-sm focus:bg-primary focus:px-4 focus:py-2 focus:text-bg"
      >
        Pular para o conteúdo
      </a>
      <header className="border-b border-border">
        <div className="mx-auto flex h-[72px] w-full max-w-[1200px] items-center px-5 xl:px-0">
          <Link to="/" className="text-sm font-bold tracking-[0.18em] text-text">
            KURIO
          </Link>
        </div>
      </header>
      <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
    </div>
  );
}
