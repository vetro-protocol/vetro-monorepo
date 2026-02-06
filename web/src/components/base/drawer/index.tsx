import { useOnClickOutside } from "@hemilabs/react-hooks/useOnClickOutside";
import { useOnKeyUp } from "@hemilabs/react-hooks/useOnKeyUp";
import {
  type ReactNode,
  type TransitionEvent,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";

type Props = {
  children: ReactNode;
  hasAnimated?: boolean;
  onAnimated?: VoidFunction;
  onClose: VoidFunction;
};

// Use with useDrawerState hook for proper state management:
// const { hasAnimated, isDrawerOpen, onAnimated, onClose, onOpen } = useDrawerState();
// The hook tracks animation state to allow seamless content swapping during lazy loading.
export function Drawer({
  children,
  hasAnimated = false,
  onAnimated,
  onClose,
}: Props) {
  const [isOpen, setIsOpen] = useState(hasAnimated);

  const handleClose = () => setIsOpen(false);

  const drawerRef = useOnClickOutside<HTMLDivElement>(handleClose);

  useOnKeyUp(function (e) {
    if (e.key === "Escape") {
      handleClose();
    }
  });

  useEffect(
    // Triggers the opening animation by delaying state change to the next frame.
    // This ensures the drawer starts in the closed position (translate-x-full)
    // and then transitions to open (translate-x-0), enabling the CSS transition.
    // When hasAnimated is true, the drawer is already open (e.g., after lazy loading swap),
    // so we skip the animation trigger.
    function openOnMount() {
      if (hasAnimated) {
        return;
      }
      requestAnimationFrame(() => setIsOpen(true));
    },
    [hasAnimated],
  );

  function handleTransitionEnd(e: TransitionEvent) {
    // Ignore bubbled events from child transitions
    if (e.target !== e.currentTarget) {
      return;
    }
    if (isOpen) {
      // Signal animation completed (used for lazy loading content swap)
      onAnimated?.();
    } else {
      // Unmount after slide-out animation completes
      onClose();
    }
  }

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-10 bg-gray-900/10 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
      />
      <div
        className={`fixed inset-y-0 right-0 z-20 w-full rounded-l-lg bg-white shadow-xl transition-transform duration-300 md:w-md ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        onTransitionEnd={handleTransitionEnd}
        ref={drawerRef}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}
