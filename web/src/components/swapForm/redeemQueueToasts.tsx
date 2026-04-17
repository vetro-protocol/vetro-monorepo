import { Toast } from "components/base/toast";
import { useTranslation } from "react-i18next";
import type { Token } from "types";

type Props = {
  onClose: VoidFunction;
  peggedToken: Token;
  toastType: "cancel" | "redeem" | undefined;
  toToken: Token;
};

export function RedeemQueueToasts({
  onClose,
  peggedToken,
  toastType,
  toToken,
}: Props) {
  const { t } = useTranslation();

  if (toastType === "cancel") {
    return (
      <Toast
        closable
        description={t(
          "pages.swap.redeem-queue.cancel-redeem-toast-description",
          { symbol: peggedToken.symbol },
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
