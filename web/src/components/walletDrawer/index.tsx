import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { lazyWithReload } from "utils/lazyWithReload";

import { WalletDrawerContext } from "./walletDrawerContext";

const WalletDrawerContent = lazyWithReload(() =>
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
