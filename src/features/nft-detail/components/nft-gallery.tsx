import { cn } from "cn";
import { Search } from "lucide-react";
import { useState } from "react";

import type { Image } from "@/shared/api/contracts/common";
import { ImageZoomDialog } from "@/shared/ui/image-zoom-dialog";

type NftGalleryProps = {
  name: string;
  gallery: Image[];
};

export function NftGallery({ name, gallery }: NftGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const main = gallery[selected] ?? gallery[0];
  if (!main) return null;

  return (
    <div className="flex gap-7">
      <ul aria-label="Miniaturas" className="hidden w-25 shrink-0 flex-col gap-4 lg:flex">
        {gallery.map((image, index) => (
          <li key={image.alt}>
            <button
              type="button"
              aria-pressed={index === selected}
              aria-label={`Mostrar vista ${String(index + 1)} de ${String(gallery.length)}`}
              onClick={() => {
                setSelected(index);
              }}
              className={cn(
                "block overflow-hidden rounded-md border-[1.5px]",
                index === selected ? "border-primary" : "border-transparent",
              )}
            >
              <img
                src={image.src}
                alt=""
                width={100}
                height={100}
                loading="lazy"
                className="size-25 object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      <div className="relative flex w-full items-center justify-center rounded-3xl bg-surface p-2 max-md:rounded-b-none lg:size-111 lg:rounded-lg lg:p-5">
        <img
          src={main.src}
          srcSet={main.srcSet}
          sizes="(min-width: 1024px) 404px, 92vw"
          alt={main.alt}
          width={404}
          height={404}
          fetchPriority="high"
          className="aspect-square w-full rounded-3xl object-cover"
        />
        <button
          type="button"
          onClick={() => {
            setZoomOpen(true);
          }}
          className="absolute top-4 right-4 hidden size-9 items-center justify-center rounded-full bg-bg/85 text-text hover:text-primary-hi lg:flex [&_svg]:size-5"
        >
          <Search aria-hidden="true" />
          <span className="sr-only">Ampliar imagem</span>
        </button>
      </div>

      <ImageZoomDialog
        title={name}
        image={zoomOpen ? main : null}
        onClose={() => {
          setZoomOpen(false);
        }}
      />
    </div>
  );
}
