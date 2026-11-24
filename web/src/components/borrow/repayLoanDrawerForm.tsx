import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import type { ToastContent } from "components/base/toast";
import type { MarketData } from "hooks/borrow/useMarketData";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { lazyWithReload } from "utils/lazyWithReload";

const RepayLoanForm = lazyWithReload(() =>
  import("./repayLoanForm").then((m) => ({
    default: m.RepayLoanForm,
  })),
);

type Props = {
  market: MarketData;
  onClose: VoidFunction;
  onSuccess: (toast: ToastContent) => void;
};

export function RepayLoanDrawerForm({ market, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  return (
    <Drawer
      onClose={onClose}
      title={t("pages.borrow.repay-loan-progress.title")}
    >
      <div className="flex h-full flex-col">
        <Suspense fallback={<DrawerLoader />}>
          <RepayLoanForm
            market={market}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        </Suspense>
      </div>
    </Drawer>
  );
}
