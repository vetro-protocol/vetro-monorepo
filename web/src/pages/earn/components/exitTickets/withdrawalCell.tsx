import { DisplayAmount } from "components/base/displayAmount";
import { QueryResult } from "components/base/queryResult";
import { TokenLogo } from "components/tokenLogo";
import { useVaultPeggedToken } from "hooks/useVaultPeggedToken";
import Skeleton from "react-loading-skeleton";

import type { ExitTicket } from "../../types";

type Props = {
  ticket: ExitTicket;
};

export function WithdrawalCell({ ticket }: Props) {
  const peggedTokenQuery = useVaultPeggedToken(ticket.stakingVaultAddress);

  return (
    <QueryResult
      data={(token) => (
        <div className="text-xsm flex items-center gap-x-2 font-medium text-gray-900">
          <TokenLogo size="small" {...token} />
          <DisplayAmount amount={BigInt(ticket.assets)} token={token} />
        </div>
      )}
      error={<span className="text-xsm font-medium text-gray-900">-</span>}
      loading={<Skeleton width={100} />}
      query={peggedTokenQuery}
    />
  );
}
