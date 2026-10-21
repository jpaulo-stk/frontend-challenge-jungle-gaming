import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { useState, type KeyboardEvent } from "react";

import { heroSlides } from "@/features/catalog/components/hero-slides";
import { buttonVariants } from "@/shared/ui/button";

/**
 * Hero with three slides switched by the dots (click, or arrow keys on the
 * dot group). No autoplay: moving content would need its own pause control.
 */
export function HeroCarousel() {
  const [active, setActive] = useState(0);

  const onDotsKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (delta === 0) return;
    event.preventDefault();
    const next = (active + delta + heroSlides.length) % heroSlides.length;
    setActive(next);
    event.currentTarget.querySelectorAll("button")[next]?.focus();
  };

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Destaques"
      className="page-container mt-4 md:mt-9.25"
    >
      <div className="relative grid overflow-hidden rounded-3xl bg-linear-to-br from-surface-2 to-surface md:rounded-none md:bg-none">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.title}
            role="group"
            aria-roledescription="slide"
            aria-label={`${String(index + 1)} de ${String(heroSlides.length)}`}
            aria-hidden={index !== active}
            inert={index !== active}
            className={cn(
              "col-start-1 row-start-1 grid grid-cols-[1fr_auto] items-center gap-4 p-4 transition-opacity duration-500 motion-reduce:transition-none md:min-h-112.5 md:grid-cols-[1fr_450px] md:items-start md:gap-10 md:p-0 md:pt-8.25 md:pl-10",
              index === active ? "opacity-100" : "opacity-0",
            )}
          >
            <div className="flex flex-col items-start">
              <p className="text-xs font-bold text-text md:text-base">{slide.eyebrow}</p>
              <p className="mt-2 text-lg leading-7 font-bold text-text md:mt-3 md:max-w-130 md:text-hero md:leading-17.5">
                {slide.mobile ? (
                  <>
                    <span className="md:hidden">{slide.mobile.title}</span>
                    <span className="max-md:hidden">{slide.title}</span>
                  </>
                ) : (
                  slide.title
                )}
              </p>
              <p className="mt-2 max-w-140 text-xs leading-5 text-text-muted md:mt-3 md:text-sm md:leading-6">
                {slide.mobile ? (
                  <>
                    <span className="md:hidden">{slide.mobile.text}</span>
                    <span className="max-md:hidden">{slide.text}</span>
                  </>
                ) : (
                  slide.text
                )}
              </p>
              <Link
                to="/"
                hash="catalogo"
                tabIndex={index === active ? 0 : -1}
                className={buttonVariants({
                  className:
                    "mt-3 h-auto rounded-none border-0 bg-transparent px-0 text-xs text-primary-hi uppercase hover:bg-transparent md:mt-8 md:h-10 md:w-35 md:rounded-md md:bg-primary md:text-base md:text-primary-foreground md:hover:bg-primary-hi",
                })}
              >
                Explorar
              </Link>
            </div>
            <img
              src={slide.image.src}
              srcSet={slide.image.srcSet}
              sizes="(min-width: 768px) 450px, 130px"
              alt={slide.image.alt}
              width={450}
              height={450}
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              className="aspect-square w-32.5 rounded-2xl object-cover md:-mt-8.25 md:w-112.5 md:rounded-3xl"
            />
          </div>
        ))}

        <div
          role="group"
          aria-label="Escolher destaque"
          onKeyDown={onDotsKeyDown}
          className="col-start-1 row-start-1 flex items-end justify-center gap-1 self-end pb-3 md:justify-end md:pr-140 md:pb-10.5"
        >
          {heroSlides.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              aria-label={`Mostrar destaque ${String(index + 1)} de ${String(heroSlides.length)}`}
              aria-current={index === active}
              tabIndex={index === active ? 0 : -1}
              onClick={() => {
                setActive(index);
              }}
              className="flex size-6 items-center justify-center rounded-full"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-2 rounded-full border border-primary",
                  index === active ? "bg-primary" : "bg-primary/60",
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
