import { type Address, isAddressEqual } from "viem";

const PEG_THRESHOLD = 1.1;

const isShareToken = ({
  address,
  shareTokenAddresses,
}: {
  address: Address;
  shareTokenAddresses: Address[];
}) => shareTokenAddresses.some((share) => isAddressEqual(share, address));

const pegValue = function ({
  address,
  shareRates,
  shareTokenAddresses,
}: {
  address: Address;
  shareRates: Record<string, number>;
  shareTokenAddresses: Address[];
}) {
  if (!isShareToken({ address, shareTokenAddresses })) {
    return 1;
  }
  return shareRates[address.toLowerCase()];
};

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
  const hasShareLeg = [base, quote].some((address) =>
    isShareToken({ address, shareTokenAddresses }),
  );
  return { deviation: (relative - 1) * 100, expectedRate, hasShareLeg };
};
