import { useQuery } from "@tanstack/react-query";
import { RenderFiatValue } from "components/base/fiatValue";
import { useEthereumClient } from "hooks/useEthereumClient";
import { combineWithEpochId } from "pages/earn/hooks/targetYieldPool/combineWithEpochId";
import { epochOptions } from "pages/earn/hooks/targetYieldPool/useEpoch";
import { useEpochId } from "pages/earn/hooks/targetYieldPool/useEpochId";
import type { TokenWithGateway } from "types";
import { unixNowTimestamp } from "utils/date";
import { formatFiatNumber } from "utils/format";
import { getEstimatedYield } from "utils/targetYield";
import type { Address } from "viem";

type Props = {
  amount: bigint;
  peggedToken: TokenWithGateway;
  stakingVaultAddress: Address;
};

export function EstimatedYieldValue({
  amount,
  peggedToken,
  stakingVaultAddress,
}: Props) {
  const client = useEthereumClient();
  const epochId = useEpochId(stakingVaultAddress);
  const query = useQuery({
    ...epochOptions({ client, epochId: epochId.data, stakingVaultAddress }),
    select: ({ accrualInterval, rate }) =>
      getEstimatedYield({
        accrualEnd: accrualInterval.end,
        accrualStart: accrualInterval.start,
        amount,
        now: BigInt(unixNowTimestamp()),
        rate,
      }),
  });
  const { data: estimatedYield, isError } = combineWithEpochId({
    epochId,
    query,
  });

  if (amount === 0n || isError || estimatedYield === null) {
    return "-";
  }
  return (
    <RenderFiatValue
      customFormatter={(value) => `~$${formatFiatNumber(value)}`}
      token={peggedToken}
      value={estimatedYield}
    />
  );
}
