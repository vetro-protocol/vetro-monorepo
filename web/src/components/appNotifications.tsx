import { Badge } from "components/base/badge";
import { Button } from "components/base/button";
import { ChevronIcon } from "components/base/chevronIcon";
import { type StackItem, Stack } from "components/base/stack";
import { useAtRiskPositions } from "hooks/borrow/useAtRiskPositions";
import { useCountdown } from "hooks/useCountdown";
import { useGetRedeemRequest } from "hooks/useGetRedeemRequest";
import { useVusd } from "hooks/useVusd";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { formatAmount } from "utils/token";

function useLiquidationItems(): StackItem[] {
  const { data: positions = [] } = useAtRiskPositions();
  const { lang } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return positions.map((p) => ({
    content: (
      <div className="mx-auto w-fit *:w-2xs *:border-2 *:border-rose-500">
        <Button
          onClick={() => navigate(`/${lang}/borrow`)}
          size="xLarge"
          type="button"
          variant="danger"
        >
          <Badge variant="red">
            {p.collateralSymbol} / {p.loanSymbol}
          </Badge>
          {t("pages.borrow.position-at-risk")}
        </Button>
      </div>
    ),
    id: p.marketId,
  }));
}

function useRedeemItem(): StackItem | undefined {
  const { data: redeemRequest } = useGetRedeemRequest();
  const { data: vusd } = useVusd();
  const { lang } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const amountLocked = redeemRequest?.[0] ?? 0n;
  const claimableAt = redeemRequest?.[1] ?? 0n;
  const remainingSeconds = useCountdown(claimableAt);

  if (amountLocked === 0n || remainingSeconds > 0) {
    return undefined;
  }

  const formattedAmount = formatAmount({
    amount: amountLocked,
    decimals: vusd.decimals,
    isError: false,
    symbol: vusd.symbol,
  });

  function handleClick() {
    const el = document.getElementById("redeem-vault");
    if (el) {
      // if we're already on the swap page, scroll to the redeem vault section
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`/${lang}/swap#redeem-vault`);
    }
  }

  return {
    content: (
      <div className="mx-auto w-fit *:w-2xs *:border-2 *:border-blue-500">
        <Button
          onClick={handleClick}
          size="xLarge"
          type="button"
          variant="primary"
        >
          <Badge variant="blue">{formattedAmount}</Badge>
          {t("pages.swap.redeem-vault.ready-to-redeem")}
          <ChevronIcon direction="right" />
        </Button>
      </div>
    ),
    id: "redeem-ready",
  };
}

export function AppNotifications() {
  const liquidationItems = useLiquidationItems();
  const redeemItem = useRedeemItem();

  const items = redeemItem
    ? [...liquidationItems, redeemItem]
    : liquidationItems;

  if (items.length === 0) {
    return null;
  }

  return <Stack items={items} position="bottom-center" />;
}
