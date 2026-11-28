import { Button } from "components/base/button";
import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { StatusMessage } from "components/base/statusMessage";
import type { ToastContent } from "components/base/toast";
import { WarningCircleIcon } from "components/icons/warningCircleIcon";
import type { MarketData } from "hooks/borrow/useMarketData";
import { usePositionInfo } from "hooks/borrow/usePositionInfo";
import { useAmount } from "hooks/useAmount";
import { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { lazyWithReload } from "utils/lazyWithReload";

const BorrowForm = lazyWithReload(() =>
  import("./borrowForm").then((m) => ({
    default: m.BorrowForm,
  })),
);

type Props = {
  market: MarketData;
  onClose: VoidFunction;
  onSuccess: (toast: ToastContent) => void;
};

export function SupplyCollateralAndBorrowDrawerForm({
  market,
  onClose,
  onSuccess,
}: Props) {
  const { t } = useTranslation();
  const [borrowInput, onBorrowChange] = useAmount();
  const [collateralInput, onCollateralChange] = useAmount();
  const [isProgressDrawerOpen, setIsProgressDrawerOpen] = useState(false);
  const {
    data: position,
    isError: isPositionError,
    isPending: isPositionPending,
    refetch: refetchPosition,
  } = usePositionInfo(market.marketId);

  const renderContent = function () {
    if (isPositionPending) {
      return <DrawerLoader />;
    }

    if (isPositionError) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <StatusMessage
            action={
              <Button onClick={() => refetchPosition()} size="xSmall">
                {t("pages.borrow.progress.retry")}
              </Button>
            }
            description={t("pages.server-error.description")}
            icon={<WarningCircleIcon />}
            title={t("pages.server-error.title")}
          />
        </div>
      );
    }

    if (!position) {
      return <DrawerLoader />;
    }

    return (
      <div className="flex-1 overflow-y-auto">
        <Suspense fallback={<DrawerLoader />}>
          <BorrowForm
            borrowInput={borrowInput}
            collateralInput={collateralInput}
            isDrawerOpen={isProgressDrawerOpen}
            market={market}
            onBorrowChange={onBorrowChange}
            onClose={onClose}
            onCollateralChange={onCollateralChange}
            onDrawerOpenChange={setIsProgressDrawerOpen}
            onSuccess={onSuccess}
            position={position}
          />
        </Suspense>
      </div>
    );
  };

  return (
    <Drawer
      onClose={onClose}
      title={t("pages.borrow.supply-collateral-and-borrow")}
    >
      <div className="flex h-full flex-col">{renderContent()}</div>
    </Drawer>
  );
}
