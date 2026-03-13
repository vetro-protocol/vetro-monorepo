import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { DrawerTitle } from "components/base/drawer/drawerTitle";
import type { MarketData } from "hooks/borrow/useMarketData";
import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";

const BorrowMoreForm = lazy(() =>
  import("./borrowMoreForm").then((m) => ({
    default: m.BorrowMoreForm,
  })),
);

type Props = {
  market: MarketData;
  onClose: VoidFunction;
};

export function BorrowMoreDrawerForm({ market, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <Drawer onClose={onClose}>
      <div className="flex h-full flex-col">
        <DrawerTitle>{t("pages.borrow.borrow-more")}</DrawerTitle>
        <Suspense fallback={<DrawerLoader />}>
          <BorrowMoreForm market={market} onClose={onClose} />
        </Suspense>
      </div>
    </Drawer>
  );
}
