import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { DrawerTitle } from "components/base/drawer/drawerTitle";
import type { MarketData } from "hooks/borrow/useMarketData";
import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";

const SupplyCollateralForm = lazy(() =>
  import("./supplyCollateralForm").then((m) => ({
    default: m.SupplyCollateralForm,
  })),
);

type Props = {
  market: MarketData;
  onClose: VoidFunction;
};

export function SupplyCollateralDrawerForm({ market, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <Drawer onClose={onClose}>
      <div className="flex h-full flex-col">
        <DrawerTitle>{t("pages.borrow.supply-more-collateral")}</DrawerTitle>
        <Suspense fallback={<DrawerLoader />}>
          <SupplyCollateralForm market={market} onClose={onClose} />
        </Suspense>
      </div>
    </Drawer>
  );
}
