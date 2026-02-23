import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Button } from "components/base/button";
import { Modal } from "components/base/modal";
import { useCancelRedeemRequest } from "hooks/useCancelRedeemRequest";
import { useVusd } from "hooks/useVusd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAccount } from "wagmi";

type Props = {
  onClose: VoidFunction;
  onSuccess: VoidFunction;
  redeemableAmount: bigint;
};

export function CancelRedeemModal({
  onClose,
  onSuccess,
  redeemableAmount,
}: Props) {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [isCancelling, setIsCancelling] = useState(false);
  const { t } = useTranslation();
  const { data: vusd } = useVusd();

  const { mutate } = useCancelRedeemRequest({
    onEmitter(emitter) {
      emitter.on("pre-cancel-redeem-request", () => setIsCancelling(true));
      emitter.on("cancel-redeem-request-transaction-succeeded", function () {
        onClose();
        onSuccess();
      });
      emitter.on("cancel-redeem-request-failed", () => setIsCancelling(false));
      emitter.on("cancel-redeem-request-failed-validation", () =>
        setIsCancelling(false),
      );
      emitter.on("cancel-redeem-request-transaction-reverted", () =>
        setIsCancelling(false),
      );
      emitter.on("user-signing-cancel-redeem-request-error", () =>
        setIsCancelling(false),
      );
    },
    redeemableAmount,
  });

  return (
    <Modal onClose={onClose}>
      <div className="flex w-[448px] flex-col gap-6 rounded-lg bg-white p-6 shadow-xl">
        <div className="flex flex-col gap-y-1">
          <h4 className="text-gray-900">
            {t("pages.swap.redeem-vault.cancel-redeem")}
          </h4>
          <p className="text-b-regular text-gray-500">
            {t("pages.swap.redeem-vault.cancel-redeem-description", {
              symbol: vusd.symbol,
            })}
          </p>
        </div>
        <div className="flex gap-3 *:flex-1">
          <Button
            disabled={isCancelling}
            onClick={onClose}
            size="xSmall"
            variant="secondary"
          >
            {t("pages.swap.redeem-vault.keep-redeem")}
          </Button>
          {isConnected ? (
            <Button
              disabled={isCancelling}
              onClick={() => mutate()}
              size="xSmall"
              variant="danger"
            >
              {isCancelling
                ? t("pages.swap.redeem-vault.cancel-redeem-btn-cancelling")
                : t("pages.swap.redeem-vault.cancel-redeem-btn-cancel")}
            </Button>
          ) : (
            <Button onClick={openConnectModal} size="xSmall" variant="primary">
              {t("pages.swap.form.connect-wallet")}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
