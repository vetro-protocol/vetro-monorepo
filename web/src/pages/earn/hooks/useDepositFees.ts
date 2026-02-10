import { useEstimateApproveErc20Fees } from "@hemilabs/react-hooks/useEstimateApproveErc20Fees";
import { useEstimateFees } from "@hemilabs/react-hooks/useEstimateFees";
import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { getStakingVaultAddress, stakingVaultAbi } from "@vetro/earn";
import { useMainnet } from "hooks/useMainnet";
import { useNetworkFee } from "hooks/useNetworkFee";
import type { Token } from "types";
import { createErc20AllowanceStateOverride } from "utils/erc20StateOverride";
import { type Address, encodeFunctionData, zeroAddress } from "viem";
import { useEstimateGas } from "wagmi";

type Params = {
  account: Address | undefined;
  amount: bigint;
  isConnected: boolean;
  token: Token | undefined;
};

function sumFees(
  approvalFees: bigint | undefined,
  depositFees: bigint | undefined,
) {
  if (approvalFees !== undefined && depositFees !== undefined) {
    return approvalFees + depositFees;
  }
  return depositFees;
}

export function useDepositFees({
  account,
  amount,
  isConnected,
  token,
}: Params) {
  const chain = useMainnet();
  const stakingVaultAddress = getStakingVaultAddress(chain.id);
  const tokenAddress = token?.address ?? zeroAddress;

  const { data: tokenBalance } = useTokenBalance({
    address: tokenAddress,
    chainId: chain.id,
  });

  const hasEnoughBalance = tokenBalance !== undefined && tokenBalance >= amount;
  const canEstimate =
    amount > 0n && isConnected && token !== undefined && hasEnoughBalance;

  const stateOverride = token
    ? createErc20AllowanceStateOverride({
        owner: account,
        spender: stakingVaultAddress,
        token,
      })
    : [];

  // Estimate gas for approve
  const { fees: approvalFees, isError: isApprovalError } =
    useEstimateApproveErc20Fees({
      amount,
      enabled: canEstimate,
      spender: stakingVaultAddress,
      token: { address: tokenAddress, chainId: chain.id },
    });

  // Estimate gas for deposit
  const { data: depositGasUnits, isError: isDepositGasError } = useEstimateGas({
    chainId: chain.id,
    data: encodeFunctionData({
      abi: stakingVaultAbi,
      args: [amount, account ?? zeroAddress],
      functionName: "deposit",
    }),
    query: { enabled: canEstimate },
    stateOverride,
    to: stakingVaultAddress,
  });

  const { fees: depositFees, isError: isDepositFeeError } = useEstimateFees({
    chainId: chain.id,
    gasUnits: depositGasUnits,
    isGasUnitsError: isDepositGasError,
  });

  return useNetworkFee({
    fees: sumFees(approvalFees, depositFees),
    isEnabled: canEstimate,
    isError: isApprovalError || isDepositFeeError,
  });
}
