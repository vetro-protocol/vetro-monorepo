import { useOverlay } from "hooks/useOverlay";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  children: ReactNode;
  onClose: VoidFunction;
};

export function Modal({ children, onClose }: Props) {
  const { handleTransitionEnd, isOpen, ref } =
    useOverlay<HTMLDivElement>(onClose);

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-10 bg-gray-900/10 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
      />
      <div
        className={`fixed inset-0 z-20 flex items-center justify-center transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
        onTransitionEnd={handleTransitionEnd}
      >
        <div ref={ref}>{children}</div>
      </div>
    </>,
    document.body,
  );
}
