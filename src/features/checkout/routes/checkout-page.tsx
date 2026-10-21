import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft, LoaderCircle, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  buyerFormSchema,
  type BuyerFormInput,
  type BuyerFormOutput,
} from "@/features/checkout/api/schemas";
import { BuyerForm } from "@/features/checkout/components/buyer-form";
import { CheckoutSummary } from "@/features/checkout/components/checkout-summary";
import { QuoteChangedNotice } from "@/features/checkout/components/quote-changed-notice";
import { ReviewDialog } from "@/features/checkout/components/review-dialog";
import { WalletSelector } from "@/features/checkout/components/wallet-selector";
import {
  useCheckoutSubmit,
  type CheckoutSubmit,
} from "@/features/checkout/hooks/use-checkout-submit";
import { useAcknowledgedQuote } from "@/features/checkout/hooks/use-acknowledged-quote";
import { useWalletConnection } from "@/features/checkout/hooks/use-wallet-connection";
import { initialBuyer, toBuyer, walletFields } from "@/features/checkout/lib/buyer-values";
import { networkSchema, walletProviderSchema } from "@/shared/api/contracts/common";
import type { SessionUser } from "@/shared/api/contracts/session";
import type { Wallet, WalletsResponse } from "@/shared/api/contracts/wallet";
import { useCartQuote } from "@/shared/cart/use-cart-quote";
import { useCheckoutDraft } from "@/shared/checkout/checkout-draft";
import { formatEth } from "@/shared/lib/eth";
import { useSession } from "@/shared/session/session-api";
import { Button, buttonVariants } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { TableRowsSkeleton } from "@/shared/ui/skeleton/table-rows-skeleton";
import { walletsQueryOptions } from "@/shared/wallets/wallets-api";

export function CheckoutPage() {
  const router = useRouter();
  const session = useSession();
  const wallets = useQuery(walletsQueryOptions);
  const excludedItemIds = useCheckoutDraft((draft) => draft.excludedItemIds);
  const pendingOrderId = useCheckoutDraft((draft) => draft.pendingOrderId);
  const claim = useCheckoutDraft((draft) => draft.claim);
  const state = useCartQuote({ excludedItemIds });
  const user = session.data?.user;

  useEffect(() => {
    if (user) claim(user.id);
  }, [user, claim]);

  const failed = state.cart.isError ? state.cart : wallets.isError ? wallets : null;

  return (
    <div className="page-container pt-6 pb-10 lg:pt-10">
      <nav
        aria-label="Trilha de navegação"
        className="hidden text-[15px] font-bold text-text md:block"
      >
        <Link to="/" className="hover:text-primary-hi">
          Início
        </Link>{" "}
        /{" "}
        <Link to="/" hash="catalogo" className="hover:text-primary-hi">
          Mercado
        </Link>{" "}
        / Pagamento
      </nav>
      <div className="relative flex items-center justify-center md:hidden">
        <button
          type="button"
          onClick={() => {
            router.history.back();
          }}
          className="absolute left-0 inline-flex size-9 items-center justify-center rounded-full bg-surface-2"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
          <span className="sr-only">Voltar</span>
        </button>
        <h1 className="text-xl font-bold text-text">Pagamento com carteira</h1>
      </div>
      <h1 className="sr-only max-md:hidden">Pagamento</h1>

      {pendingOrderId && (
        <p
          role="status"
          className="mt-6 rounded-lg border border-primary bg-surface p-4 text-[15px] text-text"
        >
          Você tem um pedido em processamento.{" "}
          <Link
            to="/pedido/$orderId"
            params={{ orderId: pendingOrderId }}
            className="font-bold text-primary-hi underline"
          >
            Acompanhar pedido
          </Link>
        </p>
      )}

      {failed ? (
        <ErrorState
          className="mt-6"
          message={failed.error.message}
          onRetry={() => void failed.refetch()}
          retrying={failed.isFetching}
        />
      ) : !state.cart.data || !wallets.data || !user ? (
        <div aria-busy="true" aria-label="Carregando pagamento" className="mt-6">
          <TableRowsSkeleton />
        </div>
      ) : state.allItems.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<ShoppingCart />}
          title="Nada para pagar"
          description="Seu carrinho está vazio. Adicione NFTs para finalizar uma compra."
          action={
            <Link to="/" hash="catalogo" className={buttonVariants({ variant: "outline" })}>
              Explorar NFTs
            </Link>
          }
        />
      ) : (
        <CheckoutForm state={state} wallets={wallets.data} user={user} />
      )}
    </div>
  );
}

type CheckoutFormProps = {
  state: ReturnType<typeof useCartQuote>;
  wallets: WalletsResponse;
  user: SessionUser;
};

