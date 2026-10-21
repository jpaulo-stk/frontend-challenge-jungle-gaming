import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { CreateOrderRequest } from "@/shared/api/contracts/order";
import { onIdentityChange } from "@/shared/session/session-lifecycle";

export type OrderAttempt = { key: string; body: CreateOrderRequest };

type CheckoutDraftState = {
  ownerId: string | null;
  couponCode: string | null;
  excludedItemIds: string[];
  buyer: Record<string, unknown> | null;
  walletId: string | null;
  attempt: OrderAttempt | null;
  pendingOrderId: string | null;
};

type CheckoutDraftActions = {
  claim: (ownerId: string) => void;
  setCoupon: (couponCode: string | null) => void;
  toggleExcluded: (itemId: string) => void;
  setBuyer: (buyer: Record<string, unknown>) => void;
  setWallet: (walletId: string | null) => void;
  setAttempt: (attempt: OrderAttempt | null) => void;
  setPendingOrder: (orderId: string | null) => void;
  completePurchase: () => void;
  reset: () => void;
};

const initialState: CheckoutDraftState = {
  ownerId: null,
  couponCode: null,
  excludedItemIds: [],
  buyer: null,
  walletId: null,
  attempt: null,
  pendingOrderId: null,
};

// Client-only draft in sessionStorage; server data stays in the query cache
export const useCheckoutDraft = create<CheckoutDraftState & CheckoutDraftActions>()(
  persist(
    (set) => ({
      ...initialState,
      claim: (ownerId) => {
        set((state) => (state.ownerId === ownerId ? state : { ...state, ownerId }));
      },
      setCoupon: (couponCode) => {
        set({ couponCode });
      },
      toggleExcluded: (itemId) => {
        set((state) => ({
          excludedItemIds: state.excludedItemIds.includes(itemId)
            ? state.excludedItemIds.filter((id) => id !== itemId)
            : [...state.excludedItemIds, itemId],
        }));
      },
      setBuyer: (buyer) => {
        set({ buyer });
      },
      setWallet: (walletId) => {
        set({ walletId });
      },
      setAttempt: (attempt) => {
        set({ attempt });
      },
      setPendingOrder: (pendingOrderId) => {
        set({ pendingOrderId });
      },
      completePurchase: () => {
        set({ couponCode: null, excludedItemIds: [], attempt: null, pendingOrderId: null });
      },
      reset: () => {
        set(initialState);
      },
    }),
    { name: "kurio.checkout-draft", storage: createJSONStorage(() => sessionStorage) },
  ),
);

// Logout or another user resets it; an expired session resumed by the same user keeps it
onIdentityChange((session, reason) => {
  const { ownerId, reset } = useCheckoutDraft.getState();
  if (reason === "logout") reset();
  else if (reason === "login" && session && ownerId !== null && ownerId !== session.user.id) {
    reset();
  }
});
