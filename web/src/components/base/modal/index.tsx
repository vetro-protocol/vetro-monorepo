import { useOnClickOutside } from "@hemilabs/react-hooks/useOnClickOutside";
import { useOnKeyUp } from "@hemilabs/react-hooks/useOnKeyUp";
import {
  useAccountModal,
  useChainModal,
  useConnectModal,
} from "@rainbow-me/rainbowkit";
import {
  type ReactNode,
  type TransitionEvent,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";

type Props = {
  children: ReactNode;
  onClose: VoidFunction;
};

export function Modal({ children, onClose }: Props) {
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

  const modalRef = useOnClickOutside<HTMLDivElement>(handleClose);

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

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-10 bg-gray-900/10 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
      />
      <div
        className={`fixed inset-0 z-20 flex items-center justify-center transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
        onTransitionEnd={handleTransitionEnd}
      >
        <div ref={modalRef}>{children}</div>
      </div>
    </>,
    document.body,
  );
}
