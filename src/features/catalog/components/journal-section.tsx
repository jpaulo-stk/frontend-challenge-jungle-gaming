import { UnavailableAction } from "@/shared/ui/unavailable-action";

// "Diário da Cunhagem": editorial content from the Figma frame. Editorial pages
// are out of scope, so "Ler mais" announces itself as unavailable.
const posts = [
  {
    art: 3,
    date: "12 de setembro",
    minutes: 6,
    title: "Como funciona a propriedade de NFTs",
    text: "Aprenda a colecionar, negociar e verificar ativos digitais.",
  },
  {
    art: 1,
    date: "13 de setembro",
    minutes: 2,
    title: "10 artistas digitais para acompanhar",
    text: "Conheça criadores que moldam a cultura digital.",
  },
  {
    art: 2,
    date: "15 de setembro",
    minutes: 3,
    title: "Raridade, atributos e procedência",
    text: "Entenda raridade, procedência, direitos autorais e utilidade.",
  },
  {
    art: 4,
    date: "15 de setembro",
    minutes: 2,
    title: "Como proteger sua carteira",
    text: "Proteja sua carteira, seus ativos e sua identidade.",
  },
] as const;

export function JournalSection() {
  return (
    <section aria-labelledby="journal-title" className="page-container mt-24">
      <div className="text-center">
        <h2 id="journal-title" className="text-[28px] leading-[44px] font-bold text-text">
          Diário da Cunhagem
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </div>
      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-[repeat(4,268px)]">
        {posts.map((post) => (
          <li key={post.title}>
            <article className="flex h-full flex-col overflow-hidden rounded-lg bg-surface">
              <img
                src={`/nfts/nft-0${String(post.art)}-400.webp`}
                alt=""
                width={268}
                height={195}
                loading="lazy"
                className="h-[195px] w-full object-cover"
              />
              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs text-text-muted">
                  {post.date} <span aria-hidden="true">|</span>
                  <span className="sr-only">,</span> Leitura de {post.minutes} min
                </p>
                <h3 className="mt-3 text-base leading-[21px] font-bold text-text">{post.title}</h3>
                <p className="mt-3 text-xs leading-4 text-text-muted">{post.text}</p>
                <UnavailableAction
                  feature="O Diário da Cunhagem"
                  className="mt-auto pt-3 text-left text-xs font-bold text-primary-hi"
                >
                  Ler mais <span aria-hidden="true">→</span>
                  <span className="sr-only"> sobre {post.title}</span>
                </UnavailableAction>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
