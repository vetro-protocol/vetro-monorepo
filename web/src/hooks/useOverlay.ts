import { useOnClickOutside } from "@hemilabs/react-hooks/useOnClickOutside";
import { useOnKeyUp } from "@hemilabs/react-hooks/useOnKeyUp";
import {
  useAccountModal,
  useChainModal,
  useConnectModal,
} from "@rainbow-me/rainbowkit";
import { type TransitionEvent, useEffect, useState } from "react";

export function useOverlay<T extends HTMLElement>(onClose: VoidFunction) {
  const [isOpen, setIsOpen] = useState(false);
  const { accountModalOpen } = useAccountModal();
  const { chainModalOpen } = useChainModal();
  const { connectModalOpen } = useConnectModal();

  function handleClose() {
    if (accountModalOpen || chainModalOpen || connectModalOpen) {
      return;
    }
    setIsOpen(false);
  }

  const ref = useOnClickOutside<T>(handleClose);

  useOnKeyUp(function (e) {
    if (e.key === "Escape") {
      handleClose();
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
