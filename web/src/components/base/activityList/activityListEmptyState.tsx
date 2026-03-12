import { Button } from "components/base/button";
import { useWalletDrawer } from "components/walletDrawer/walletDrawerContext";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { ActivityEmptyIcon } from "./icons/activityEmptyIcon";

type Props = {
  onResetFilters: VoidFunction;
};

export function ActivityListEmptyState({ onResetFilters }: Props) {
  const { lang } = useParams();
  const navigate = useNavigate();
  const { close } = useWalletDrawer();
  const { t } = useTranslation();

  function handleStartSwapping() {
    close();
    navigate(`/${lang}/swap`);
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <div className="flex w-60 flex-col items-center gap-3">
        <ActivityEmptyIcon />
        <div className="flex flex-col items-center gap-0.5 text-center">
          <p className="text-xsm font-semibold text-gray-900">
            {t("pages.wallet.activity-empty-title")}
          </p>
          <p className="text-xsm text-gray-500">
            {t("pages.wallet.activity-empty-description")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={handleStartSwapping} size="small" type="button">
          {t("pages.wallet.activity-empty-start-swapping")}
        </Button>
        <Button
          onClick={onResetFilters}
          size="small"
          type="button"
          variant="tertiary"
        >
          {t("pages.wallet.activity-empty-reset-filters")}
        </Button>
      </div>
    </div>
  );
}
