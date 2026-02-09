import { Drawer } from "components/base/drawer";

import { StakeDrawerContent } from "./stakeDrawerContent";
import type { StakeMode } from "./types";

type Props = {
  hasAnimated: boolean;
  mode: StakeMode;
  onAnimated: VoidFunction;
  onClose: VoidFunction;
  onModeChange: (mode: StakeMode) => void;
};

export default function StakeDrawer({
  hasAnimated,
  mode,
  onAnimated,
  onClose,
  onModeChange,
}: Props) {
  return (
    <Drawer hasAnimated={hasAnimated} onAnimated={onAnimated} onClose={onClose}>
      <StakeDrawerContent
        mode={mode}
        onClose={onClose}
        onModeChange={onModeChange}
      />
    </Drawer>
  );
}
