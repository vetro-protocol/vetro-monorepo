import { Badge } from "components/base/badge";
import { Button } from "components/base/button";
import { ChevronIcon } from "components/base/chevronIcon";
import { useCountdown } from "hooks/useCountdown";
import { useGetRedeemRequest } from "hooks/useGetRedeemRequest";
import { useVusd } from "hooks/useVusd";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { formatAmount } from "utils/token";

export function RedeemReadyNotification() {
  const { data: redeemRequest } = useGetRedeemRequest();
  const { data: vusd } = useVusd();
  const { lang } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const amountLocked = redeemRequest?.[0] ?? 0n;
  const claimableAt = redeemRequest?.[1] ?? 0n;
  const remainingSeconds = useCountdown(claimableAt);

  if (amountLocked === 0n || remainingSeconds > 0) {
    return null;
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
      navigate(`/${lang}/swap?mode=redeem#redeem-vault`);
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center">
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
  );
}