function CheckoutForm({ state, wallets, user }: CheckoutFormProps) {
  const draft = useCheckoutDraft();
  const registered = [wallets.primary, wallets.secondary].filter(
    (wallet): wallet is Wallet => wallet !== null,
  );
  const wallet =
    registered.find((candidate) => candidate.id === draft.walletId) ?? registered[0] ?? null;

  const form = useForm<BuyerFormInput, unknown, BuyerFormOutput>({
    resolver: zodResolver(buyerFormSchema),
    defaultValues: initialBuyer(draft.buyer, wallet, user),
  });
  const [gate, setGate] = useState<string | null>(null);

  // The form lives in the draft: an expired session or a refresh loses nothing.
  const setBuyer = draft.setBuyer;
  useEffect(() => {
    return form.subscribe({
      formState: { values: true },
      callback: ({ values }) => {
        setBuyer(values);
      },
    });
  }, [form, setBuyer]);

  const setWallet = draft.setWallet;
  useEffect(() => {
    if (wallet && draft.walletId !== wallet.id) setWallet(wallet.id);
  }, [wallet, draft.walletId, setWallet]);

  // Selects start empty (""), outside the enum types: parse before use.
  const provider =
    walletProviderSchema.safeParse(useWatch({ control: form.control, name: "provider" })).data ??
    null;
  const network =
    networkSchema.safeParse(useWatch({ control: form.control, name: "network" })).data ?? null;
  const connection = useWalletConnection({ walletId: wallet?.id ?? null, provider, network });
  const submit = useCheckoutSubmit({
    items: state.items,
    itemIds: state.itemIds,
    cartVersion: state.cart.data?.version ?? 0,
  });
  const acknowledged = useAcknowledgedQuote({
    quote: state.quote.data,
    settled: !state.estimating && !state.quote.isPlaceholderData,
    requestKey: JSON.stringify([
      draft.couponCode,
      state.itemIds ?? null,
      state.cart.data?.version ?? 0,
    ]),
    items: state.items,
  });

  const chooseWallet = (next: Wallet) => {
    draft.setWallet(next.id);
    const { walletAddress, ...fields } = walletFields(next);
    for (const [name, value] of Object.entries(fields)) {
      form.setValue(name as keyof typeof fields, value, { shouldValidate: true });
    }
    if (!form.getValues("useOtherWallet")) {
      form.setValue("walletAddress", walletAddress, { shouldValidate: true });
    }
  };

  const onConfirm = form.handleSubmit((values) => {
    setGate(null);
    if (!wallet || !connection.connection) {
      setGate("Conecte a carteira para confirmar a compra.");
      return;
    }
    if (state.blockingIssues.length > 0) {
      setGate("Há itens indisponíveis: deixe-os para depois ou ajuste no carrinho.");
      return;
    }
    if (!acknowledged.seen || state.estimating) {
      setGate("Aguarde o resumo terminar de atualizar.");
      return;
    }
    // Compare with what the user saw, not with a quote that changed underneath
    void submit.confirm(acknowledged.seen, {
      walletId: wallet.id,
      connectionId: connection.connection.id,
      buyer: toBuyer(values),
    });
  });

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,763px)_minmax(0,405px)] lg:justify-between lg:gap-x-8 lg:gap-y-6">
      <form
        id="checkout-form"
        noValidate
        onSubmit={(event) => void onConfirm(event)}
        className="max-lg:order-3 lg:col-start-1 lg:row-span-3 lg:row-start-1"
      >
        <BuyerForm
          form={form}
          onUseOtherWallet={(useOther) => {
            form.setValue("walletAddress", useOther ? "" : (wallet?.address ?? ""));
            if (useOther) form.setFocus("walletAddress");
          }}
        />
      </form>

      <div className="max-lg:order-2 lg:col-start-2 lg:row-start-1">
        {acknowledged.changes.length > 0 && state.quote.data && (
          <QuoteChangedNotice
            changes={acknowledged.changes}
            onAccept={() => {
              if (state.quote.data) acknowledged.accept(state.quote.data);
            }}
          />
        )}
        <CheckoutSummary state={state} locked={submit.busy} />
      </div>

      <div className="max-lg:order-1 lg:col-start-2 lg:row-start-2">
        <WalletSelector
          wallets={wallets}
          walletId={wallet?.id ?? null}
          onWalletChange={chooseWallet}
          provider={provider}
          onProviderChange={(value) => {
            form.setValue("provider", value, { shouldValidate: true });
          }}
          connection={connection}
        />
      </div>

      <div className="flex flex-col gap-4 max-lg:order-4 lg:col-start-2 lg:row-start-3">
        {state.totals && (
          <p className="flex items-baseline justify-end gap-6 text-lg font-bold text-text lg:hidden">
            Total: <span className="text-xl text-primary-hi">{formatEth(state.totals.total)}</span>
          </p>
        )}
        <SendStatus submit={submit} gate={gate} />
        {submit.pendingAttempt ? (
          <Button
            type="button"
            size="lg"
            disabled={submit.busy}
            onClick={submit.resend}
            className="w-full"
          >
            {submit.busy && (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin motion-reduce:animate-none"
              />
            )}
            Tentar novamente
          </Button>
        ) : (
          <Button
            type="submit"
            form="checkout-form"
            size="lg"
            disabled={submit.busy}
            className="w-full max-md:rounded-full max-md:bg-linear-to-r max-md:from-primary max-md:to-primary-alt"
          >
            {submit.busy && (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin motion-reduce:animate-none"
              />
            )}
            {submit.busy ? "Confirmando…" : "Confirmar compra"}
          </Button>
        )}
      </div>

      <ReviewDialog
        review={submit.review}
        busy={submit.busy}
        onAccept={() => {
          if (submit.review) acknowledged.accept(submit.review.quote);
          submit.acceptReview();
        }}
        onClose={submit.closeReview}
      >
        {submit.review && <SendStatus submit={submit} gate={null} />}
      </ReviewDialog>
    </div>
  );
}

function SendStatus({ submit, gate }: { submit: CheckoutSubmit; gate: string | null }) {
  const message =
    submit.problem?.message ??
    gate ??
    (submit.pendingAttempt
      ? "Um envio anterior ficou sem resposta. Tentar novamente reenvia a mesma solicitação e não cria outra compra."
      : null);
  return (
    <p role="alert" className="text-sm text-danger empty:hidden">
      {message}
    </p>
  );
}
