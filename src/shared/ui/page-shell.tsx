import type { ReactNode } from "react";

type PageShellProps = {
  title: string;
  children?: ReactNode;
};

export function PageShell({ title, children }: PageShellProps) {
  return (
    <section className="page-container py-10">
      <h1 className="text-[28px] leading-11 font-bold text-text">{title}</h1>
      {children}
    </section>
  );
}
