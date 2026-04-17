import { gatewayAddresses } from "@vetro-protocol/gateway";
import { usePeggedToken } from "hooks/usePeggedToken";
import { useTranslation } from "react-i18next";
import { formatAmount } from "utils/token";

import type { ExitTicket } from "../../types";

type Props = {
  ticket: ExitTicket;
};

export function WithdrawalCell({ ticket }: Props) {
  const { t } = useTranslation();
  // TODO using the only gateway to simplify this PR
  // we will handle multiple gateways in the next PR
  const { data: peggedToken } = usePeggedToken(gatewayAddresses[0]);
  const amount = formatAmount({
    amount: BigInt(ticket.assets),
    decimals: peggedToken?.decimals ?? 18,
    isError: false,
  });

  return (
    <span className="text-xsm font-medium text-gray-900">
      {t("pages.earn.exit-tickets.withdrawal-amount", { amount })}
    </span>
  );
}
