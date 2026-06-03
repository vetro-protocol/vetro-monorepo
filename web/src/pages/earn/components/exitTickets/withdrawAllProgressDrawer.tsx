import { useQueries, useQueryClient } from "@tanstack/react-query";
import { Button } from "components/base/button";
import { DrawerTitle } from "components/base/drawer/drawerTitle";
import { RenderFiatValue } from "components/base/fiatValue";
import { Spinner } from "components/base/spinner";
import { CheckCircleIcon } from "components/base/toast/checkCircleIcon";
import {
  type Step,
  stepStatus,
  VerticalStepper,
} from "components/base/verticalStepper";
import { TokenLogo } from "components/tokenLogo";
import { useAnimatedVisibility } from "hooks/useAnimatedVisibility";
import { useEthereumClient } from "hooks/useEthereumClient";
import {
  useVaultPeggedToken,
  vaultPeggedTokenQueryOptions,
} from "hooks/useVaultPeggedToken";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
import type { TokenWithGateway } from "types";
import { formatAmount } from "utils/token";
import type { Address } from "viem";

export type VaultStatus = "claiming" | "completed" | "failed" | "pending";

type Vault = {
  amount: bigint;
  stakingVaultAddress: Address;
};

type Props = {
  onRetry?: VoidFunction;
  statuses: Record<Address, VaultStatus>;
  vaults: Vault[];
};

const statusToStepStatus: Record<VaultStatus, Step["status"]> = {
  claiming: stepStatus.progress,
  completed: stepStatus.completed,
  failed: stepStatus.failed,
  pending: stepStatus.notReady,
};

const FailedIcon = () => (
  <div className="flex size-4 items-center justify-center rounded-full bg-red-500">
    <svg
      aria-hidden="true"
      className="size-2.5"
      fill="none"
      stroke="white"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      viewBox="0 0 12 12"
    >
      <path d="M3 3l6 6M9 3l-6 6" />
    </svg>
  </div>
);

const StatusIcon = ({ status }: { status: VaultStatus }) => (
  <div className="flex h-10 items-center">
    {status === "claiming" && <Spinner />}
    {status === "completed" && <CheckCircleIcon className="size-4" />}
    {status === "failed" && <FailedIcon />}
  </div>
);

type RowProps = {
  amount: bigint;
  peggedToken: TokenWithGateway;
  status: VaultStatus;
};

const Row = ({ amount, peggedToken, status }: RowProps) => (
  <div
    className={`flex items-start justify-between p-6 ${
      status === "pending" ? "opacity-50" : ""
    }`}
  >
    <div className="flex flex-col gap-y-2">
      <div className="flex items-center gap-3">
        <p className="flex items-center gap-x-2 text-4xl leading-10 font-semibold tracking-tight text-gray-900">
          <span>
            {formatAmount({
              amount,
              decimals: peggedToken.decimals,
              isError: false,
            })}
          </span>
          <span
            className={
              status === "completed" ? "text-gray-500" : "text-gray-900"
            }
          >
            {peggedToken.symbol}
          </span>
        </p>
        <TokenLogo {...peggedToken} size="large" />
      </div>
      <p className="text-xsm text-gray-500">
        $<RenderFiatValue token={peggedToken} value={amount} />
      </p>
    </div>
    <StatusIcon status={status} />
  </div>
);

type VaultRowProps = {
  amount: bigint;
  stakingVaultAddress: Address;
  status: VaultStatus;
};

// Owns its vault's pegged-token query so the row can render its own loading and
// error states without blocking the rest of the flow.
function VaultRow({ amount, stakingVaultAddress, status }: VaultRowProps) {
  const { data: peggedToken, isError } =
    useVaultPeggedToken(stakingVaultAddress);

  if (isError) {
    return (
      <div className="flex items-center justify-between p-6">
        <span className="text-4xl leading-10 font-semibold text-gray-300">
          -
        </span>
        <StatusIcon status={status} />
      </div>
    );
  }

  if (!peggedToken) {
    return (
      <div className="flex items-center justify-between p-6">
        <Skeleton className="h-10 w-40" />
      </div>
    );
  }

  return <Row amount={amount} peggedToken={peggedToken} status={status} />;
}

const StepperSkeleton = ({ count }: { count: number }) => (
  <div className="flex flex-col gap-5 py-4">
    {Array.from({ length: count }).map((_, index) => (
      <div className="flex gap-4" key={`step-skeleton-${index}`}>
        <Skeleton circle className="size-4" />
        <div className="flex flex-1 flex-col gap-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
    ))}
  </div>
);

// Resolves every vault's pegged token together (the stepper needs all symbols at
// once) and shows a skeleton until they load, then renders the actual stepper.
function VaultStepper({
  statuses,
  vaults,
}: Pick<Props, "statuses" | "vaults">) {
  const client = useEthereumClient();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const peggedTokenQueries = useQueries({
    queries: vaults.map((vault) =>
      vaultPeggedTokenQueryOptions({
        client,
        queryClient,
        stakingVaultAddress: vault.stakingVaultAddress,
      }),
    ),
  });

  if (peggedTokenQueries.some((query) => query.isLoading)) {
    return <StepperSkeleton count={vaults.length} />;
  }

  const steps: Step[] = vaults.map((vault, index) => ({
    description: t(
      "pages.earn.exit-tickets.withdraw-all-progress.step-description",
    ),
    status: statusToStepStatus[statuses[vault.stakingVaultAddress]],
    title: t("pages.earn.exit-tickets.withdraw-all-progress.step-title", {
      symbol: peggedTokenQueries[index].data?.symbol ?? "",
    }),
  }));

  return <VerticalStepper steps={steps} />;
}

export function WithdrawAllProgressDrawer({
  onRetry,
  statuses,
  vaults,
}: Props) {
  const { t } = useTranslation();
  const { render: renderRetry, show: showRetry } =
    useAnimatedVisibility(!!onRetry);

  return (
    <div className="flex h-full flex-col">
      <DrawerTitle>
        {t("pages.earn.exit-tickets.withdraw-all-progress.title")}
      </DrawerTitle>

      <div className="divide-y divide-gray-200 border-y border-gray-200 bg-gray-50">
        {vaults.map((vault) => (
          <VaultRow
            amount={vault.amount}
            key={vault.stakingVaultAddress}
            stakingVaultAddress={vault.stakingVaultAddress}
            status={statuses[vault.stakingVaultAddress]}
          />
        ))}
      </div>

      <div className="flex-1" />

      <div className="flex flex-col gap-2 px-6 pb-6">
        <p className="text-[11px] leading-4 font-medium tracking-wide text-gray-500">
          {t("pages.earn.exit-tickets.withdraw-all-progress.progress-label")}
        </p>
        <div className="border-t border-gray-200">
          <VaultStepper statuses={statuses} vaults={vaults} />
        </div>
      </div>

      {renderRetry && (
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            showRetry ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 *:w-full">
              <Button onClick={onRetry} size="small" variant="primary">
                {t("pages.swap.progress.retry")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
