import { Button } from "components/base/button";
import { useDrawerState } from "components/base/drawer/useDrawerState";
import { useStakeMode } from "hooks/useStakeMode";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import StakeDrawer from "../stakeDrawer";

export function PoolInfoButtons() {
  const { t } = useTranslation();
  const drawerState = useDrawerState();
  const [mode, setMode] = useStakeMode();

  // Auto-open drawer when mode is in URL
  useEffect(
    function openDrawerFromUrl() {
      if (mode && !drawerState.isDrawerOpen) {
        drawerState.onOpen();
      }
    },
    [mode, drawerState.isDrawerOpen],
  );

  function handleOpenDeposit() {
    setMode("deposit");
  }

  function handleOpenWithdraw() {
    setMode("withdraw");
  }

  function handleClose() {
    setMode(null);
    drawerState.onClose();
  }

  return (
    <>
      <div className="flex w-full gap-3 *:flex-1 md:w-auto md:*:flex-initial">
        <Button onClick={handleOpenDeposit} size="xSmall" variant="primary">
          {t("pages.earn.poolInfo.deposit")}
        </Button>
        <Button onClick={handleOpenWithdraw} size="xSmall" variant="secondary">
          {t("pages.earn.poolInfo.withdraw")}
        </Button>
      </div>

      {drawerState.isDrawerOpen && mode && (
        <StakeDrawer
          hasAnimated={drawerState.hasAnimated}
          initialMode={mode}
          onAnimated={drawerState.onAnimated}
          onClose={handleClose}
          onModeChange={setMode}
        />
      )}
    </>
  );
}
