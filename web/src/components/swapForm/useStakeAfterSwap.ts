import { useAllowance } from "@hemilabs/react-hooks/useAllowance";
import type { Token } from "@vetro-protocol/core";
import type { ToastContent } from "components/base/toast";
import { useShareTokenForPeggedToken } from "hooks/useShareTokenForPeggedToken";
import { useStakeDeposit } from "hooks/useStakeDeposit";
import { useStakingVaultForPeggedToken } from "hooks/useStakingVaultForPeggedToken";
import type { DepositStep } from "pages/earn/components/earnForm/stakeFormReducer";
import { useStakeDepositTracking } from "pages/earn/hooks/useStakeDepositTracking";
import { useCallback, useRef, useState } from "react";
import type { TokenWithGateway } from "types";
import { getReceivedAmount } from "utils/receipt";
import type { Address, Log } from "viem";
import { useAccount } from "wagmi";

type StakeState = {
  approvalCompleted: boolean;
  assets: bigint | undefined;
  step: DepositStep;
};

const initialStakeState: StakeState = {
  approvalCompleted: false,
  assets: undefined,
  step: "idle",
};

const getStakeTarget = ({
  active,
  shareToken,
  stakingVaultAddress,
}: {
  active: boolean;
  shareToken: Token | undefined;
  stakingVaultAddress: Address | undefined;
}) =>
  active && shareToken && stakingVaultAddress
    ? { shareToken, stakingVaultAddress }
    : undefined;

export const useStakeAfterSwap = function ({
  approve10x,
  depositPreview,
  onSuccess,
  outputValue,
  peggedToken,
}: {
  approve10x: boolean;
  depositPreview: bigint | undefined;
  onSuccess: (toast: ToastContent) => void;
  outputValue: string;
  peggedToken: TokenWithGateway;
}) {
  const { address: account } = useAccount();
  const [active, setActive] = useState(false);
  const [stake, setStake] = useState<StakeState>(initialStakeState);
  // Snapshot, because the allowance flips after the approval tx.
  const [started, setStarted] = useState<{
    needsApproval: boolean;
    previewAssets: bigint;
    stakingVaultAddress: Address;
  }>();
  // A stake left open in the wallet from an earlier flow can still emit
  // events. Only the variables of the latest stake call are accepted.
  const currentRun = useRef<object | undefined>(undefined);

  const { data: stakingVaultAddress } = useStakingVaultForPeggedToken({
    peggedTokenAddress: peggedToken.address,
  });
  const { data: shareToken } = useShareTokenForPeggedToken({ peggedToken });
  const enabled = active && stakingVaultAddress !== undefined;

  const { data: allowance, isError: isAllowanceError } = useAllowance({
    owner: account,
    spender: stakingVaultAddress,
    token: peggedToken,
  });

  const { onTransactionHash, trackStep } = useStakeDepositTracking({
    amount: outputValue,
    onSuccess,
    shareToken,
    symbol: peggedToken.symbol,
  });

  const handleStatusChange = useCallback(
    function handleStatusChange({
      step,
      variables,
    }: {
      step: DepositStep;
      variables: object;
    }) {
      if (variables !== currentRun.current) {
        return;
      }
      setStake((prev) => ({
        ...prev,
        approvalCompleted: prev.approvalCompleted || step === "approved",
        step,
      }));
      trackStep(step);
    },
    [trackStep],
  );

  const { mutate } = useStakeDeposit({
    onStatusChange: ({ status, variables }) =>
      handleStatusChange({ step: status, variables }),
    onTransactionHash,
    peggedToken,
  });

  const stakeAssets = function ({
    assets,
    needsApproval,
  }: {
    assets: bigint;
    needsApproval: boolean;
  }) {
    const variables = {
      approveAmount: approve10x ? assets * 10n : undefined,
      assets,
      stakingVaultAddress: stakingVaultAddress!,
    };
    currentRun.current = variables;
    mutate(variables, {
      onError: () =>
        handleStatusChange({
          step: needsApproval ? "approve-failed" : "deposit-failed",
          variables,
        }),
    });
  };

  return {
    drawerStake: started
      ? {
          approvalCompleted: stake.approvalCompleted,
          canRetry: stake.assets !== undefined,
          needsApproval: started.needsApproval,
          output: shareToken && {
            assets: started.previewAssets,
            shareToken,
            stakingVaultAddress: started.stakingVaultAddress,
          },
          step: stake.step,
        }
      : undefined,
    enabled,
    feeStake:
      active &&
      stakingVaultAddress !== undefined &&
      depositPreview !== undefined
        ? {
            amount: depositPreview,
            approveAmount: approve10x ? depositPreview * 10n : undefined,
            stakingVaultAddress,
            token: peggedToken,
          }
        : undefined,
    isAllowanceError: enabled && isAllowanceError,
    isLoading: enabled && allowance === undefined,
    onMinted(logs: Log[]) {
      const assets = account
        ? getReceivedAmount({ account, logs, token: peggedToken.address })
        : undefined;
      if (assets === undefined) {
        setStake((prev) => ({ ...prev, step: "deposit-failed" }));
        return;
      }
      const needsApproval = allowance! < assets;
      setStarted((prev) => prev && { ...prev, needsApproval });
      setStake((prev) => ({ ...prev, assets }));
      stakeAssets({ assets, needsApproval });
    },
    retry() {
      setStake((prev) => ({
        ...prev,
        step: prev.approvalCompleted ? "approved" : "idle",
      }));
      stakeAssets({
        assets: stake.assets!,
        needsApproval: !!started?.needsApproval && !stake.approvalCompleted,
      });
    },
    stakeTarget: getStakeTarget({ active, shareToken, stakingVaultAddress }),
    start() {
      currentRun.current = undefined;
      setStake(initialStakeState);
      setStarted(
        enabled
          ? {
              needsApproval: allowance! < (depositPreview ?? 0n),
              previewAssets: depositPreview ?? 0n,
              stakingVaultAddress: stakingVaultAddress!,
            }
          : undefined,
      );
    },
    toggle: {
      active,
      available: stakingVaultAddress !== undefined,
      onToggle: () => setActive((prev) => !prev),
      shareToken,
    },
  };
};
