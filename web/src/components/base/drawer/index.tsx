import { useOverlay } from "hooks/useOverlay";
import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

type Props = {
  children: ReactNode;
  onClose: VoidFunction;
  requestClose?: boolean;
};

export function Drawer({ children, onClose, requestClose }: Props) {
  const { handleClose, handleTransitionEnd, isOpen, ref } =
    useOverlay<HTMLDivElement>(onClose);

  useEffect(
    function closeFromParent() {
      if (requestClose) {
        handleClose();
      }
    },
    [handleClose, requestClose],
  );

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-10 bg-gray-900/10 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
      />
      <div
        className={`fixed inset-y-0 right-0 z-20 w-full rounded-l-lg bg-white shadow-xl transition-transform duration-300 md:w-md ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        onTransitionEnd={handleTransitionEnd}
        ref={ref}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}
