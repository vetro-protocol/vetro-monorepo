import { TokenLogo } from "components/tokenLogo";
import { useVaultPeggedToken } from "hooks/useVaultPeggedToken";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
import { formatAmount } from "utils/token";

import type { ExitTicket } from "../../types";

type Props = {
  ticket: ExitTicket;
};

export function WithdrawalCell({ ticket }: Props) {
  const { t } = useTranslation();
  const { data: peggedToken, isError } = useVaultPeggedToken(
    ticket.stakingVaultAddress,
  );

  if (peggedToken) {
    return (
      <span className="text-xsm flex items-center gap-x-2 font-medium text-gray-900">
        <TokenLogo size="small" {...peggedToken} />
        {t("pages.earn.exit-tickets.withdrawal-amount", {
          amount: formatAmount({
            amount: BigInt(ticket.assets),
            decimals: peggedToken.decimals,
            isError: false,
          }),
          symbol: peggedToken.symbol,
        })}
      </span>
    );
  }

  if (isError) {
    return <span className="text-xsm font-medium text-gray-900">-</span>;
  }

  return <Skeleton width={100} />;
}
