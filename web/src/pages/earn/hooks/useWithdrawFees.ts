import { useEstimateFees } from "@hemilabs/react-hooks/useEstimateFees";
import { getStakingVaultAddress, stakingVaultAbi } from "@vetro/earn";
import { useMainnet } from "hooks/useMainnet";
import { useNetworkFee } from "hooks/useNetworkFee";
import { useStakedBalance } from "hooks/useStakedBalance";
import { type Address, encodeFunctionData, zeroAddress } from "viem";
import { useEstimateGas } from "wagmi";

type Params = {
  account: Address | undefined;
  amount: bigint;
  isConnected: boolean;
};

export function useWithdrawFees({ account, amount, isConnected }: Params) {
  const chain = useMainnet();
  const stakingVaultAddress = getStakingVaultAddress(chain.id);
  const { data: stakedBalance } = useStakedBalance();

  // Estimate gas for requestWithdraw
  const { data: withdrawGasUnits, isError: isGasError } = useEstimateGas({
    chainId: chain.id,
    data: encodeFunctionData({
      abi: stakingVaultAbi,
      args: [amount, account ?? zeroAddress],
      functionName: "requestWithdraw",
    }),
    query: {
      enabled:
        amount > 0n &&
        isConnected &&
        stakedBalance !== undefined &&
        stakedBalance >= amount,
    },
    to: stakingVaultAddress,
  });

  const { fees: withdrawFees, isError: isFeeEstimateError } = useEstimateFees({
    chainId: chain.id,
    gasUnits: withdrawGasUnits,
    isGasUnitsError: isGasError,
  });

  return useNetworkFee({
    fees: withdrawFees,
    isError: isFeeEstimateError,
  });
}
