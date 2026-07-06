import { DisplayAmount } from "components/base/displayAmount";
import { TokenLogo } from "components/tokenLogo";
import { useVaultPeggedToken } from "hooks/useVaultPeggedToken";
import Skeleton from "react-loading-skeleton";

import type { ExitTicket } from "../../types";

type Props = {
  ticket: ExitTicket;
};

export function WithdrawalCell({ ticket }: Props) {
  const { data: peggedToken, isError } = useVaultPeggedToken(
    ticket.stakingVaultAddress,
  );

  if (peggedToken) {
    return (
      <div className="text-xsm flex items-center gap-x-2 font-medium text-gray-900">
        <TokenLogo size="small" {...peggedToken} />
        <DisplayAmount amount={BigInt(ticket.assets)} token={peggedToken} />
      </div>
    );
  }

  if (isError) {
    return <span className="text-xsm font-medium text-gray-900">-</span>;
  }

  return <Skeleton width={100} />;
}
