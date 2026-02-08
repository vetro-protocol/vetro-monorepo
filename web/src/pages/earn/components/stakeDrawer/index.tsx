import { Drawer } from "components/base/drawer";

import { StakeDrawerContent } from "./stakeDrawerContent";
import type { StakeMode } from "./types";

type Props = {
  hasAnimated: boolean;
  initialMode: StakeMode;
  onAnimated: VoidFunction;
  onClose: VoidFunction;
  onModeChange: (mode: StakeMode) => void;
};

export default function StakeDrawer({
  hasAnimated,
  initialMode,
  onAnimated,
  onClose,
  onModeChange,
}: Props) {
  return (
    <Drawer hasAnimated={hasAnimated} onAnimated={onAnimated} onClose={onClose}>
      <StakeDrawerContent
        initialMode={initialMode}
        onClose={onClose}
        onModeChange={onModeChange}
      />
    </Drawer>
  );
}
