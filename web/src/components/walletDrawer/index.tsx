import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { Suspense, lazy, useState } from "react";

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

  function close() {
    setRequestClose(true);
  }

  return (
    <WalletDrawerContext.Provider value={{ close }}>
      <Drawer onClose={onClose} requestClose={requestClose}>
        <Suspense fallback={<DrawerLoader />}>
          <WalletDrawerContent />
        </Suspense>
      </Drawer>
    </WalletDrawerContext.Provider>
  );
}
