import { Button } from "components/base/button";
import { StatusMessage } from "components/base/statusMessage";
import { TableState } from "components/base/table/tableState";
import { FunnelCircleIcon } from "components/icons/funnelCircleIcon";
import { InboxCircleIcon } from "components/icons/inboxCircleIcon";
import { WarningCircleIcon } from "components/icons/warningCircleIcon";
import { useTranslation } from "react-i18next";

export function EmptyState() {
  const { t } = useTranslation();
  return (
    <TableState>
      <StatusMessage
        description={t("pages.liquidity.empty-description")}
        icon={<InboxCircleIcon />}
        title={t("pages.liquidity.empty-title")}
      />
    </TableState>
  );
}

type NoMatchStateProps = {
  onShowAll: VoidFunction;
};

export function NoMatchState({ onShowAll }: NoMatchStateProps) {
  const { t } = useTranslation();
  return (
    <TableState>
      <StatusMessage
        action={
          <Button
            onClick={onShowAll}
            size="xSmall"
            type="button"
            variant="secondary"
          >
            {t("pages.liquidity.show-all-pools")}
          </Button>
        }
        description={t("pages.liquidity.no-match-description")}
        icon={<FunnelCircleIcon />}
        title={t("pages.liquidity.no-match-title")}
      />
    </TableState>
  );
}

type ErrorStateProps = {
  isRetrying: boolean;
  onRetry: VoidFunction;
};

export function ErrorState({ isRetrying, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <TableState>
      <StatusMessage
        action={
          <Button
            disabled={isRetrying}
            onClick={onRetry}
            size="xSmall"
            type="button"
            variant="secondary"
          >
            {t("pages.liquidity.try-again")}
          </Button>
        }
        description={t("pages.liquidity.error-description")}
        icon={<WarningCircleIcon />}
        title={t("pages.liquidity.error-title")}
      />
    </TableState>
  );
}
