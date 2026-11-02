import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { Suspense, lazy, useState } from "react";
import { useTranslation } from "react-i18next";

import { WalletDrawerContext } from "./walletDrawerContext";

const WalletDrawerContent = lazy(() =>
  import("./walletDrawerContent").then((m) => ({
    default: m.WalletDrawerContent,
  })),
);

type Props = {
  onClose: VoidFunction;
};

export function WalletDrawer({ onClose }: Props) {
  const [requestClose, setRequestClose] = useState(false);
  const { t } = useTranslation();

  function close() {
    setRequestClose(true);
  }

  return (
    <WalletDrawerContext.Provider value={{ close }}>
      <Drawer
        ariaLabel={t("pages.wallet.title")}
        onClose={onClose}
        requestClose={requestClose}
      >
        <Suspense fallback={<DrawerLoader />}>
          <WalletDrawerContent />
        </Suspense>
      </Drawer>
    </WalletDrawerContext.Provider>
  );
}
