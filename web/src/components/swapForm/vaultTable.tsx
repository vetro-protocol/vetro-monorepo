import { Badge } from "components/base/badge";
import { Button, ButtonIcon } from "components/base/button";
import { StatusBadge } from "components/base/statusBadge";
import { Header } from "components/base/table/header";
import { TokenLogo } from "components/tokenLogo";
import { Tooltip } from "components/tooltip";
import { useCountdown } from "hooks/useCountdown";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { formatCountdown } from "utils/countdown";
import { formatAmount } from "utils/token";

type Props = {
  amountLocked: bigint;
  claimableAt: bigint;
  onCancelRedeem: () => void;
  onRedeem: () => void;
  vusd: Token;
};

export function VaultTable({
  amountLocked,
  claimableAt,
  onCancelRedeem,
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
      <div className="flex items-center justify-end gap-3 bg-white px-16 py-4">
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
        <Tooltip content={t("pages.swap.redeem-vault.cancel-redeem")}>
          <ButtonIcon onClick={onCancelRedeem} variant="secondary">
            <svg
              fill="none"
              height="16"
              viewBox="0 0 16 16"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.28 4.28a.75.75 0 0 1 1.06 0L8 6.94l2.66-2.66a.75.75 0 1 1 1.06 1.06L9.06 8l2.66 2.66a.75.75 0 1 1-1.06 1.06L8 9.06l-2.66 2.66a.75.75 0 0 1-1.06-1.06L6.94 8 4.28 5.34a.75.75 0 0 1 0-1.06Z"
                fill="currentColor"
              />
            </svg>
          </ButtonIcon>
        </Tooltip>
      </div>
    </div>
  );
}
