import { useEstimateFees } from "@hemilabs/react-hooks/useEstimateFees";
import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { getGatewayAddress } from "@vetro/gateway";
import { encodeRequestRedeem } from "@vetro/gateway/actions";
import type { Token } from "types";
import { createErc20AllowanceStateOverride } from "utils/erc20StateOverride";
import type { Address } from "viem";
import { useEstimateGas } from "wagmi";

import { useMainnet } from "./useMainnet";

type Params = {
  enabled?: boolean;
  owner: Address | undefined;
  peggedToken: Token;
  peggedTokenIn: bigint;
};

export const useEstimateRequestRedeemGas = function ({
  enabled = true,
  owner,
  peggedToken,
  peggedTokenIn,
}: Params) {
  const ethereumChain = useMainnet();
  const { data: tokenBalance } = useTokenBalance(peggedToken);

  const gatewayAddress = getGatewayAddress(ethereumChain.id);

  const data = encodeRequestRedeem({
    peggedTokenAmount: peggedTokenIn,
  });

  const {
    data: gasUnits,
    isEnabled,
    isError: isGasUnitsError,
  } = useEstimateGas({
    chainId: ethereumChain.id,
    data,
    query: {
      enabled:
        enabled &&
        peggedTokenIn > 0n &&
        tokenBalance !== undefined &&
        tokenBalance >= peggedTokenIn,
    },
    stateOverride: createErc20AllowanceStateOverride({
      owner,
      spender: gatewayAddress,
      token: peggedToken,
    }),
    to: gatewayAddress,
  });

  const feeEstimation = useEstimateFees({
    chainId: ethereumChain.id,
    gasUnits,
    isGasUnitsError,
  });

  return {
    ...feeEstimation,
    isEnabled,
  };
};
