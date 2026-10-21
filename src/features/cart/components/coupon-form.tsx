import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useApplyCoupon } from "@/features/cart/api/cart-mutations";
import { quoteQueryOptions } from "@/shared/cart/quote-api";
import { useCheckoutDraft } from "@/shared/checkout/checkout-draft";
import { InlineError } from "@/shared/ui/inline-error";

const errorId = "coupon-error";

type CouponFormProps = {
  cartVersion: number;
};

/** "Código promocional": validated by the API, then kept in the checkout draft. */
export function CouponForm({ cartVersion }: CouponFormProps) {
  const queryClient = useQueryClient();
  const couponCode = useCheckoutDraft((draft) => draft.couponCode);
  const setCoupon = useCheckoutDraft((draft) => draft.setCoupon);
  const apply = useApplyCoupon();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | undefined>();

  if (couponCode) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border-[1.5px] border-primary px-4 py-3 text-sm">
        <span>
          Cupom <strong className="text-primary-hi">{couponCode}</strong> aplicado.
        </span>
        <button
          type="button"
          className="font-bold text-primary-hi hover:underline"
          onClick={() => {
            setCoupon(null);
          }}
        >
          Remover cupom
        </button>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const code = value.trim();
        if (!code) {
          setError("Digite um código promocional.");
          return;
        }
        setError(undefined);
        apply.mutate(code, {
          onSuccess: (quote) => {
            const applied = code.toUpperCase();
            // The validation already priced the cart with the coupon: reuse it
            // instead of asking again (the next check happens at checkout).
            queryClient.setQueryData(
              quoteQueryOptions({ couponCode: applied, cartVersion }).queryKey,
              quote,
            );
            setCoupon(applied);
            setValue("");
          },
          onError: (failure) => {
            setError(failure.fields.couponCode ?? failure.message);
          },
        });
      }}
    >
      <label
        htmlFor="coupon-code"
        className="mb-2 block text-[15px] font-bold text-text max-md:sr-only"
      >
        Código promocional
      </label>
      <div className="flex rounded-full bg-surface-2 md:rounded-md md:bg-transparent">
        <input
          id="coupon-code"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
          }}
          placeholder="Digite o código promocional..."
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-14 min-w-0 flex-1 rounded-l-full bg-transparent px-4 text-sm text-text placeholder:text-text-dim focus-visible:outline-2 focus-visible:-outline-offset-2 md:h-10 md:rounded-l-md md:border-[1.5px] md:border-primary"
        />
        <button
          type="submit"
          disabled={apply.isPending}
          className="h-14 rounded-full bg-linear-to-r from-primary-alt to-primary px-5 text-base font-bold text-primary-foreground md:h-10 md:rounded-l-none md:rounded-r-md md:bg-primary md:bg-none"
        >
          {apply.isPending ? "Validando…" : "Aplicar"}
        </button>
      </div>
      <InlineError id={errorId} message={error} />
    </form>
  );
}
