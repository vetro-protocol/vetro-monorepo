import { Button, ButtonIcon } from "components/base/button";
import { Toast } from "components/base/toast";
import { Tooltip } from "components/tooltip";
import { TrashIcon } from "pages/earn/icons/trashIcon";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { ExitTicket } from "../../types";

import { DeleteTicketModal } from "./deleteTicketModal";
import { getTicketStatus } from "./getTicketStatus";

type Props = {
  ticket: ExitTicket;
};

export function ActionsCell({ ticket }: Props) {
  const { t } = useTranslation();
  const status = getTicketStatus(ticket);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  if (status === "withdrawn") {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {status === "ready" && (
          <Button size="xSmall" variant="primary">
            {t("pages.earn.exit-tickets.withdraw")}
          </Button>
        )}
        <Tooltip content={t("pages.earn.exit-tickets.delete-tooltip")}>
          <ButtonIcon
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
          onSuccess={() => setShowToast(true)}
          ticket={ticket}
        />
      )}
      {showToast && (
        <Toast
          closable
          description={t("pages.earn.exit-tickets.delete-toast-description")}
          onClose={() => setShowToast(false)}
          title={t("pages.earn.exit-tickets.delete-toast-title")}
        />
      )}
    </>
  );
}
