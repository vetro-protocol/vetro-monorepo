import { useOverlay } from "hooks/useOverlay";
import { useVisualViewportSize } from "hooks/useVisualViewportSize";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  ariaLabel?: string;
  ariaLabelledBy?: string;
  children: (args: { close: VoidFunction }) => ReactNode;
  onClose: VoidFunction;
};

export function Modal({ ariaLabel, ariaLabelledBy, children, onClose }: Props) {
  const { handleClose, handleTransitionEnd, isOpen, ref } =
    useOverlay<HTMLDivElement>(onClose);
  const { height: viewportHeight, offsetTop } = useVisualViewportSize();
  const keyboardOffset =
    viewportHeight > 0
      ? Math.max(0, window.innerHeight - viewportHeight - offsetTop)
      : 0;

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-10 bg-gray-900/10 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
      />
      <div
        className="fixed inset-0 z-20 flex items-end justify-center md:items-center"
        style={{ paddingBottom: keyboardOffset }}
      >
        <div
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-modal="true"
          className={`w-full rounded-t-2xl bg-white shadow-xl transition-all duration-300 md:w-auto md:rounded-2xl ${
            isOpen
              ? "translate-y-0 opacity-100"
              : "translate-y-full opacity-100 md:translate-y-0 md:opacity-0"
          }`}
          onTransitionEnd={handleTransitionEnd}
          ref={ref}
          role="dialog"
        >
          {children({ close: handleClose })}
        </div>
      </div>
    </>,
    document.body,
  );
}
