import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Button, ButtonIcon } from "components/base/button";
import { Toast } from "components/base/toast";
import { Tooltip } from "components/tooltip";
import { useActivityTracking } from "hooks/useActivityTracking";
import { useClaimWithdraw } from "hooks/useClaimWithdraw";
import { useVaultPeggedToken } from "hooks/useVaultPeggedToken";
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
  onWithdraw: VoidFunction;
};

function WithdrawButton({
  disabled,
  isWithdrawing,

  onWithdraw,
}: WithdrawButtonProps) {
  const { openConnectModal } = useConnectModal();
  const { t } = useTranslation();
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <Button onClick={openConnectModal} size="xSmall" variant="primary">
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

  const { data: peggedToken } = useVaultPeggedToken(ticket.stakingVaultAddress);
  const status = getTicketStatus(ticket);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWithdrawToast, setShowWithdrawToast] = useState(false);

  const formattedAmount = formatAmount({
    amount: BigInt(ticket.assets),
    decimals: peggedToken?.decimals ?? 18,
    isError: false,
  });

  const { onCompleted, onFailed, onPending, onTransactionHash } =
    useActivityTracking({
      page: "earn",
      text: t("pages.earn.activity.claim-withdraw-text", {
        amount: formattedAmount,
        symbol: peggedToken?.symbol,
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
    stakingVaultAddress: ticket.stakingVaultAddress,
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
      {isModalOpen && peggedToken && (
        <DeleteTicketModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={onDeleteSuccess}
          peggedToken={peggedToken}
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
