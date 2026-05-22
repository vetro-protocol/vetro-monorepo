import { Badge } from "components/base/badge";
import { ExternalLink } from "components/base/externalLink";
import { ExternalLinkIcon } from "components/icons/externalLinkIcon";
import { Tooltip } from "components/tooltip";
import { useTranslation } from "react-i18next";
import { formatEvmHash } from "utils/format";
import type { Hash } from "viem";

import type { ExitTicket } from "../../types";

const TxRow = ({ hash, label }: { hash: Hash; label: string }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-xsm font-medium text-gray-400">{label}</span>
    <ExternalLink
      className="text-xsm flex items-center gap-1 font-medium text-white [&:hover>svg]:text-white [&>svg]:text-gray-500 [&>svg]:transition-colors"
      href={`https://etherscan.io/tx/${hash}`}
      onClick={(e) => e.stopPropagation()}
    >
      {formatEvmHash(hash)}
      <ExternalLinkIcon />
    </ExternalLink>
  </div>
);

type Props = {
  ticket: ExitTicket;
};

export function TxsCell({ ticket }: Props) {
  const { t } = useTranslation();
  const txCount = ticket.claimTxHash ? 2 : 1;

  const tooltipContent = (
    <div className="flex flex-col gap-0.5">
      <TxRow
        hash={ticket.requestTxHash}
        label={t("pages.earn.exit-tickets.request-withdrawal-tx")}
      />
      {ticket.claimTxHash && (
        <TxRow
          hash={ticket.claimTxHash}
          label={t("pages.earn.exit-tickets.withdrawal-tx")}
        />
      )}
    </div>
  );

  return (
    <Tooltip content={tooltipContent}>
      <Badge>{t("pages.earn.exit-tickets.tx-count", { count: txCount })}</Badge>
    </Tooltip>
  );
}
