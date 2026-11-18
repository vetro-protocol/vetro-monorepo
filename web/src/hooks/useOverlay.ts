import { useOnClickOutside } from "@hemilabs/react-hooks/useOnClickOutside";
import { useOnKeyUp } from "@hemilabs/react-hooks/useOnKeyUp";
import {
  useAccountModal,
  useChainModal,
  useConnectModal,
} from "@rainbow-me/rainbowkit";
import {
  type RefObject,
  type TransitionEvent,
  useEffect,
  useRef,
  useState,
} from "react";

// Overlays (Drawer, Modal, ...) each portal into document.body as siblings, so
// a click inside a modal opened from within a drawer reads as "outside" the
// drawer. Track mounted overlays so only the topmost one dismisses on
// outside-click / Escape — a modal closes without taking the drawer beneath it
// with it.
//
// Registration happens in an effect, so this reflects z-order only because a
// nested overlay is always opened by user interaction (a later commit) than the
// one beneath it — its effect runs after, landing it on top of the stack. React
// runs effects child-before-parent, so this would invert if a nested overlay
// ever mounted already-open in the same commit as its parent.
const overlayStack: RefObject<HTMLElement | null>[] = [];

export function isCoveredByOverlay(node: Node | null) {
  const topmost = overlayStack.at(-1)?.current;
  return Boolean(topmost && !topmost.contains(node));
}

export function useOverlay<T extends HTMLElement>(onClose: VoidFunction) {
  const [isOpen, setIsOpen] = useState(false);
  const { accountModalOpen } = useAccountModal();
  const { chainModalOpen } = useChainModal();
  const { connectModalOpen } = useConnectModal();
  const ref = useRef<T>(null);

  useEffect(function registerInStack() {
    overlayStack.push(ref);
    return function unregister() {
      const index = overlayStack.indexOf(ref);
      if (index !== -1) {
        overlayStack.splice(index, 1);
      }
    };
  }, []);

  const isTopmost = () => overlayStack.at(-1) === ref;

  function handleClose() {
    if (accountModalOpen || chainModalOpen || connectModalOpen) {
      return;
    }
    setIsOpen(false);
  }

  function handleDismiss() {
    if (!isTopmost()) {
      return;
    }
    handleClose();
  }

  useOnClickOutside<T>(handleDismiss, ref);

  useOnKeyUp(function (e) {
    if (e.key === "Escape") {
      handleDismiss();
    }
  });

  useEffect(function openOnMount() {
    const rafId = requestAnimationFrame(() => setIsOpen(true));
    return () => cancelAnimationFrame(rafId);
  }, []);

  function handleTransitionEnd(e: TransitionEvent) {
    if (e.target !== e.currentTarget) {
      return;
    }
    if (!isOpen) {
      onClose();
    }
  }

  return { handleClose, handleTransitionEnd, isOpen, ref };
}
