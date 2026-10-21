import type { ReactNode } from "react";

type PageShellProps = {
  title: string;
  children?: ReactNode;
};

/** Page frame aligned to the 1200px container of the layout. */
export function PageShell({ title, children }: PageShellProps) {
  return (
    <section className="page-container py-10">
      <h1 className="text-[28px] leading-11 font-bold text-text">{title}</h1>
      {children}
    </section>
  );
}
