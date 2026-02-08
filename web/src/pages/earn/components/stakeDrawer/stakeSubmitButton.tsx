import { Button } from "components/base/button";
import { useTranslation } from "react-i18next";

type Props = {
  actionText: string;
  balancesLoaded: boolean;
  connectWalletText?: string;
  enterAmountText?: string;
  inputError: string | undefined;
  insufficientBalanceText?: string;
  insufficientGasText?: string;
  isConnected: boolean;
  isPending: boolean;
  onConnectWallet?: VoidFunction;
  pendingText: string;
};

export function StakeSubmitButton({
  actionText,
  balancesLoaded,
  connectWalletText,
  enterAmountText,
  inputError,
  insufficientBalanceText,
  insufficientGasText,
  isConnected,
  isPending,
  onConnectWallet,
  pendingText,
}: Props) {
  const { t } = useTranslation();

  if (!isConnected) {
    return (
      <Button
        onClick={onConnectWallet}
        size="xSmall"
        type="button"
        variant="primary"
      >
        {connectWalletText ?? t("pages.swap.form.connect-wallet")}
      </Button>
    );
  }

  function getButtonText() {
    if (isPending) {
      return pendingText;
    }
    if (!balancesLoaded) {
      return actionText;
    }
    if (inputError === "enter-amount") {
      return enterAmountText ?? t("pages.swap.form.enter-amount");
    }
    if (inputError === "insufficient-balance") {
      return (
        insufficientBalanceText ?? t("pages.swap.form.insufficient-balance")
      );
    }
    if (inputError === "insufficient-gas") {
      return insufficientGasText ?? t("pages.swap.form.insufficient-gas");
    }
    return actionText;
  }

  const isDisabled = !balancesLoaded || !!inputError || isPending;

  return (
    <Button disabled={isDisabled} size="xSmall" type="submit" variant="primary">
      {getButtonText()}
    </Button>
  );
}
