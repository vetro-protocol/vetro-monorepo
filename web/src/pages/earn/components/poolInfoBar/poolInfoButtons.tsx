import { Button } from "components/base/button";
import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { useStakeMode } from "hooks/useStakeMode";
import { lazy, Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const StakeDrawerContent = lazy(() =>
  import("../stakeDrawer/stakeDrawerContent").then((mod) => ({
    default: mod.StakeDrawerContent,
  })),
);

export function PoolInfoButtons() {
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mode, setMode] = useStakeMode();

  // Auto-open drawer when mode is in URL
  useEffect(
    function openDrawerFromUrl() {
      if (mode && !isDrawerOpen) {
        setIsDrawerOpen(true);
      }
    },
    [mode, isDrawerOpen],
  );

  function handleOpenDeposit() {
    setMode("deposit");
  }

  function handleOpenWithdraw() {
    setMode("withdraw");
  }

  function handleClose() {
    setMode(null);
    setIsDrawerOpen(false);
  }

  return (
    <>
      <div className="flex w-full gap-3 *:flex-1 md:w-auto md:*:flex-initial">
        <Button onClick={handleOpenDeposit} size="xSmall" variant="primary">
          {t("pages.earn.pool-info.deposit")}
        </Button>
        <Button onClick={handleOpenWithdraw} size="xSmall" variant="secondary">
          {t("pages.earn.pool-info.withdraw")}
        </Button>
      </div>

      {isDrawerOpen && mode && (
        <Drawer onClose={handleClose}>
          <Suspense fallback={<DrawerLoader />}>
            <StakeDrawerContent
              mode={mode}
              onClose={handleClose}
              onModeChange={setMode}
            />
          </Suspense>
        </Drawer>
      )}
    </>
  );
}
