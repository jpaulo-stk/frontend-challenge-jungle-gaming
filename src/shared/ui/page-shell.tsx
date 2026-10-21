import type { ReactNode } from "react";

type PageShellProps = {
  title: string;
  children?: ReactNode;
};

/** Page frame aligned to the 1200px container of the layout. */
export function PageShell({ title, children }: PageShellProps) {
  return (
    <section className="mx-auto w-full max-w-[1200px] px-5 py-10 xl:px-0">
      <h1 className="text-[28px] leading-[44px] font-bold text-text">{title}</h1>
      {children}
    </section>
  );
}
