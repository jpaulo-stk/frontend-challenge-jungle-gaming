import Big from "big.js";

// ETH always travels as a decimal string; `number` is never used for amounts.

export const addEth = (a: string, b: string): string => new Big(a).plus(b).toFixed();

export const subEth = (a: string, b: string): string => new Big(a).minus(b).toFixed();

export const sumEth = (values: readonly string[]): string =>
  values.reduce((total, value) => total.plus(value), new Big(0)).toFixed();

export const mulEth = (a: string, quantity: number): string => {
  if (!Number.isInteger(quantity)) throw new RangeError("Quantity must be an integer");
  return new Big(a).times(quantity).toFixed();
};

export const compareEth = (a: string, b: string): -1 | 0 | 1 => new Big(a).cmp(b);

/**
 * "12.3" → "12.30 ETH", "0.016" → "0.016 ETH". Rounds half-up to `dp` places,
 * shows at least two (as in the layout) and never uses exponent notation.
 */
export const formatEth = (value: string, dp = 3): string => {
  const rounded = new Big(value).round(dp, Big.roundHalfUp);
  const decimals = rounded.toFixed().split(".")[1]?.length ?? 0;
  return `${rounded.toFixed(Math.max(2, decimals))} ETH`;
};
