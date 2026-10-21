export const sessionKeys = {
  all: ["session"] as const,
  current: () => [...sessionKeys.all, "current"] as const,
};

export const nftKeys = {
  all: ["nfts"] as const,
  lists: () => [...nftKeys.all, "list"] as const,
  list: <TParams extends object>(params: TParams) => [...nftKeys.lists(), params] as const,
  details: () => [...nftKeys.all, "detail"] as const,
  detail: (id: string) => [...nftKeys.details(), id] as const,
  facets: () => [...nftKeys.all, "facets"] as const,
};

export const cartKeys = {
  all: ["cart"] as const,
  detail: () => [...cartKeys.all, "detail"] as const,
  quote: <TParams extends object>(params: TParams) => [...cartKeys.all, "quote", params] as const,
};

export const favoriteKeys = {
  all: ["favorites"] as const,
  list: () => [...favoriteKeys.all, "list"] as const,
};

export const orderKeys = {
  all: ["orders"] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
};

export const profileKeys = {
  all: ["profile"] as const,
  detail: () => [...profileKeys.all, "detail"] as const,
};

export const walletKeys = {
  all: ["wallets"] as const,
  list: () => [...walletKeys.all, "list"] as const,
};
