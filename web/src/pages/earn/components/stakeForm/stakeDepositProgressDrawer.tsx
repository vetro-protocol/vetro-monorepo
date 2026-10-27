import type { Token } from "@vetro-protocol/core";
import { NetworkFees } from "components/networkFees";
import { useVaultPreviewDeposit } from "hooks/useVaultPreviewDeposit";
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
  needsApproval: boolean;
  networkFee: ComponentProps<typeof NetworkFees>["networkFee"];
  peggedToken: TokenWithGateway;
  shareToken: Token;
  stakingVaultAddress: Address;
};

export function StakeDepositProgressDrawer({
  assets,
  stakingVaultAddress,
  ...props
}: Props) {
  const { t } = useTranslation();
  const { data: sharesReceived, status: sharesReceivedStatus } =
    useVaultPreviewDeposit({ assets, stakingVaultAddress });

  return (
    <DepositProgressDrawer
      {...props}
      assets={assets}
      confirmText={{
        description: t("pages.earn.stake.deposit-step-confirm-description"),
        title: t("pages.earn.stake.deposit-step-confirm-title"),
      }}
      progressLabel={t("pages.earn.stake.deposit-progress")}
      shares={sharesReceived}
      sharesStatus={sharesReceivedStatus}
      title={t("pages.earn.stake.deposit-in-progress")}
    />
  );
}
