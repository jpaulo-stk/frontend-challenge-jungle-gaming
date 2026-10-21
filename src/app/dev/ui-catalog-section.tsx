import type { ReactNode } from "react";

type UiCatalogSectionProps = {
  title: string;
  children: ReactNode;
};

export function UiCatalogSection({ title, children }: UiCatalogSectionProps) {
  return (
    <section className="border-t border-border py-8">
      <h2 className="mb-6 text-lg leading-7 font-bold text-text">{title}</h2>
      <div className="flex flex-wrap items-start gap-6">{children}</div>
    </section>
  );
}
