import { useEstimateFees } from "@hemilabs/react-hooks/useEstimateFees";
import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { getGatewayAddress } from "@vetro/gateway";
import { encodeDeposit } from "@vetro/gateway/actions";
import type { Token } from "types";
import { createErc20AllowanceStateOverride } from "utils/erc20StateOverride";
import { zeroAddress } from "viem";
import { useAccount, useEstimateGas } from "wagmi";

import { useMainnet } from "./useMainnet";

type Params = {
  amountIn: bigint;
  minPeggedTokenOut: bigint | undefined;
  token: Token;
};

export const useEstimateDepositGas = function ({
  amountIn,
  minPeggedTokenOut,
  token,
}: Params) {
  const { address } = useAccount();
  const ethereumChain = useMainnet();
  const { data: tokenBalance } = useTokenBalance(token);

  const gatewayAddress = getGatewayAddress(ethereumChain.id);

  const data = encodeDeposit({
    amountIn,
    minPeggedTokenOut: minPeggedTokenOut ?? 0n,
    receiver: address ?? zeroAddress,
    tokenIn: token.address,
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
        address !== undefined &&
        amountIn > 0n &&
        minPeggedTokenOut !== undefined &&
        minPeggedTokenOut > 0n &&
        tokenBalance !== undefined &&
        tokenBalance >= amountIn,
    },
    stateOverride: createErc20AllowanceStateOverride({
      owner: address,
      spender: gatewayAddress,
      token,
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
