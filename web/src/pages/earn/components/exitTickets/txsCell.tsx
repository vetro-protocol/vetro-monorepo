import { Badge } from "components/base/badge";
import { Tooltip } from "components/tooltip";
import { useTranslation } from "react-i18next";
import { formatEvmHash } from "utils/format";
import type { Hash } from "viem";

import type { ExitTicket } from "../../types";

const ExternalLinkIcon = () => (
  <svg fill="none" height={8} width={8} xmlns="http://www.w3.org/2000/svg">
    <path
      clipRule="evenodd"
      d="M.22 7.78a.75.75 0 0 1 0-1.06L5.44 1.5H1.75a.75.75 0 1 1 0-1.5h5.5A.75.75 0 0 1 8 .75v5.5a.75.75 0 0 1-1.5 0V2.56L1.28 7.78a.75.75 0 0 1-1.06 0Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const TxRow = ({ hash, label }: { hash: Hash; label: string }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-xsm font-medium text-gray-400">{label}</span>
    <a
      className="text-xsm flex items-center gap-1 font-medium text-white [&:hover>svg]:text-white [&>svg]:text-gray-500 [&>svg]:transition-colors"
      href={`https://etherscan.io/tx/${hash}`}
      onClick={(e) => e.stopPropagation()}
      rel="noopener noreferrer"
      target="_blank"
    >
      {formatEvmHash(hash)}
      <ExternalLinkIcon />
    </a>
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
