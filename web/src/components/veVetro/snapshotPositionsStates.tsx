import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Button } from "components/base/button";
import { StatusMessage } from "components/base/statusMessage";
import { TableState } from "components/base/table/tableState";
import { InboxCircleIcon } from "components/icons/inboxCircleIcon";
import { WarningCircleIcon } from "components/icons/warningCircleIcon";
import { useTranslation } from "react-i18next";

export function DisconnectedState() {
  const { openConnectModal } = useConnectModal();
  const { t } = useTranslation();

  return (
    <TableState>
      <StatusMessage
        action={
          <Button
            onClick={() => openConnectModal?.()}
            size="xSmall"
            type="button"
          >
            {t("common.connect-wallet")}
          </Button>
        }
        description={t(
          "pages.ve-vetro.claim.positions.disconnected-description",
        )}
        icon={<InboxCircleIcon />}
        title={t("pages.ve-vetro.claim.positions.disconnected-title")}
      />
    </TableState>
  );
}

export function EmptyState() {
  const { t } = useTranslation();

  return (
    <TableState>
      <StatusMessage
        description={t("pages.ve-vetro.claim.positions.empty-description")}
        icon={<InboxCircleIcon />}
        title={t("pages.ve-vetro.claim.positions.empty-title")}
      />
    </TableState>
  );
}

export function ErrorState({ onRetry }: { onRetry: VoidFunction }) {
  const { t } = useTranslation();

  return (
    <TableState>
      <StatusMessage
        action={
          <Button
            onClick={onRetry}
            size="xSmall"
            type="button"
            variant="secondary"
          >
            {t("common.retry")}
          </Button>
        }
        description={t("pages.ve-vetro.claim.positions.error-description")}
        icon={<WarningCircleIcon />}
        title={t("pages.ve-vetro.claim.positions.error-title")}
      />
    </TableState>
  );
}
