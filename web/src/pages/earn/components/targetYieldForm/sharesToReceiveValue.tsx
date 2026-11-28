import type { Token } from "@vetro-protocol/core";
import { RenderCryptoValue } from "components/base/cryptoValue";
import { useConvertToShares } from "hooks/useConvertToShares";
import type { Address } from "viem";

type Props = {
  amount: bigint;
  debouncedAmount: bigint;
  shareToken: Token;
  stakingVaultAddress: Address;
};

export function SharesToReceiveValue({
  amount,
  debouncedAmount,
  shareToken,
  stakingVaultAddress,
}: Props) {
  const { data: shares, status } = useConvertToShares({
    assets: debouncedAmount,
    stakingVaultAddress,
  });

  if (amount === 0n) {
    return "-";
  }
  return (
    <RenderCryptoValue
      showSymbol
      status={status}
      token={shareToken}
      value={shares}
    />
  );
}
