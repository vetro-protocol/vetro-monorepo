import { Badge } from "components/base/badge";
import { Button } from "components/base/button";
import { ChevronIcon } from "components/base/chevronIcon";
import { type StackItem, Stack } from "components/base/stack";
import { useAtRiskPositions } from "hooks/borrow/useAtRiskPositions";
import { useGetRedeemRequests } from "hooks/useGetRedeemRequests";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import type { TokenWithGateway } from "types";
import { unixNowTimestamp } from "utils/date";
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
  peggedToken,
}: {
  amountLocked: bigint;
  peggedToken: TokenWithGateway;
}) {
  const { lang } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
  const [now, setNow] = useState(unixNowTimestamp);

  const nextClaimableAt = requests?.reduce<number | undefined>(
    function findNext(nearest, request) {
      const ts = Number(request.claimableAt);
      if (ts <= now) return nearest;
      if (nearest === undefined || ts < nearest) return ts;
      return nearest;
    },
    undefined,
  );

  useEffect(
    function scheduleNextTick() {
      if (nextClaimableAt === undefined) return undefined;
      const delay = Math.max(0, (nextClaimableAt - unixNowTimestamp()) * 1000);
      const timer = setTimeout(function tick() {
        setNow(unixNowTimestamp());
      }, delay);
      return () => clearTimeout(timer);
    },
    [nextClaimableAt],
  );

  if (!requests) {
    return [];
  }

  return requests
    .filter((r) => Number(r.claimableAt) <= now)
    .map((r) => ({
      content: (
        <RedeemNotification
          amountLocked={r.amountLocked}
          peggedToken={r.peggedToken}
        />
      ),
      id: `redeem-ready-${r.peggedToken.gatewayAddress}`,
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
