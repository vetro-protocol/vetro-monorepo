import { Button } from "components/base/button";
import { useTranslation } from "react-i18next";

export function PoolInfoButtons() {
  const { t } = useTranslation();

  // TODO: Implement actual deposit and withdraw drawers and link them to these buttons
  return (
    <div className="flex w-full gap-3 *:flex-1 md:w-auto md:*:flex-initial">
      <Button size="xSmall" variant="primary">
        {t("pages.earn.poolInfo.deposit")}
      </Button>
      <Button size="xSmall" variant="secondary">
        {t("pages.earn.poolInfo.withdraw")}
      </Button>
    </div>
  );
}
