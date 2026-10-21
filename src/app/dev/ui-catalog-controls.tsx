import { useState } from "react";

import { UiCatalogSection } from "@/app/dev/ui-catalog-section";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { InlineError } from "@/shared/ui/inline-error";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { QuantityStepper } from "@/shared/ui/quantity-stepper";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Slider } from "@/shared/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

const variants = ["default", "outline", "ghost", "destructive", "link"] as const;

export function UiCatalogControls() {
  const [quantity, setQuantity] = useState(1);
  const [range, setRange] = useState([0.02, 12.3]);

  return (
    <>
      <UiCatalogSection title="Botões">
        {variants.map((variant) => (
          <div key={variant} className="flex flex-col gap-3">
            <Button variant={variant}>{variant}</Button>
            <Button variant={variant} disabled>
              desabilitado
            </Button>
            <Button variant={variant} aria-disabled="true">
              indisponível
            </Button>
          </div>
        ))}
        <div className="flex flex-col gap-3">
          <Button size="lg">Comprar NFT</Button>
          <Button size="sm">Aplicar</Button>
        </div>
      </UiCatalogSection>

      <UiCatalogSection title="Campos">
        <div className="flex w-72 flex-col gap-2">
          <Label htmlFor="ui-name">Nome de exibição</Label>
          <Input id="ui-name" placeholder="Digite seu nome" />
        </div>
        <div className="flex w-72 flex-col gap-2">
          <Label htmlFor="ui-email">E-mail</Label>
          <Input
            id="ui-email"
            defaultValue="contato@"
            aria-invalid="true"
            aria-describedby="ui-email-error"
          />
          <InlineError id="ui-email-error" message="Informe um e-mail válido." />
        </div>
        <div className="flex w-72 flex-col gap-2">
          <Label htmlFor="ui-disabled">Desabilitado</Label>
          <Input id="ui-disabled" disabled defaultValue="0xA91F…E82C" />
        </div>
        <div className="flex w-72 flex-col gap-2">
          <Label htmlFor="ui-network">Rede</Label>
          <Select>
            <SelectTrigger id="ui-network">
              <SelectValue placeholder="Selecione uma rede" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="ethereum">Ethereum</SelectItem>
              <SelectItem value="polygon">Polygon</SelectItem>
              <SelectItem value="solana">Solana</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </UiCatalogSection>

      <UiCatalogSection title="Seleção">
        <div className="flex items-center gap-3">
          <Checkbox id="ui-same-wallet" />
          <Label htmlFor="ui-same-wallet">Igual à carteira principal</Label>
        </div>
        <RadioGroup defaultValue="coinbase" aria-label="Carteira" className="w-60">
          {["WalletConnect", "MetaMask", "Coinbase Wallet"].map((label) => (
            <div key={label} className="flex items-center gap-3">
              <RadioGroupItem
                value={label.toLowerCase().split(" ")[0] ?? label}
                id={`ui-${label}`}
              />
              <Label htmlFor={`ui-${label}`}>{label}</Label>
            </div>
          ))}
        </RadioGroup>
        <div className="flex w-72 flex-col gap-3">
          <Slider
            value={range}
            onValueChange={setRange}
            min={0.02}
            max={12.3}
            step={0.01}
            aria-label="Faixa de preço"
          />
          <span className="text-sm text-text-muted">
            Preço: {range[0]?.toFixed(2)} - {range[1]?.toFixed(2)} ETH
          </span>
        </div>
        <Tabs defaultValue="todos">
          <TabsList aria-label="Listas do catálogo">
            <TabsTrigger value="todos">Todos os NFTs</TabsTrigger>
            <TabsTrigger value="novos">Novos lançamentos</TabsTrigger>
            <TabsTrigger value="alta">Em alta</TabsTrigger>
          </TabsList>
        </Tabs>
      </UiCatalogSection>

      <UiCatalogSection title="Quantidade e badges">
        <QuantityStepper value={quantity} onChange={setQuantity} max={3} label="Quantidade" />
        <QuantityStepper
          value={quantity}
          onChange={setQuantity}
          max={3}
          label="Quantidade (compacto)"
          size="sm"
        />
        <Badge>Raro</Badge>
        <Badge variant="outline">1/50</Badge>
        <Badge variant="success">Confirmado</Badge>
        <Badge variant="danger">Recusado</Badge>
      </UiCatalogSection>
    </>
  );
}
