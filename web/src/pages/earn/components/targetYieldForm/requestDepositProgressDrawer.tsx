import type { Token } from "@vetro-protocol/core";
import { NetworkFees } from "components/networkFees";
import { useConvertToShares } from "hooks/useConvertToShares";
import { DepositProgressDrawer } from "pages/earn/components/earnForm/depositProgressDrawer";
import type { DepositStep } from "pages/earn/components/earnForm/stakeFormReducer";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import type { Address } from "viem";

type Props = {
  amount: string;
  approvalCompleted: boolean;
  assets: bigint;
  depositStep: DepositStep;
  needsApproval: boolean | undefined;
  networkFee: ComponentProps<typeof NetworkFees>["networkFee"];
  onRetry?: VoidFunction;
  peggedToken: TokenWithGateway;
  shareToken: Token;
  stakingVaultAddress: Address;
};

export function RequestDepositProgressDrawer({
  assets,
  stakingVaultAddress,
  ...props
}: Props) {
  const { t } = useTranslation();
  const { data: shares, status: sharesStatus } = useConvertToShares({
    assets,
    stakingVaultAddress,
  });

  return (
    <DepositProgressDrawer
      {...props}
      assets={assets}
      confirmText={{
        description: t(
          "pages.earn.fixed-term.request-deposit-step-confirm-description",
        ),
        title: t("pages.earn.fixed-term.request-deposit-step-confirm-title"),
      }}
      progressLabel={t("pages.earn.fixed-term.request-deposit-progress")}
      shares={shares}
      sharesStatus={sharesStatus}
      title={t("pages.earn.fixed-term.request-deposit-in-progress")}
    />
  );
}
