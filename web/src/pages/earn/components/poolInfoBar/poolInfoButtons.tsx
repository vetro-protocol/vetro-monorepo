import { Button } from "components/base/button";
import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { Toast } from "components/base/toast";
import { useStakeMode } from "hooks/useStakeMode";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

const StakeDrawerContent = lazy(() =>
  import("../stakeDrawer/stakeDrawerContent").then((mod) => ({
    default: mod.StakeDrawerContent,
  })),
);

type ToastData = {
  description: string;
  title: string;
};

export function PoolInfoButtons() {
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mode, setMode] = useStakeMode();
  const [toast, setToast] = useState<ToastData | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Auto-open drawer when mode is in URL
  useEffect(
    function openDrawerFromUrl() {
      if (mode && !isDrawerOpen) {
        setIsDrawerOpen(true);
      }
    },
    [mode, isDrawerOpen],
  );

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

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

  const handleSuccess = useCallback(function handleSuccess(
    toastData: ToastData,
  ) {
    setToast(toastData);
    closeTimerRef.current = setTimeout(function closeDrawerAfterDelay() {
      setMode(null);
      setIsDrawerOpen(false);
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

      {isDrawerOpen && mode && (
        <Drawer onClose={handleClose}>
          <Suspense fallback={<DrawerLoader />}>
            <StakeDrawerContent
              mode={mode}
              onModeChange={setMode}
              onSuccess={handleSuccess}
            />
          </Suspense>
        </Drawer>
      )}

      {toast && (
        <Toast
          description={toast.description}
          onClose={handleToastClose}
          title={toast.title}
        />
      )}
    </>
  );
}
