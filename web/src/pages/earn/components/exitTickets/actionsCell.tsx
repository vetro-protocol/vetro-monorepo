import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Button, ButtonIcon } from "components/base/button";
import { Toast } from "components/base/toast";
import { Tooltip } from "components/tooltip";
import { useClaimWithdraw } from "hooks/useClaimWithdraw";
import { TrashIcon } from "pages/earn/icons/trashIcon";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAccount } from "wagmi";

import type { ExitTicket } from "../../types";

import { DeleteTicketModal } from "./deleteTicketModal";
import { getTicketStatus } from "./getTicketStatus";

type Props = {
  disabled?: boolean;
  onWithdrawingChange?: (isWithdrawing: boolean) => void;
  ticket: ExitTicket;
};

type ToastType = "delete" | "withdraw";

export function ActionsCell({
  disabled = false,
  onWithdrawingChange,
  ticket,
}: Props) {
  const { t } = useTranslation();
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const status = getTicketStatus(ticket);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [toastType, setToastType] = useState<ToastType | null>(null);

  const { mutate: claimWithdraw } = useClaimWithdraw({
    onStatusChange(claimStatus) {
      if (claimStatus === "completed") {
        setIsWithdrawing(false);
        setToastType("withdraw");
        onWithdrawingChange?.(false);
      }
      if (claimStatus === "failed") {
        setIsWithdrawing(false);
        onWithdrawingChange?.(false);
      }
    },
    requestId: BigInt(ticket.requestId),
  });

  if (status === "withdrawn") {
    return null;
  }

  function handleWithdraw() {
    setIsWithdrawing(true);
    onWithdrawingChange?.(true);
    claimWithdraw();
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {status === "ready" &&
          (isConnected ? (
            <Button
              disabled={disabled || isWithdrawing}
              onClick={handleWithdraw}
              size="xSmall"
              variant="primary"
            >
              <span className="invisible">
                {t("pages.earn.exit-tickets.withdrawing")}
              </span>
              <span className="absolute">
                {isWithdrawing
                  ? t("pages.earn.exit-tickets.withdrawing")
                  : t("pages.earn.exit-tickets.withdraw")}
              </span>
            </Button>
          ) : (
            <Button onClick={openConnectModal} size="xSmall" variant="primary">
              {t("pages.swap.form.connect-wallet")}
            </Button>
          ))}
        <Tooltip content={t("pages.earn.exit-tickets.delete-tooltip")}>
          <ButtonIcon
            aria-label={t("pages.earn.exit-tickets.delete-tooltip")}
            disabled={disabled || isWithdrawing}
            onClick={() => setIsModalOpen(true)}
            size="xSmall"
            variant="secondary"
          >
            <TrashIcon />
          </ButtonIcon>
        </Tooltip>
      </div>
      {isModalOpen && (
        <DeleteTicketModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => setToastType("delete")}
          ticket={ticket}
        />
      )}
      {toastType === "delete" && (
        <Toast
          closable
          description={t("pages.earn.exit-tickets.delete-toast-description")}
          onClose={() => setToastType(null)}
          title={t("pages.earn.exit-tickets.delete-toast-title")}
        />
      )}
      {toastType === "withdraw" && (
        <Toast
          closable
          description={t("pages.earn.exit-tickets.withdraw-toast-description")}
          onClose={() => setToastType(null)}
          title={t("pages.earn.exit-tickets.withdraw-toast-title")}
        />
      )}
    </>
  );
}
