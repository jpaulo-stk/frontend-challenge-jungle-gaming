import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { SocialIcon, type SocialNetwork } from "@/shared/ui/social-icon";
import { UnavailableAction } from "@/shared/ui/unavailable-action";

const benefits = [
  {
    letter: "W",
    title: "Segurança da carteira",
    text: "Proteja sua carteira e colecione arte digital verificada com confiança.",
  },
  {
    letter: "C",
    title: "Criadores em destaque",
    text: "Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.",
  },
  {
    letter: "D",
    title: "Alertas de lançamentos",
    text: "Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.",
  },
] as const;

const helpLinks = [
  "Central de ajuda",
  "Como comprar NFTs",
  "Carteira e segurança",
  "Política do mercado",
  "Denunciar item",
] as const;

const profileLinks = ["Minha coleção", "Atividade", "Estúdio do criador", "Lista de interesse"];

const collectionLinks = ["Arte digital", "Fotografia", "Música", "Arte 3D", "Utilidade"] as const;

const socialNetworkLabels: Readonly<Record<SocialNetwork, string>> = {
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "Twitter",
  linkedin: "LinkedIn",
  youtube: "YouTube",
};

const socialNetworks = Object.keys(socialNetworkLabels) as SocialNetwork[];

const footerLinkClassName = "text-left text-sm leading-[30px] text-text hover:text-primary-hi";

export function AppFooter() {
  return (
    <footer className="page-container mt-24 pb-6 max-md:pb-[96px]">
      {/* Band 1: benefits + newsletter */}
      <section
        aria-label="Por que colecionar na Kurio"
        className="grid gap-8 bg-surface px-6 py-8 sm:grid-cols-2 lg:min-h-[250px] lg:grid-cols-4 xl:grid-cols-[250px_266px_266px_1fr] lg:gap-0 lg:pr-[30px] lg:pl-12"
      >
        {benefits.map((benefit) => (
          <div
            key={benefit.title}
            className="lg:border-r-[1.5px] lg:border-primary lg:pr-5 lg:not-first:pl-4"
          >
            <span
              aria-hidden="true"
              className="flex size-[74px] items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground"
            >
              {benefit.letter}
            </span>
            <h2 className="mt-4 text-[17px] leading-6 font-bold text-text">{benefit.title}</h2>
            <p className="mt-2 text-sm leading-[22px] text-text-muted">{benefit.text}</p>
          </div>
        ))}
        <form
          className="lg:pl-4"
          onSubmit={(event) => {
            event.preventDefault();
            toast.info("A inscrição em lançamentos não está disponível nesta demonstração.");
          }}
        >
          <h2 className="max-w-[250px] text-base leading-[18px] font-bold text-text">
            Antecipe-se ao próximo lançamento
          </h2>
          <div className="mt-4 flex">
            <label htmlFor="newsletter-email" className="sr-only">
              Seu e-mail
            </label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="digite seu e-mail..."
              className="h-10 min-w-0 flex-1 rounded-l-md bg-surface-2 px-3 text-sm text-text placeholder:text-text-dim focus-visible:outline-2 focus-visible:-outline-offset-2"
            />
            <Button
              type="submit"
              size="sm"
              className="h-10 rounded-l-none rounded-r-md px-2 text-lg"
            >
              Enviar
            </Button>
          </div>
          <p className="mt-4 text-xs leading-[22px] text-text-muted">
            Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
          </p>
        </form>
      </section>

      {/* Band 2: contact strip */}
      <div className="grid gap-4 bg-surface-3 px-8 py-6 text-sm text-text sm:grid-cols-2 lg:min-h-[88px] lg:grid-cols-4 xl:grid-cols-[303px_303px_302px_1fr] xl:gap-x-0 lg:items-center lg:py-0">
        <span className="font-bold tracking-[0.18em]">KURIO</span>
        <p className="max-w-[220px] leading-[22px]">
          Feito para colecionadores, criadores e cultura
        </p>
        <a href="mailto:contato@email.com" className="hover:text-primary-hi">
          contato@email.com
        </a>
        <a href="tel:+551140028922" className="hover:text-primary-hi">
          +55 11 4002 8922
        </a>
      </div>

      {/* Band 3: link columns */}
      <div className="grid gap-8 bg-surface px-8 py-8 sm:grid-cols-2 lg:min-h-[236px] lg:grid-cols-4 xl:grid-cols-[303px_303px_302px_1fr] xl:gap-x-0">
        <nav aria-labelledby="footer-profile">
          <h2 id="footer-profile" className="text-lg leading-7 font-bold text-text">
            Meu perfil
          </h2>
          <ul>
            <li>
              <Link to="/perfil" className={footerLinkClassName}>
                Meu perfil
              </Link>
            </li>
            {profileLinks.map((label) => (
              <li key={label}>
                <UnavailableAction feature={label} className={footerLinkClassName}>
                  {label}
                </UnavailableAction>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-labelledby="footer-help">
          <h2 id="footer-help" className="text-lg leading-7 font-bold text-text">
            Central de ajuda
          </h2>
          <ul>
            {helpLinks.map((label) => (
              <li key={label}>
                <UnavailableAction feature={label} className={footerLinkClassName}>
                  {label}
                </UnavailableAction>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-labelledby="footer-collections">
          <h2 id="footer-collections" className="text-lg leading-7 font-bold text-text">
            Coleções
          </h2>
          <ul>
            {collectionLinks.map((label) => (
              <li key={label}>
                <Link to="/" hash="catalogo" className={footerLinkClassName}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="text-lg leading-7 font-bold text-text">Redes sociais</h2>
          <ul className="mt-2 flex gap-2">
            {socialNetworks.map((network) => (
              <li key={network}>
                <UnavailableAction
                  feature={`O perfil da Kurio no ${socialNetworkLabels[network]}`}
                  className="inline-flex size-8 items-center justify-center rounded-[5px] border border-primary text-primary [&_svg]:size-6"
                >
                  <SocialIcon network={network} />
                  <span className="sr-only">{socialNetworkLabels[network]}</span>
                </UnavailableAction>
              </li>
            ))}
          </ul>
          <h2 className="mt-6 text-lg leading-7 font-bold whitespace-nowrap text-text">
            Carteiras compatíveis
          </h2>
          <p className="mt-2 inline-flex rounded-md border border-border-strong bg-surface-3 px-2.5 py-1.5 text-[9px] font-bold whitespace-nowrap text-primary-hi">
            METAMASK · WALLETCONNECT · COINBASE
          </p>
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-text">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  );
}
