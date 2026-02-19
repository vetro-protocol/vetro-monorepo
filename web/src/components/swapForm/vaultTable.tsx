import { Badge } from "components/base/badge";
import { Button } from "components/base/button";
import { StatusBadge } from "components/base/statusBadge";
import { Header } from "components/base/table/header";
import { TokenLogo } from "components/tokenLogo";
import { useCountdown } from "hooks/useCountdown";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { formatCountdown } from "utils/countdown";
import { formatAmount } from "utils/token";

type Props = {
  amountLocked: bigint;
  claimableAt: bigint;
  onRedeem: () => void;
  vusd: Token;
};

export function VaultTable({
  amountLocked,
  claimableAt,
  onRedeem,
  vusd,
}: Props) {
  const { t } = useTranslation();
  const remainingSeconds = useCountdown(claimableAt);
  const isReady = remainingSeconds === 0;

  return (
    <div className="text-b-medium grid w-full grid-cols-3 border-b border-gray-200">
      {/* Table header */}
      <div className="flex-1 bg-gray-100 pl-16">
        <Header text={t("pages.swap.redeem-vault.redeemable-balance")} />
      </div>
      <div className="flex-1 bg-gray-100">
        <Header text={t("pages.swap.redeem-vault.status")} />
      </div>
      <div className="flex-1 bg-gray-100 pr-16 *:text-right">
        <Header text={t("pages.swap.redeem-vault.action")} />
      </div>
      {/* Data row */}
      <div className="flex items-center gap-2 bg-white py-4 md:px-16">
        <TokenLogo {...vusd} />
        <span className="text-gray-900">
          {formatAmount({
            amount: amountLocked,
            decimals: vusd.decimals,
            isError: false,
          })}{" "}
          {vusd.symbol}
        </span>
      </div>
      <div className="flex items-center bg-white py-4">
        {isReady ? (
          <StatusBadge variant="ready">
            {t("pages.swap.redeem-vault.ready-to-redeem")}
          </StatusBadge>
        ) : (
          <StatusBadge variant="cooldown">
            {t("pages.swap.redeem-vault.cooldown-in-progress")}
          </StatusBadge>
        )}
      </div>
      <div className="flex items-center justify-end bg-white px-16 py-4">
        <Button
          disabled={!isReady}
          onClick={onRedeem}
          size="xSmall"
          variant="primary"
        >
          {t("pages.swap.redeem-vault.redeem")}
          {!isReady && (
            <span className="w-22.5 *:w-full">
              <Badge variant="blue">
                {t("pages.swap.redeem-vault.ready-on", {
                  time: formatCountdown(remainingSeconds),
                })}
              </Badge>
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
