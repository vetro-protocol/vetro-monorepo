import { Button } from "components/base/button";
import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { Toast } from "components/base/toast";
import { useStakeMode } from "hooks/useStakeMode";
import { useVaultPeggedToken } from "hooks/useVaultPeggedToken";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { type Address, isAddress, isAddressEqual } from "viem";

import type { StakeMode } from "../stakeDrawer/types";

const StakeDrawerContent = lazy(() =>
  import("../stakeDrawer/stakeDrawerContent").then((mod) => ({
    default: mod.StakeDrawerContent,
  })),
);

type ToastData = {
  description: string;
  title: string;
};

type Props = {
  stakingVaultAddress: Address;
};

export function PoolInfoButtons({ stakingVaultAddress }: Props) {
  const { t } = useTranslation();
  const [{ stake, vault }, setStakeMode] = useStakeMode();
  const [requestCloseDrawer, setRequestCloseDrawer] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { data: peggedToken } = useVaultPeggedToken(stakingVaultAddress);

  const isActive =
    !!vault &&
    isAddress(vault, { strict: false }) &&
    isAddressEqual(vault, stakingVaultAddress);
  const mode = isActive ? stake : null;

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  function handleOpenDeposit() {
    setStakeMode({ stake: "deposit", vault: stakingVaultAddress });
  }

  function handleOpenWithdraw() {
    setStakeMode({ stake: "withdraw", vault: stakingVaultAddress });
  }

  function handleModeChange(nextMode: StakeMode) {
    setStakeMode({ stake: nextMode, vault: stakingVaultAddress });
  }

  function handleClose() {
    setRequestCloseDrawer(false);
    setStakeMode({ stake: null, vault: null });
  }

  const handleSuccess = useCallback(function handleSuccess(
    toastData: ToastData,
  ) {
    setToast(toastData);
    closeTimerRef.current = setTimeout(function closeDrawerAfterDelay() {
      setRequestCloseDrawer(true);
    }, 2000);
  }, []);

  function handleToastClose() {
    setToast(null);
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

      {mode && peggedToken && (
        <Drawer onClose={handleClose} requestClose={requestCloseDrawer}>
          <Suspense fallback={<DrawerLoader />}>
            <StakeDrawerContent
              mode={mode}
              onModeChange={handleModeChange}
              onSuccess={handleSuccess}
              peggedToken={peggedToken}
              stakingVaultAddress={stakingVaultAddress}
            />
          </Suspense>
        </Drawer>
      )}

      {toast && (
        <Toast
          closable={true}
          description={toast.description}
          onClose={handleToastClose}
          title={toast.title}
        />
      )}
    </>
  );
}
