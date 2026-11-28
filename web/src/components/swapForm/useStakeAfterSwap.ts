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
import { type Address, type Hash, type Log, isAddressEqual } from "viem";
import { useAccount } from "wagmi";

type StakeState = {
  approvalCompleted: boolean;
  assets: bigint | undefined;
  hash: Hash | undefined;
  step: DepositStep;
};

const initialStakeState: StakeState = {
  approvalCompleted: false,
  assets: undefined,
  hash: undefined,
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

type RunTarget = {
  account: Address;
  peggedToken: TokenWithGateway;
  stakingVaultAddress: Address;
};

const getMintedAssets = ({
  logs,
  target,
}: {
  logs: Log[];
  target: RunTarget | undefined;
}) =>
  target
    ? getReceivedAmount({
        account: target.account,
        logs,
        token: target.peggedToken.address,
      })
    : undefined;

const isSameAccount = ({
  account,
  expected,
}: {
  account: Address | undefined;
  expected: Address;
}) => account !== undefined && isAddressEqual(account, expected);

const getFeeStake = ({
  active,
  approve10x,
  depositPreview,
  peggedToken,
  stakingVaultAddress,
}: {
  active: boolean;
  approve10x: boolean;
  depositPreview: bigint | undefined;
  peggedToken: TokenWithGateway;
  stakingVaultAddress: Address | undefined;
}) =>
  active && stakingVaultAddress !== undefined && depositPreview !== undefined
    ? {
        amount: depositPreview,
        approveAmount: approve10x ? depositPreview * 10n : undefined,
        stakingVaultAddress,
        token: peggedToken,
      }
    : undefined;

const getRetryStep = function ({ approvalCompleted, hash }: StakeState) {
  if (hash) {
    return "depositing";
  }
  return approvalCompleted ? "approved" : "idle";
};

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
    account: Address;
    needsApproval: boolean;
    previewAssets: bigint;
    stakingVaultAddress: Address;
  }>();
  // A stake left open in the wallet from an earlier flow can still emit
  // events. Only the variables of the latest stake call are accepted.
  const currentRun = useRef<object | undefined>(undefined);
  const runTarget = useRef<RunTarget | undefined>(undefined);

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

  const { onReplaced, onTransactionHash, trackStep } = useStakeDepositTracking({
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
    onTransactionHash({ hash, variables }) {
      if (variables !== currentRun.current) {
        return;
      }
      setStake((prev) => ({ ...prev, hash }));
      onTransactionHash(hash);
    },
    onTransactionReplaced({ hash, variables }) {
      if (variables !== currentRun.current) {
        return;
      }
      setStake((prev) => ({ ...prev, hash }));
      onReplaced(hash);
    },
  });

  const stakeAssets = function ({
    assets,
    needsApproval,
    pendingHash,
  }: {
    assets: bigint;
    needsApproval: boolean;
    pendingHash?: Hash;
  }) {
    const target = runTarget.current!;
    const variables = {
      account: target.account,
      approveAmount: approve10x ? assets * 10n : undefined,
      assets,
      peggedToken: target.peggedToken,
      pendingHash,
      stakingVaultAddress: target.stakingVaultAddress,
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
          canRetry:
            stake.assets !== undefined &&
            isSameAccount({ account, expected: started.account }),
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
    feeStake: getFeeStake({
      active,
      approve10x,
      depositPreview,
      peggedToken,
      stakingVaultAddress,
    }),
    isAllowanceError: enabled && isAllowanceError,
    isLoading: enabled && allowance === undefined,
    onMinted(logs: Log[]) {
      const assets = getMintedAssets({ logs, target: runTarget.current });
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
        step: getRetryStep(prev),
      }));
      stakeAssets({
        assets: stake.assets!,
        needsApproval: !!started?.needsApproval && !stake.approvalCompleted,
        pendingHash: stake.hash,
      });
    },
    stakeTarget: getStakeTarget({ active, shareToken, stakingVaultAddress }),
    start() {
      currentRun.current = undefined;
      const target =
        enabled && account
          ? { account, peggedToken, stakingVaultAddress: stakingVaultAddress! }
          : undefined;
      runTarget.current = target;
      setStake(initialStakeState);
      setStarted(
        target && {
          account: target.account,
          needsApproval: allowance! < (depositPreview ?? 0n),
          previewAssets: depositPreview ?? 0n,
          stakingVaultAddress: target.stakingVaultAddress,
        },
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
