import type { DbNft } from "@/mocks/db/types";
import type { Network } from "@/shared/api/contracts/common";
import type { Edition, EditionId } from "@/shared/api/contracts/nft";

export const collections = [
  { slug: "arte-digital", name: "Arte digital" },
  { slug: "fotografia", name: "Fotografia" },
  { slug: "musica", name: "Música" },
  { slug: "arte-3d", name: "Arte 3D" },
  { slug: "colecionaveis", name: "Colecionáveis" },
  { slug: "generativa", name: "Generativa" },
  { slug: "jogos", name: "Jogos" },
  { slug: "assinaturas", name: "Assinaturas" },
  { slug: "utilidade", name: "Utilidade" },
] as const;

export const networkNames: Record<Network, string> = {
  ethereum: "Ethereum",
  polygon: "Polygon",
  solana: "Solana",
};

const editionLabels: Record<EditionId, string> = {
  "1-1": "1/1",
  "1-10": "1/10",
  "1-50": "1/50",
  open: "ABERTA",
};

const artAttributes: Record<DbNft["art"], string[]> = {
  1: ["Óculos", "Esmeralda"],
  2: ["Chapéu bucket", "Moletom lilás"],
  3: ["Blazer", "Gola alta"],
  4: ["Fones", "Âmbar"],
};

const contracts: Record<Network, string> = {
  ethereum: "0x7A42c3e5b9d2f4a6c8e0b1d3f5a7c9e1b3d519E8",
  polygon: "0x2b4d6f8a0c1e3b5d7f9a1c3e5b7d9f1a3c5e7b04",
  solana: "Kur1oEd1t1onsSo1ana111111111111111111111",
};

function editions(spec: string): Edition[] {
  return spec.split(" ").map((part) => {
    const [id, available] = part.split(":") as [EditionId, string];
    return { id, label: editionLabels[id], available: Number(available) };
  });
}

const ratingOverrides: Partial<Record<string, DbNft["rating"]>> = {
  "emerald-ape-042": { average: 4.8, count: 19 },
};

type Row = [
  id: string,
  name: string,
  art: DbNft["art"],
  price: string,
  previousPrice: string | null,
  rare: boolean,
  collection: (typeof collections)[number]["slug"],
  network: Network,
  editions: string,
  releasedAt: string,
  trendingScore: number,
];

