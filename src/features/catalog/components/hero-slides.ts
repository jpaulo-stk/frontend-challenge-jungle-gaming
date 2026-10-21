export type HeroSlide = {
  eyebrow: string;
  title: string;
  text: string;
  mobile?: { title: string; text: string };
  image: { src: string; srcSet: string; alt: string };
};

const art = (n: number, alt: string) => ({
  src: `/nfts/nft-0${String(n)}-800.webp`,
  srcSet: `/nfts/nft-0${String(n)}-400.webp 400w, /nfts/nft-0${String(n)}-800.webp 800w`,
  alt,
});

export const heroSlides: readonly HeroSlide[] = [
  {
    eyebrow: "Bem-vindo à Kurio",
    title: "SEJA DONO DO FUTURO DA ARTE DIGITAL",
    text: "Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.",
    mobile: {
      title: "SEJA DONO DA CULTURA DIGITAL",
      text: "Descubra NFTs selecionados de criadores do mundo todo.",
    },
    image: art(1, "Macaco de óculos redondos e jaqueta college verde com corrente dourada"),
  },
  {
    eyebrow: "Bem-vindo à Kurio",
    title: "ARTE DIGITAL SELECIONADA E MUITO MAIS",
    text: "Explore novos artistas, coleções verificadas e obras digitais.",
    image: art(3, "Macaco de pelo escuro com blazer bege e gola alta verde"),
  },
  {
    eyebrow: "Bem-vindo à Kurio",
    title: "LANÇAMENTOS GÊNESIS DE EDIÇÃO LIMITADA",
    text: "Colecione edições escassas diretamente dos criadores antes da revelação pública.",
    image: art(2, "Gorila de chapéu bucket verde e moletom lilás"),
  },
];
