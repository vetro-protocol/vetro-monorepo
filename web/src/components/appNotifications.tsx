import { Badge } from "components/base/badge";
import { Button } from "components/base/button";
import { ChevronIcon } from "components/base/chevronIcon";
import { type StackItem, Stack } from "components/base/stack";
import { useAtRiskPositions } from "hooks/borrow/useAtRiskPositions";
import { useCountdown } from "hooks/useCountdown";
import { useGetRedeemRequests } from "hooks/useGetRedeemRequests";
import { usePeggedTokensByGateway } from "hooks/usePeggedTokensByGateway";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import type { TokenWithGateway } from "types";
import { formatAmount } from "utils/token";

function useLiquidationItems(): StackItem[] {
  const { data: positions = [] } = useAtRiskPositions();
  const { lang } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  function handleClick() {
    const el = document.getElementById("borrow-positions");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`/${lang}/borrow#borrow-positions`);
    }
  }

  return positions.map((p) => ({
    content: (
      <div className="mx-auto w-fit *:w-2xs *:border-2 *:border-rose-500">
        <Button
          onClick={handleClick}
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

function RedeemNotification({
  amountLocked,
  claimableAt,
  peggedToken,
}: {
  amountLocked: bigint;
  claimableAt: bigint;
  peggedToken: TokenWithGateway;
}) {
  const { lang } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const remainingSeconds = useCountdown(claimableAt);

  if (remainingSeconds > 0) {
    return null;
  }

  const formattedAmount = formatAmount({
    amount: amountLocked,
    decimals: peggedToken.decimals,
    isError: false,
    symbol: peggedToken.symbol,
  });

  function handleClick() {
    const el = document.getElementById("redeem-queue");
    if (el) {
      // if we're already on the swap page, scroll to the redeem queue section
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`/${lang}/swap#redeem-queue`);
    }
  }

  return (
    <div className="mx-auto w-fit *:w-2xs *:border-2 *:border-blue-500">
      <Button
        onClick={handleClick}
        size="xLarge"
        type="button"
        variant="primary"
      >
        <Badge variant="blue">{formattedAmount}</Badge>
        {t("pages.swap.redeem-queue.ready-to-redeem")}
        <ChevronIcon direction="right" />
      </Button>
    </div>
  );
}

function useRedeemItems(): StackItem[] {
  const { data: requests } = useGetRedeemRequests();
  const { data: peggedTokensByGateway } = usePeggedTokensByGateway();

  if (!peggedTokensByGateway || !requests) {
    return [];
  }

  return requests
    .filter((r) => peggedTokensByGateway[r.gatewayAddress] !== undefined)
    .map((r) => ({
      content: (
        <RedeemNotification
          amountLocked={r.amountLocked}
          claimableAt={r.claimableAt}
          peggedToken={peggedTokensByGateway[r.gatewayAddress]}
        />
      ),
      id: `redeem-ready-${r.gatewayAddress}`,
    }));
}

export function AppNotifications() {
  const liquidationItems = useLiquidationItems();
  const redeemItems = useRedeemItems();

  const items = [...liquidationItems, ...redeemItems];

  if (items.length === 0) {
    return null;
  }

  return <Stack items={items} position="bottom-center" />;
}
