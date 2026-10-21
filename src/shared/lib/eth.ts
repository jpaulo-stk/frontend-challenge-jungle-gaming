import Big from "big.js";

// ETH always travels as a decimal string; `number` is never used for amounts.

export const addEth = (a: string, b: string): string => new Big(a).plus(b).toFixed();

export const mulEth = (a: string, quantity: number): string => {
  if (!Number.isInteger(quantity)) throw new RangeError("Quantity must be an integer");
  return new Big(a).times(quantity).toFixed();
};

export const compareEth = (a: string, b: string): -1 | 0 | 1 => new Big(a).cmp(b);

/** "1.190" → "1.19 ETH". Rounds half-up to `dp` places and never uses exponent notation. */
export const formatEth = (value: string, dp = 3): string =>
  `${new Big(value).round(dp, Big.roundHalfUp).toFixed()} ETH`;
