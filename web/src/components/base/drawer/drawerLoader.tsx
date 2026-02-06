import { Spinner } from "../spinner";

import { Drawer } from ".";

type Props = {
  onAnimated?: VoidFunction;
  onClose: VoidFunction;
};

export const DrawerLoader = (props: Props) => (
  <Drawer {...props}>
    <div className="flex size-full items-center justify-center">
      <Spinner size="xLarge" />
    </div>
  </Drawer>
);
