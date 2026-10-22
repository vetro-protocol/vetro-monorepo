import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { DrawerTitle } from "components/base/drawer/drawerTitle";
import type { MarketData } from "hooks/borrow/useMarketData";
import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";

const WithdrawCollateralForm = lazy(() =>
  import("./withdrawCollateralForm").then((m) => ({
    default: m.WithdrawCollateralForm,
  })),
);

type Props = {
  market: MarketData;
  onClose: VoidFunction;
  onSuccess: (toast: { description: string; title: string }) => void;
};

export function WithdrawCollateralDrawerForm({
  market,
  onClose,
  onSuccess,
}: Props) {
  const { t } = useTranslation();
  return (
    <Drawer onClose={onClose}>
      <div className="flex h-full flex-col">
        <DrawerTitle>{t("pages.borrow.withdraw-collateral")}</DrawerTitle>
        <Suspense fallback={<DrawerLoader />}>
          <WithdrawCollateralForm
            market={market}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        </Suspense>
      </div>
    </Drawer>
  );
}
