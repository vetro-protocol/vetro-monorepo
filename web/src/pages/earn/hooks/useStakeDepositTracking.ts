import { useAddTokenToWallet } from "@hemilabs/react-hooks/useAddTokenToWallet";
import type { Token } from "@vetro-protocol/core";
import type { ToastContent } from "components/base/toast";
import { useActivityTracking } from "hooks/useActivityTracking";
import { mainnet } from "networks/mainnet";
import type { DepositStep } from "pages/earn/components/earnForm/stakeFormReducer";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { zeroAddress } from "viem";

export const useStakeDepositTracking = function ({
  amount,
  onSuccess,
  shareToken,
  symbol,
}: {
  amount: string;
  onSuccess: (toast: ToastContent) => void;
  shareToken: Token | undefined;
  symbol: string;
}) {
  const { t } = useTranslation();
  const { mutate: watchShareToken } = useAddTokenToWallet({
    token: {
      address: shareToken?.address ?? zeroAddress,
      chainId: mainnet.id,
      extensions: { logoURI: shareToken?.logoURI },
    },
  });
  const { onCompleted, onFailed, onPending, onTransactionHash } =
    useActivityTracking({
      page: "earn",
      text: t("pages.earn.activity.deposit-text", { amount, symbol }),
      title: `${t("nav.earn")} · ${t("pages.earn.stake.deposit")}`,
    });

  const trackStep = useCallback(
    function trackStep(step: DepositStep) {
      const handlers: Partial<Record<DepositStep, () => void>> = {
        completed() {
          onCompleted();
          onSuccess({
            description: t("pages.earn.stake.deposit-toast-description"),
            title: t("pages.earn.stake.deposit-toast-title"),
          });
          if (shareToken) {
            watchShareToken();
          }
        },
        "deposit-failed": onFailed,
        depositing: onPending,
      };
      handlers[step]?.();
    },
    [
      onCompleted,
      onFailed,
      onPending,
      onSuccess,
      shareToken,
      t,
      watchShareToken,
    ],
  );

  return { onTransactionHash, trackStep };
};
