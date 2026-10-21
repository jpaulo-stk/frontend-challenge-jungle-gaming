import { TriangleAlert } from "lucide-react";

import { Button } from "@/shared/ui/button";

type QuoteChangedNoticeProps = {
  changes: string[];
  onAccept: () => void;
};

export function QuoteChangedNotice({ changes, onAccept }: QuoteChangedNoticeProps) {
  return (
    <div
      role="status"
      className="mb-6 flex flex-col gap-3 rounded-lg border-[1.5px] border-primary bg-surface p-4 text-sm text-text"
    >
      <p className="flex items-center gap-2 font-bold">
        <TriangleAlert aria-hidden="true" className="size-5 shrink-0 text-primary-hi" />
        Os valores mudaram enquanto você estava aqui
      </p>
      <ul className="flex list-disc flex-col gap-1 pl-5">
        {changes.map((change) => (
          <li key={change}>{change}</li>
        ))}
      </ul>
      <p className="text-text-muted">
        O resumo já mostra os novos valores. A compra só segue depois que você os confirmar.
      </p>
      <Button type="button" size="sm" variant="outline" className="self-start" onClick={onAccept}>
        Estou ciente dos novos valores
      </Button>
    </div>
  );
}
