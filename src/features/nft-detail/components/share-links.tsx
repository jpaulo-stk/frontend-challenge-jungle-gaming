import { Mail } from "lucide-react";

import { SocialIcon } from "@/shared/ui/social-icon";

type ShareLinksProps = {
  name: string;
};

const iconLink =
  "inline-flex size-8 items-center justify-center rounded-sm text-text hover:text-primary-hi [&_svg]:size-5";

/** "Compartilhar este NFT": real share links for LinkedIn, e-mail and Twitter. */
export function ShareLinks({ name }: ShareLinksProps) {
  const url = typeof window === "undefined" ? "" : window.location.href;
  const text = `${name} na Kurio`;

  return (
    <div className="flex items-center gap-2">
      <p className="text-[15px] font-bold text-text">Compartilhar este NFT:</p>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={iconLink}
      >
        <SocialIcon network="linkedin" />
        <span className="sr-only">no LinkedIn (abre em nova aba)</span>
      </a>
      <a
        href={`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`}
        className={iconLink}
      >
        <Mail aria-hidden="true" />
        <span className="sr-only">por e-mail</span>
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={iconLink}
      >
        <SocialIcon network="twitter" />
        <span className="sr-only">no Twitter (abre em nova aba)</span>
      </a>
    </div>
  );
}
