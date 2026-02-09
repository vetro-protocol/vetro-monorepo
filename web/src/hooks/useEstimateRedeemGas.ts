import { useEstimateFees } from "@hemilabs/react-hooks/useEstimateFees";
import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { getGatewayAddress } from "@vetro/gateway";
import { encodeRedeem } from "@vetro/gateway/actions";
import type { Token } from "types";
import { createErc20AllowanceStateOverride } from "utils/erc20StateOverride";
import { zeroAddress, type Address } from "viem";
import { useEstimateGas } from "wagmi";

import { useMainnet } from "./useMainnet";

type Params = {
  enabled?: boolean;
  minAmountOut: bigint;
  peggedToken: Token;
  peggedTokenIn: bigint;
  receiver: Address;
  tokenOut: Address;
};

export const useEstimateRedeemGas = function ({
  enabled = true,
  minAmountOut,
  peggedToken,
  peggedTokenIn,
  receiver,
  tokenOut,
}: Params) {
  const ethereumChain = useMainnet();
  const { data: tokenBalance } = useTokenBalance(peggedToken);

  const gatewayAddress = getGatewayAddress(ethereumChain.id);

  const data = encodeRedeem({
    minAmountOut,
    peggedTokenIn,
    receiver: receiver ?? zeroAddress,
    tokenOut,
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
        minAmountOut > 0n &&
        tokenBalance !== undefined &&
        tokenBalance >= peggedTokenIn,
    },
    stateOverride: createErc20AllowanceStateOverride({
      owner: receiver,
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
