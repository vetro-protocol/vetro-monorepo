import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Button } from "components/base/button";
import { StatusMessage } from "components/base/statusMessage";
import { TableState } from "components/base/table/tableState";
import { InboxCircleIcon } from "components/icons/inboxCircleIcon";
import { WarningCircleIcon } from "components/icons/warningCircleIcon";
import { useTranslation } from "react-i18next";

type StateTexts = {
  description: string;
  title: string;
};

export function DisconnectedState({ description, title }: StateTexts) {
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
        description={description}
        icon={<InboxCircleIcon />}
        title={title}
      />
    </TableState>
  );
}

export const EmptyState = ({ description, title }: StateTexts) => (
  <TableState>
    <StatusMessage
      description={description}
      icon={<InboxCircleIcon />}
      title={title}
    />
  </TableState>
);

export function ErrorState({
  description,
  onRetry,
  title,
}: StateTexts & { onRetry: VoidFunction }) {
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
        description={description}
        icon={<WarningCircleIcon />}
        title={title}
      />
    </TableState>
  );
}
