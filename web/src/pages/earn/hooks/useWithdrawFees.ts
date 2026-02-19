import { useEstimateFees } from "@hemilabs/react-hooks/useEstimateFees";
import { getStakingVaultAddress, stakingVaultAbi } from "@vetro/earn";
import { useMainnet } from "hooks/useMainnet";
import { useNetworkFee } from "hooks/useNetworkFee";
import { useStakedBalance } from "hooks/useStakedBalance";
import {
  type Address,
  erc4626Abi,
  encodeFunctionData,
  zeroAddress,
} from "viem";
import { useEstimateGas } from "wagmi";

type Params = {
  account: Address | undefined;
  amount: bigint;
  instantWithdraw: boolean;
  isConnected: boolean;
};

export function useWithdrawFees({
  account,
  amount,
  instantWithdraw,
  isConnected,
}: Params) {
  const chain = useMainnet();
  const stakingVaultAddress = getStakingVaultAddress(chain.id);
  const { data: stakedBalance } = useStakedBalance();

  const hasEnoughBalance =
    stakedBalance !== undefined && stakedBalance >= amount;
  const canEstimate =
    amount > 0n && isConnected && account !== undefined && hasEnoughBalance;

  const calldata = instantWithdraw
    ? encodeFunctionData({
        abi: erc4626Abi,
        args: [amount, account ?? zeroAddress, account ?? zeroAddress],
        functionName: "withdraw",
      })
    : encodeFunctionData({
        abi: stakingVaultAbi,
        args: [amount, account ?? zeroAddress],
        functionName: "requestWithdraw",
      });

  const {
    data: withdrawGasUnits,
    isEnabled,
    isError: isGasError,
  } = useEstimateGas({
    chainId: chain.id,
    data: calldata,
    query: { enabled: canEstimate },
    to: stakingVaultAddress,
  });

  const { fees: withdrawFees, isError: isFeeEstimateError } = useEstimateFees({
    chainId: chain.id,
    gasUnits: withdrawGasUnits,
    isGasUnitsError: isGasError,
  });

  return useNetworkFee({
    fees: withdrawFees,
    isEnabled,
    isError: isFeeEstimateError,
  });
}
