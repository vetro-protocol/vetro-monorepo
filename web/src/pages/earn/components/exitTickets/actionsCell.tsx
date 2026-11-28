import { ButtonIcon } from "components/base/button";
import { Toast } from "components/base/toast";
import { GeoRestrictedButton } from "components/geoRestrictedButton";
import { TrashIcon } from "components/icons/trashIcon";
import { RequireWalletConnected } from "components/requireWalletConnected";
import { Tooltip } from "components/tooltip";
import { useActivityTracking } from "hooks/useActivityTracking";
import { useClaimWithdraw } from "hooks/useClaimWithdraw";
import { useNowTickingPast } from "hooks/useNowTickingPast";
import { useVaultPeggedToken } from "hooks/useVaultPeggedToken";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import { isGeoRestricted } from "utils/geoRestriction";
import { formatAmount } from "utils/token";

import type { ExitTicket } from "../../types";

import { DeleteTicketModal } from "./deleteTicketModal";
import { getTicketStatus } from "./getTicketStatus";

type ActivityTextParams = {
  peggedToken: TokenWithGateway | undefined;
  t: ReturnType<typeof useTranslation>["t"];
  ticket: ExitTicket;
};

type ActionDisabledParams = {
  disabled: boolean;
  peggedToken: TokenWithGateway | undefined;
};

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

const isActionDisabled = ({ disabled, peggedToken }: ActionDisabledParams) =>
  disabled || !peggedToken;

const getActivityText = ({ peggedToken, t, ticket }: ActivityTextParams) =>
  peggedToken
    ? t("pages.earn.activity.claim-withdraw-text", {
        amount: formatAmount({
          amount: BigInt(ticket.assets),
          decimals: peggedToken.decimals,
          isError: false,
        }),
        symbol: peggedToken.symbol,
      })
    : "";

function WithdrawButton({
  disabled,
  isWithdrawing,
  onWithdraw,
}: WithdrawButtonProps) {
  const { t } = useTranslation();

  return (
    <RequireWalletConnected size="xSmall">
      <GeoRestrictedButton
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
      </GeoRestrictedButton>
    </RequireWalletConnected>
  );
}

export function ActionsCell({
  disabled = false,
  onDeleteSuccess,
  onWithdrawingChange,
  ticket,
}: Props) {
  const { t } = useTranslation();
  const geoRestricted = isGeoRestricted();

  const { data: peggedToken } = useVaultPeggedToken(ticket.stakingVaultAddress);
  const now = useNowTickingPast([ticket], () =>
    ticket.cancelTxHash || ticket.claimTxHash
      ? undefined
      : Number(ticket.claimableAt),
  );
  const status = getTicketStatus({ now, ticket });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWithdrawToast, setShowWithdrawToast] = useState(false);

  const activityText = getActivityText({ peggedToken, t, ticket });

  const { onCompleted, onFailed, onPending, onTransactionHash } =
    useActivityTracking({
      page: "earn",
      text: activityText,
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
              disabled={isActionDisabled({
                disabled,
                peggedToken,
              })}
              isWithdrawing={isWithdrawing}
              onWithdraw={handleWithdraw}
            />
          )}
          <Tooltip
            content={
              geoRestricted
                ? t("common.geo-restriction-title")
                : t("pages.earn.exit-tickets.delete-tooltip")
            }
          >
            <ButtonIcon
              aria-label={t("pages.earn.exit-tickets.delete-tooltip")}
              disabled={
                isActionDisabled({ disabled, peggedToken }) ||
                isWithdrawing ||
                geoRestricted
              }
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
          description={t("pages.earn.exit-tickets.withdraw-toast-description")}
          onClose={() => setShowWithdrawToast(false)}
          title={t("pages.earn.exit-tickets.withdraw-toast-title")}
        />
      )}
    </>
  );
}
