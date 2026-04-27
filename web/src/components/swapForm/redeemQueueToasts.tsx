import { Toast } from "components/base/toast";
import { useTranslation } from "react-i18next";
import type { Token } from "types";

type Props = {
  onClose: VoidFunction;
  peggedToken: Token;
} & (
  | { toToken?: undefined; type: "cancel" }
  | { toToken: Token; type: "redeem" }
);

export function RedeemQueueToasts({
  onClose,
  peggedToken,
  toToken,
  type,
}: Props) {
  const { t } = useTranslation();

  if (type === "cancel") {
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
