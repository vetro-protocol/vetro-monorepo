import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Button, ButtonIcon } from "components/base/button";
import { Toast } from "components/base/toast";
import { Tooltip } from "components/tooltip";
import { useActivityTracking } from "hooks/useActivityTracking";
import { useClaimWithdraw } from "hooks/useClaimWithdraw";
import { useVusd } from "hooks/useVusd";
import { TrashIcon } from "pages/earn/icons/trashIcon";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatAmount } from "utils/token";
import { useAccount } from "wagmi";

import type { ExitTicket } from "../../types";

import { DeleteTicketModal } from "./deleteTicketModal";
import { getTicketStatus } from "./getTicketStatus";

type Props = {
  disabled?: boolean;
  onDeleteSuccess?: VoidFunction;
  onWithdrawingChange?: (isWithdrawing: boolean) => void;
  ticket: ExitTicket;
};

type WithdrawButtonProps = {
  disabled: boolean;
  isWithdrawing: boolean;
  onConnectWallet: VoidFunction | undefined;
  onWithdraw: VoidFunction;
};

function WithdrawButton({
  disabled,
  isWithdrawing,
  onConnectWallet,
  onWithdraw,
}: WithdrawButtonProps) {
  const { t } = useTranslation();
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <Button onClick={onConnectWallet} size="xSmall" variant="primary">
        {t("pages.swap.form.connect-wallet")}
      </Button>
    );
  }

  return (
    <Button
      disabled={disabled || isWithdrawing}
      onClick={onWithdraw}
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
  );
}

export function ActionsCell({
  disabled = false,
  onDeleteSuccess,
  onWithdrawingChange,
  ticket,
}: Props) {
  const { t } = useTranslation();
  const { openConnectModal } = useConnectModal();
  const { data: vusd } = useVusd();
  const status = getTicketStatus(ticket);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWithdrawToast, setShowWithdrawToast] = useState(false);

  const formattedAmount = formatAmount({
    amount: BigInt(ticket.assets),
    decimals: vusd?.decimals ?? 18,
    isError: false,
  });

  const { onCompleted, onFailed, onPending, onTransactionHash } =
    useActivityTracking({
      page: "earn",
      text: t("pages.earn.activity.claim-withdraw-text", {
        amount: formattedAmount,
        symbol: vusd?.symbol,
      }),
      title: `${t("nav.earn")} · ${t("pages.earn.exit-tickets.withdraw")}`,
    });

  const { mutate: claimWithdraw } = useClaimWithdraw({
    onStatusChange(claimStatus) {
      const handlers: Partial<Record<typeof claimStatus, () => void>> = {
        claiming: onPending,
        completed() {
          onCompleted();
          setIsWithdrawing(false);
          setShowWithdrawToast(true);
          onWithdrawingChange?.(false);
        },
        failed() {
          onFailed();
          setIsWithdrawing(false);
          onWithdrawingChange?.(false);
        },
      };
      handlers[claimStatus]?.();
    },
    onTransactionHash,
    requestId: BigInt(ticket.requestId),
  });

  function handleWithdraw() {
    setIsWithdrawing(true);
    onWithdrawingChange?.(true);
    claimWithdraw();
  }

  return (
    <>
      {status !== "withdrawn" && (
        <div className="flex items-center gap-3">
          {status === "ready" && (
            <WithdrawButton
              disabled={disabled}
              isWithdrawing={isWithdrawing}
              onConnectWallet={openConnectModal}
              onWithdraw={handleWithdraw}
            />
          )}
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
      )}
      {isModalOpen && (
        <DeleteTicketModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={onDeleteSuccess}
          ticket={ticket}
        />
      )}
      {showWithdrawToast && (
        <Toast
          closable
          description={t("pages.earn.exit-tickets.withdraw-toast-description")}
          onClose={() => setShowWithdrawToast(false)}
          title={t("pages.earn.exit-tickets.withdraw-toast-title")}
        />
      )}
    </>
  );
}
