import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Button } from "components/base/button";
import { Modal } from "components/base/modal";
import { useActivityTracking } from "hooks/useActivityTracking";
import { useCancelWithdraw } from "hooks/useCancelWithdraw";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { formatAmount } from "utils/token";
import { useAccount } from "wagmi";

import type { ExitTicket } from "../../types";

type Props = {
  onClose: VoidFunction;
  onSuccess?: VoidFunction;
  peggedToken: Token;
  ticket: ExitTicket;
};

export function DeleteTicketModal({
  onClose,
  onSuccess,
  peggedToken,
  ticket,
}: Props) {
  const { t } = useTranslation();
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  const [isDeleting, setIsDeleting] = useState(false);

  const formattedAmount = formatAmount({
    amount: BigInt(ticket.assets),
    decimals: peggedToken.decimals,
    isError: false,
  });

  const { onCompleted, onFailed, onPending, onTransactionHash } =
    useActivityTracking({
      page: "earn",
      text: t("pages.earn.activity.cancel-withdraw-text", {
        amount: formattedAmount,
        symbol: peggedToken.symbol,
      }),
      title: `${t("nav.earn")} · ${t("pages.earn.exit-tickets.delete-title")}`,
    });

  const { mutate } = useCancelWithdraw({
    assets: BigInt(ticket.assets),
    onStatusChange(status) {
      const handlers: Partial<Record<typeof status, () => void>> = {
        cancelling() {
          onPending();
          setIsDeleting(true);
        },
        completed() {
          onCompleted();
          onClose();
          onSuccess?.();
        },
        failed() {
          onFailed();
          setIsDeleting(false);
        },
      };
      handlers[status]?.();
    },
    onTransactionHash,
    requestId: BigInt(ticket.requestId),
    stakingVaultAddress: ticket.stakingVaultAddress,
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
