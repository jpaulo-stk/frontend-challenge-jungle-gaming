import type { WalletFormInput } from "@/features/wallets/api/wallets-api";
import type { Wallet } from "@/shared/api/contracts/wallet";

export const emptyWallet: WalletFormInput = {
  displayName: "",
  nickname: "",
  network: "" as WalletFormInput["network"],
  profileName: "",
  address: "",
  alternateAddress: "",
  provider: "" as WalletFormInput["provider"],
  referralCode: "",
  email: "",
  ensName: "",
};

export const walletToForm = (wallet: Wallet): WalletFormInput => ({
  displayName: wallet.displayName,
  nickname: wallet.nickname,
  network: wallet.network,
  profileName: wallet.profileName,
  address: wallet.address,
  alternateAddress: wallet.alternateAddress ?? "",
  provider: wallet.provider,
  referralCode: wallet.referralCode,
  email: wallet.email,
  ensName: wallet.ensName,
});
