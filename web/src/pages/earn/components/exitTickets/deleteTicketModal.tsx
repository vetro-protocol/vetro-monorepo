import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Button } from "components/base/button";
import { Modal } from "components/base/modal";
import { useCancelWithdraw } from "hooks/useCancelWithdraw";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAccount } from "wagmi";

import type { ExitTicket } from "../../types";

type Props = {
  onClose: VoidFunction;
  onSuccess: VoidFunction;
  ticket: ExitTicket;
};

export function DeleteTicketModal({ onClose, onSuccess, ticket }: Props) {
  const { t } = useTranslation();
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [isDeleting, setIsDeleting] = useState(false);

  const { mutate } = useCancelWithdraw({
    assets: BigInt(ticket.assets),
    onStatusChange(status) {
      if (status === "cancelling") {
        setIsDeleting(true);
      }
      if (status === "completed") {
        onClose();
        onSuccess();
      }
      if (status === "failed") {
        setIsDeleting(false);
      }
    },
    requestId: BigInt(ticket.requestId),
  });

  function handleDelete() {
    setIsDeleting(true);
    mutate();
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex w-[448px] flex-col gap-6 rounded-lg bg-white p-6 shadow-xl">
        <div className="flex flex-col gap-2">
          <h4 className="text-base font-semibold tracking-tight text-gray-900">
            {t("pages.earn.exit-tickets.delete-title")}
          </h4>
          <p className="text-xsm font-normal text-gray-500">
            {t("pages.earn.exit-tickets.delete-description")}
          </p>
        </div>
        <div className="flex gap-3 *:flex-1">
          <Button
            disabled={isDeleting}
            onClick={onClose}
            size="xSmall"
            variant="secondary"
          >
            {t("pages.earn.exit-tickets.delete-btn-cancel")}
          </Button>
          {isConnected ? (
            <Button
              disabled={isDeleting}
              onClick={handleDelete}
              size="xSmall"
              variant="danger"
            >
              {isDeleting
                ? t("pages.earn.exit-tickets.delete-btn-deleting")
                : t("pages.earn.exit-tickets.delete-btn")}
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
