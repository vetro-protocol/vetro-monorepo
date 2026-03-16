import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { DrawerTitle } from "components/base/drawer/drawerTitle";
import type { MarketData } from "hooks/borrow/useMarketData";
import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";

const RepayLoanForm = lazy(() =>
  import("./repayLoanForm").then((m) => ({
    default: m.RepayLoanForm,
  })),
);

type Props = {
  market: MarketData;
  onClose: VoidFunction;
};

export function RepayLoanDrawerForm({ market, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <Drawer onClose={onClose}>
      <div className="flex h-full flex-col">
        <DrawerTitle>{t("pages.borrow.repay-loan-progress.title")}</DrawerTitle>
        <Suspense fallback={<DrawerLoader />}>
          <RepayLoanForm market={market} onClose={onClose} />
        </Suspense>
      </div>
    </Drawer>
  );
}
