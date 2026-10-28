import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import type { ToastContent } from "components/base/toast";
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
  onSuccess: (toast: ToastContent) => void;
};

export function BorrowMoreDrawerForm({ market, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  return (
    <Drawer onClose={onClose} title={t("pages.borrow.borrow-more")}>
      <div className="flex h-full flex-col">
        <Suspense fallback={<DrawerLoader />}>
          <BorrowMoreForm
            market={market}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        </Suspense>
      </div>
    </Drawer>
  );
}
