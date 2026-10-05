import { type Address, isAddressEqual } from "viem";

// Within 10% of the expected rate: treat the pair as a peg and surface drift
// from the expected rate.
const PEG_THRESHOLD = 1.1;

// Value of one coin in its peg unit. Vault share tokens are worth their
// assets-per-share; every other coin is assumed to sit at its peg.
const pegValue = function ({
  address,
  shareRates,
  shareTokenAddresses,
}: {
  address: Address;
  shareRates: Record<string, number>;
  shareTokenAddresses: Address[];
}) {
  if (!shareTokenAddresses.some((share) => isAddressEqual(share, address))) {
    return 1;
  }
  return shareRates[address.toLowerCase()];
};

// Drift (in %) of the pool rate from the rate implied by each leg's peg value.
// Undefined when a share leg's rate is unknown or the pair isn't a peg.
export const pegDeviation = function ({
  base,
  quote,
  rate,
  shareRates,
  shareTokenAddresses,
}: {
  base: Address;
  quote: Address;
  rate: number;
  shareRates: Record<string, number>;
  shareTokenAddresses: Address[];
}) {
  const basePeg = pegValue({ address: base, shareRates, shareTokenAddresses });
  const quotePeg = pegValue({
    address: quote,
    shareRates,
    shareTokenAddresses,
  });
  if (!basePeg || !quotePeg) {
    return undefined;
  }
  const expectedRate = basePeg / quotePeg;
  const relative = rate / expectedRate;
  if (Math.max(relative, 1 / relative) >= PEG_THRESHOLD) {
    return undefined;
  }
  return { deviation: (relative - 1) * 100, expectedRate };
};
