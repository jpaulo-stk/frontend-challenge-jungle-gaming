import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { CreateOrderRequest } from "@/shared/api/contracts/order";
import { onIdentityChange } from "@/shared/session/session-lifecycle";

/** A submitted order request and its key: resending it can never create a second order. */
export type OrderAttempt = { key: string; body: CreateOrderRequest };

type CheckoutDraftState = {
  /** Collector the draft belongs to (null while a visitor builds the cart). */
  ownerId: string | null;
  couponCode: string | null;
  /** Cart items left for later: not part of this purchase. */
  excludedItemIds: string[];
  /** Checkout form as typed, so an expired session or a refresh loses nothing. */
  buyer: Record<string, unknown> | null;
  /** Registered wallet chosen to pay with. */
  walletId: string | null;
  attempt: OrderAttempt | null;
  /** Order created and not yet settled, to recover after a refresh. */
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
  /** After a confirmed purchase: the purchase-specific parts are done. */
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

/**
 * Client-only checkout draft, kept in sessionStorage (this tab, survives a
 * refresh). It holds no server data: cart, quote and orders stay in the API.
 */
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

// Logout, or a login as someone else, drops the draft. A session that merely
// expired and is resumed by the same collector keeps it, so checkout resumes.
onIdentityChange((session, reason) => {
  const { ownerId, reset } = useCheckoutDraft.getState();
  if (reason === "logout") reset();
  else if (reason === "login" && session && ownerId !== null && ownerId !== session.user.id) {
    reset();
  }
});
