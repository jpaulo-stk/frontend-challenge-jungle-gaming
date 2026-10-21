import { UiCatalogSection } from "@/app/dev/ui-catalog-section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

export function UiCatalogOverlays() {
  return (
    <UiCatalogSection title="Diálogos, drawers e tooltip">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Abrir diálogo</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entrar</DialogTitle>
            <DialogDescription>
              Foco preso no diálogo; Esc fecha e devolve o foco.
            </DialogDescription>
          </DialogHeader>
          <Button>Entrar</Button>
        </DialogContent>
      </Dialog>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Abrir sheet</Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>Coleções, faixa de preço e rede.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>

      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">Abrir drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Resumo do pedido</DrawerTitle>
            <DrawerDescription>Drawer inferior usado no mobile.</DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost">Passe o mouse ou foque</Button>
        </TooltipTrigger>
        <TooltipContent>Taxa estimada pela rede</TooltipContent>
      </Tooltip>

      <Accordion type="single" collapsible className="w-80">
        <AccordionItem value="details">
          <AccordionTrigger>Detalhes do NFT</AccordionTrigger>
          <AccordionContent>Um colecionável digital finalizado à mão.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </UiCatalogSection>
  );
}
