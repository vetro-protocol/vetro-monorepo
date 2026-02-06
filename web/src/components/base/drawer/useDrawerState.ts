import { useState } from "react";

export function useDrawerState() {
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const onOpen = function () {
    setHasAnimated(false);
    setIsDrawerOpen(true);
  };

  return {
    // When hasAnimated is true, the drawer is already visible and animated,
    // so any content swap (e.g., lazy loading) should skip re-animating.
    hasAnimated,
    isDrawerOpen,
    onAnimated: () => setHasAnimated(true),
    onClose: () => setIsDrawerOpen(false),
    onOpen,
  };
}
