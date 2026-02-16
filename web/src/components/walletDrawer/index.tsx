import { Drawer } from "components/base/drawer";
import { DrawerLoader } from "components/base/drawer/drawerLoader";
import { Suspense, lazy } from "react";

const WalletDrawerContent = lazy(() =>
  import("./walletDrawerContent").then((m) => ({
    default: m.WalletDrawerContent,
  })),
);

type Props = {
  onClose: VoidFunction;
};

export const WalletDrawer = ({ onClose }: Props) => (
  <Drawer onClose={onClose}>
    <Suspense fallback={<DrawerLoader />}>
      <WalletDrawerContent />
    </Suspense>
  </Drawer>
);
