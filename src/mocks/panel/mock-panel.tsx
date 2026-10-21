import { FlaskConical } from "lucide-react";
import { useState } from "react";

import { getConfig, scenarioIds, type ScenarioId } from "@/mocks/config";
import { mockControls } from "@/mocks/controls";
import { MockPanelEvents } from "@/mocks/panel/mock-panel-events";
import { scenarios } from "@/mocks/scenarios/scenarios";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";

const selectClassName =
  "h-10 w-full rounded-md border-[1.5px] border-border bg-surface px-3 text-sm text-text";

/** Development panel of the simulated backend: scenario, reset and event triggers. */
export function MockPanel() {
  const [scenario, setScenario] = useState<ScenarioId>(getConfig().scenario);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="icon-sm"
          variant="outline"
          className="fixed bottom-24 left-4 z-50 size-10 bg-bg md:bottom-4 md:left-20"
        >
          <FlaskConical aria-hidden="true" />
          <span className="sr-only">Painel de simulação</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-sm overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Simulação da API</SheetTitle>
          <SheetDescription>
            Cenário ativo: <strong>{scenarios[getConfig().scenario].label}</strong>. Trocar de
            cenário restaura os dados e recarrega a página.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4">
          <Label htmlFor="mock-scenario">Cenário</Label>
          <select
            id="mock-scenario"
            className={selectClassName}
            value={scenario}
            onChange={(event) => {
              setScenario(event.target.value as ScenarioId);
            }}
          >
            {scenarioIds.map((id) => (
              <option key={id} value={id}>
                {scenarios[id].label}
              </option>
            ))}
          </select>
          <p className="text-xs leading-5 text-text-muted">{scenarios[scenario].description}</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                mockControls.setScenario(scenario);
                window.location.reload();
              }}
            >
              Aplicar cenário
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                mockControls.reset();
                window.location.reload();
              }}
            >
              Restaurar dados
            </Button>
          </div>
        </div>

        <MockPanelEvents />
      </SheetContent>
    </Sheet>
  );
}
