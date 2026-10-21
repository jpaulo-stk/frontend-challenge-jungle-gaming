import { useRef } from "react";

import type { Image } from "@/shared/api/contracts/common";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";

type ImageZoomDialogProps = {
  title: string;
  image: Image | null;
  onClose: () => void;
};

export function ImageZoomDialog({ title, image, onClose }: ImageZoomDialogProps) {
  // Opened programmatically (no DialogTrigger), so remember who opened it.
  const opener = useRef<HTMLElement | null>(null);

  return (
    <Dialog
      open={image !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="max-w-[min(92vw,820px)] p-4 sm:max-w-[min(92vw,820px)]"
        onOpenAutoFocus={() => {
          opener.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
        }}
        onCloseAutoFocus={(event) => {
          if (!opener.current) return;
          event.preventDefault();
          opener.current.focus();
        }}
      >
        <DialogTitle className="pr-10">{title}</DialogTitle>
        <DialogDescription className="sr-only">Arte ampliada</DialogDescription>
        {image && (
          <img
            src={image.src}
            srcSet={image.srcSet}
            sizes="(min-width: 900px) 790px, 85vw"
            alt={image.alt}
            width={800}
            height={800}
            className="aspect-square w-full rounded-lg object-cover"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
