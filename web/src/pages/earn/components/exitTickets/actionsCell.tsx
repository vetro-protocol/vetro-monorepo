import { Button, ButtonIcon } from "components/base/button";
import { TrashIcon } from "pages/earn/icons/trashIcon";
import { useTranslation } from "react-i18next";

import type { ExitTicket } from "../../types";

import { getTicketStatus } from "./getTicketStatus";

type Props = {
  ticket: ExitTicket;
};

export function ActionsCell({ ticket }: Props) {
  const { t } = useTranslation();
  const status = getTicketStatus(ticket);

  if (status === "withdrawn") {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      {status === "ready" && (
        <Button size="xSmall" variant="primary">
          {t("pages.earn.exit-tickets.withdraw")}
        </Button>
      )}
      <ButtonIcon size="xSmall" variant="secondary">
        <TrashIcon />
      </ButtonIcon>
    </div>
  );
}
