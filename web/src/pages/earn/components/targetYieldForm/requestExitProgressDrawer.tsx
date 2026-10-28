import type { Token } from "@vetro-protocol/core";
import { RenderCryptoValue } from "components/base/cryptoValue";
import { DollarSign } from "components/base/dollarSign";
import { RenderFiatValue } from "components/base/fiatValue";
import { TokenInteraction } from "components/base/tokenInteraction";
import {
  TransactionProgressDrawer,
  type TransactionStep,
} from "components/earn/transactionProgressDrawer";
import type { NetworkFees } from "components/networkFees";
import { useConvertToAssets } from "hooks/useConvertToAssets";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import type { Address } from "viem";

type Props = {
  claimableShares: bigint;
  networkFee: ComponentProps<typeof NetworkFees>["networkFee"];
  onRetry?: VoidFunction;
  peggedToken: Token;
  shares: bigint;
  shareToken: Token;
  stakingVaultAddress: Address;
  transactionStep: TransactionStep;
};

export function RequestExitProgressDrawer({
  claimableShares,
  networkFee,
  onRetry,
  peggedToken,
  shares,
  shareToken,
  stakingVaultAddress,
  transactionStep,
}: Props) {
  const { t } = useTranslation();
  const { data: assets, status: assetsStatus } = useConvertToAssets({
    shares,
    stakingVaultAddress,
  });

  const { data: claimableAssets, status: claimableAssetsStatus } =
    useConvertToAssets({ shares: claimableShares, stakingVaultAddress });

  const renderFiatDetail = ({
    queryStatus,
    value,
  }: {
    queryStatus: typeof assetsStatus;
    value: bigint | undefined;
  }) => (
    <>
      <DollarSign />
      <RenderFiatValue
        queryStatus={queryStatus}
        token={peggedToken}
        value={value}
      />
    </>
  );

  return (
    <TransactionProgressDrawer
      networkFee={networkFee}
      onRetry={onRetry}
      progressLabel={t("pages.earn.fixed-term.request-exit-progress")}
      stepDescription={t(
        "pages.earn.fixed-term.request-exit-step-confirm-description",
      )}
      stepTitle={t("pages.earn.fixed-term.request-exit-step-confirm-title")}
      transactionStep={transactionStep}
    >
      {claimableShares > 0n ? (
        <TokenInteraction
          amount={
            <RenderCryptoValue token={shareToken} value={claimableShares} />
          }
          detail={renderFiatDetail({
            queryStatus: claimableAssetsStatus,
            value: claimableAssets,
          })}
          label={t("pages.earn.fixed-term.request-exit-claimed-first")}
          token={shareToken}
        />
      ) : null}
      <TokenInteraction
        amount={<RenderCryptoValue token={shareToken} value={shares} />}
        detail={renderFiatDetail({ queryStatus: assetsStatus, value: assets })}
        label={t("pages.earn.stake.you-will-withdraw")}
        token={shareToken}
      />
      <TokenInteraction
        amount={
          <RenderCryptoValue
            status={assetsStatus}
            token={peggedToken}
            value={assets}
          />
        }
        detail={renderFiatDetail({ queryStatus: assetsStatus, value: assets })}
        label={t("pages.earn.stake.you-will-receive-estimated")}
        token={peggedToken}
      />
    </TransactionProgressDrawer>
  );
}
