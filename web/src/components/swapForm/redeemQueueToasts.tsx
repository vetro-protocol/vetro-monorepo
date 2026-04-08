import { Toast } from "components/base/toast";
import { useTranslation } from "react-i18next";
import type { Token } from "types";

type Props = {
  onClose: VoidFunction;
  toastType: "cancel" | "redeem" | undefined;
  toToken: Token;
  vusd: Token;
};

export function RedeemQueueToasts({
  onClose,
  toastType,
  toToken,
  vusd,
}: Props) {
  const { t } = useTranslation();

  if (toastType === "cancel") {
    return (
      <Toast
        closable
        description={t(
          "pages.swap.redeem-queue.cancel-redeem-toast-description",
          { symbol: vusd.symbol },
        )}
        onClose={onClose}
        title={t("pages.swap.redeem-queue.cancel-redeem-toast-title")}
      />
    );
  }

  if (toastType === "redeem") {
    return (
      <Toast
        closable
        description={t("pages.swap.redeem-queue.swap-confirmed-description", {
          symbol: toToken.symbol,
        })}
        onClose={onClose}
        title={t("pages.swap.redeem-queue.redeem-confirmed")}
      />
    );
  }

  return null;
}
