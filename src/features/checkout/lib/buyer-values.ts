import type { BuyerFormInput, BuyerFormOutput } from "@/features/checkout/api/schemas";
import type { Buyer } from "@/shared/api/contracts/order";
import type { SessionUser } from "@/shared/api/contracts/session";
import type { Wallet } from "@/shared/api/contracts/wallet";

export const emptyBuyer: BuyerFormInput = {
  displayName: "",
  username: "",
  network: "" as BuyerFormInput["network"],
  profileName: "",
  walletAddress: "",
  alternateAddress: "",
  provider: "" as BuyerFormInput["provider"],
  referralCode: "",
  email: "",
  ensName: "",
  useOtherWallet: false,
  note: "",
};

/** Fields that come from the registered wallet chosen to pay with. */
export const walletFields = (wallet: Wallet) => ({
  displayName: wallet.displayName,
  network: wallet.network,
  profileName: wallet.profileName,
  walletAddress: wallet.address,
  alternateAddress: wallet.alternateAddress ?? "",
  provider: wallet.provider,
  referralCode: wallet.referralCode,
  email: wallet.email,
  ensName: wallet.ensName,
});

/** Keeps only stored values whose type matches the form's (the draft is untrusted storage). */
function restore(stored: Record<string, unknown> | null): Partial<BuyerFormInput> {
  if (!stored) return {};
  return Object.fromEntries(
    Object.entries(emptyBuyer)
      .filter(([key, blank]) => typeof stored[key] === typeof blank)
      .map(([key]) => [key, stored[key]]),
  );
}

/** What the collector typed before (draft) wins; otherwise wallet and account fill it. */
export function initialBuyer(
  stored: Record<string, unknown> | null,
  wallet: Wallet | null,
  user: Pick<SessionUser, "username" | "displayName" | "email">,
): BuyerFormInput {
  const prefilled: BuyerFormInput = {
    ...emptyBuyer,
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    ...(wallet ? walletFields(wallet) : {}),
  };
  return { ...prefilled, ...restore(stored) };
}

export const toBuyer = (values: BuyerFormOutput): Buyer => ({
  displayName: values.displayName,
  username: values.username,
  network: values.network,
  profileName: values.profileName,
  walletAddress: values.walletAddress,
  alternateAddress: values.alternateAddress || null,
  provider: values.provider,
  referralCode: values.referralCode,
  email: values.email,
  ensName: values.ensName,
  note: values.note || null,
});
