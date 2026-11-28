/**
 * Values an amount of a whitelisted token like Treasury.reserve() does: the
 * oracle price is capped at par, and the result is in pegged token units. Not
 * like Treasury.getPrice, which reverts when a token is off par beyond the
 * price tolerance.
 */
export function toPeggedValue({
  amount,
  latestPrice,
  peggedDecimals,
  priceDecimals,
  tokenDecimals,
}: {
  amount: bigint;
  latestPrice: string;
  peggedDecimals: number;
  priceDecimals: number;
  tokenDecimals: number;
}) {
  const price = BigInt(latestPrice);
  const unitPrice = 10n ** BigInt(priceDecimals);
  const cappedPrice = price < unitPrice ? price : unitPrice;
  return (
    (amount * cappedPrice * 10n ** BigInt(peggedDecimals)) /
    (unitPrice * 10n ** BigInt(tokenDecimals))
  );
}