// prettier-ignore
const rows: Row[] = [
  ["emerald-ape-042", "Emerald Ape #042", 1, "1.19", null, true, "arte-digital", "ethereum", "1-1:1 1-10:4 1-50:30 open:120", "2026-10-02", 98],
  ["sage-nomad-009", "Sage Nomad #009", 2, "1.69", null, false, "colecionaveis", "polygon", "1-10:6 1-50:22", "2026-09-28", 91],
  ["neon-vessel-552", "Neon Vessel #552", 3, "1.99", "2.29", true, "arte-3d", "ethereum", "1-1:1 1-50:18", "2026-09-25", 87],
  ["cosmic-bloom-118", "Cosmic Bloom #118", 2, "1.29", null, false, "generativa", "solana", "1-10:8 open:64", "2026-09-19", 76],
  ["violet-nomad-314", "Violet Nomad #314", 2, "1.39", null, false, "fotografia", "ethereum", "1-1:1 1-50:40", "2026-09-12", 72],
  ["ivory-baron-088", "Ivory Baron #088", 3, "1.79", null, false, "assinaturas", "ethereum", "1-10:5 open:150", "2026-09-07", 69],
  ["golden-beat-207", "Golden Beat #207", 4, "0.99", null, false, "musica", "polygon", "1-50:35 open:200", "2026-09-03", 83],
  ["golden-signal-160", "Golden Signal #160", 4, "0.39", null, false, "musica", "solana", "open:300", "2026-08-30", 64],
  ["golden-frequency-071", "Golden Frequency #071", 4, "0.49", "0.59", false, "musica", "ethereum", "1-10:3 open:80", "2026-08-26", 58],
  ["emerald-crown-612", "Emerald Crown #612", 1, "12.30", null, true, "arte-digital", "ethereum", "1-1:1", "2026-08-21", 95],
  ["lavender-drifter-052", "Lavender Drifter #052", 2, "0.82", null, false, "fotografia", "polygon", "1-50:12 open:90", "2026-08-17", 41],
  ["onyx-baron-133", "Onyx Baron #133", 3, "2.45", "2.90", true, "colecionaveis", "solana", "1-1:1 1-10:2", "2026-08-12", 79],
  ["jade-collector-233", "Jade Collector #233", 1, "3.10", null, false, "colecionaveis", "ethereum", "1-10:7 1-50:25", "2026-08-08", 66],
  ["amber-rhythm-333", "Amber Rhythm #333", 4, "0.27", null, false, "jogos", "polygon", "open:400", "2026-08-03", 52],
  ["sage-wanderer-144", "Sage Wanderer #144", 2, "1.05", null, false, "generativa", "ethereum", "1-50:20 open:75", "2026-07-29", 47],
  ["ivory-consul-240", "Ivory Consul #240", 3, "4.20", null, true, "arte-3d", "ethereum", "1-1:1", "2026-07-24", 88],
  ["verdant-ape-019", "Verdant Ape #019", 1, "0.65", null, false, "jogos", "solana", "1-50:15 open:110", "2026-07-20", 39],
  ["golden-echo-094", "Golden Echo #094", 4, "0.15", null, false, "musica", "polygon", "open:500", "2026-07-15", 35],
  ["lilac-ranger-390", "Lilac Ranger #390", 2, "2.05", "2.35", false, "fotografia", "solana", "1-10:4 1-50:16", "2026-07-11", 61],
  ["obsidian-vessel-317", "Obsidian Vessel #317", 3, "5.75", null, true, "arte-digital", "ethereum", "1-1:1 1-10:1", "2026-07-06", 84],
  ["amber-lens-301", "Amber Lens #301", 1, "1.48", null, false, "fotografia", "ethereum", "1-10:0 1-50:9", "2026-07-01", 57],
  ["copper-tempo-258", "Copper Tempo #258", 4, "0.58", null, false, "jogos", "ethereum", "1-50:30 open:140", "2026-06-26", 44],
  ["moss-nomad-221", "Moss Nomad #221", 2, "0.92", null, false, "utilidade", "polygon", "open:220", "2026-06-21", 31],
  ["shadow-envoy-401", "Shadow Envoy #401", 3, "3.35", null, false, "assinaturas", "solana", "1-10:5 1-50:14", "2026-06-16", 63],
  ["malachite-ape-456", "Malachite Ape #456", 1, "7.80", "8.40", true, "arte-3d", "ethereum", "1-1:1", "2026-06-11", 90],
  ["saffron-pulse-412", "Saffron Pulse #412", 4, "0.02", null, false, "utilidade", "polygon", "open:999", "2026-06-06", 22],
  ["plum-voyager-488", "Plum Voyager #488", 2, "1.75", null, false, "generativa", "polygon", "1-50:0 open:0", "2026-06-01", 49],
  ["night-regent-529", "Night Regent #529", 3, "6.40", null, true, "colecionaveis", "ethereum", "1-1:1 1-10:3", "2026-05-27", 81],
  ["forest-scholar-087", "Forest Scholar #087", 1, "0.74", null, false, "utilidade", "solana", "1-50:28 open:160", "2026-05-22", 27],
  ["honey-bass-037", "Honey Bass #037", 4, "0.33", "0.41", false, "jogos", "solana", "open:260", "2026-05-17", 36],
  ["fern-pilgrim-063", "Fern Pilgrim #063", 2, "0.56", null, false, "assinaturas", "ethereum", "1-50:24 open:95", "2026-05-12", 29],
  ["ivory-marquis-066", "Ivory Marquis #066", 3, "2.95", null, false, "arte-digital", "polygon", "1-10:6 1-50:18", "2026-05-07", 55],
  ["olive-dandy-275", "Olive Dandy #275", 1, "1.12", null, false, "assinaturas", "polygon", "1-50:19 open:70", "2026-05-02", 33],
  ["golden-chorus-505", "Golden Chorus #505", 4, "0.21", null, false, "generativa", "ethereum", "open:350", "2026-04-27", 25],
  ["coal-diplomat-178", "Coal Diplomat #178", 3, "9.90", null, true, "arte-3d", "solana", "1-1:1", "2026-04-22", 74],
  ["amber-scholar-129", "Amber Scholar #129", 1, "0.88", null, false, "utilidade", "ethereum", "1-50:22 open:130", "2026-04-17", 30],
];

export function buildNfts(): DbNft[] {
  return rows.map(
    (
      [
        id,
        name,
        art,
        price,
        previousPrice,
        rare,
        collectionSlug,
        network,
        editionSpec,
        releasedAt,
        trendingScore,
      ],
      index,
    ) => {
      const tokenNumber = /#(\d+)/.exec(name)?.[1] ?? String(index + 1);
      return {
        id,
        name,
        tokenId: `#${tokenNumber.padStart(4, "0")}`,
        art,
        price,
        previousPrice,
        rare,
        collectionSlug,
        network,
        editions: editions(editionSpec),
        description: `Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na ${networkNames[network]}, com arte desbloqueável e acesso para colecionadores.`,
        seriesName: "Kurio Apes",
        creatorName: "Nova Sato",
        rating: ratingOverrides[id] ?? {
          average: Math.round((4 + (trendingScore % 10) / 10) * 10) / 10,
          count: 6 + (trendingScore % 23),
        },
        attributes: rare ? [...artAttributes[art], "Raro"] : artAttributes[art],
        contractAddress: contracts[network],
        royaltiesPercent: 5,
        releasedAt: `${releasedAt}T12:00:00.000Z`,
        trendingScore,
        version: 1,
      };
    },
  );
}

export const NEW_RELEASES_SINCE = "2026-09-01T00:00:00.000Z";
