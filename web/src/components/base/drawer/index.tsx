import { CloseIcon } from "components/icons/closeIcon";
import { useOverlay } from "hooks/useOverlay";
import { type ReactNode, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

type Props = {
  children: ReactNode;
  onClose: VoidFunction;
  requestClose?: boolean;
} & (
  { ariaLabel: string; title?: never } | { ariaLabel?: never; title: string }
);

export function Drawer({
  ariaLabel,
  children,
  onClose,
  requestClose,
  title,
}: Props) {
  const { handleClose, handleTransitionEnd, isOpen, ref } =
    useOverlay<HTMLDivElement>(onClose);
  const { t } = useTranslation();
  const titleId = useId();

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
        aria-label={ariaLabel}
        aria-labelledby={title ? titleId : undefined}
        aria-modal="true"
        className={`fixed inset-y-0 right-0 z-20 flex w-full flex-col rounded-l-lg bg-white shadow-xl transition-transform duration-300 md:w-md ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        data-state={isOpen ? "open" : "closed"}
        onTransitionEnd={handleTransitionEnd}
        ref={ref}
        role="dialog"
      >
        <div
          className={`flex px-6 ${title ? "items-start gap-4 py-8" : "justify-end pt-6"}`}
        >
          {title && (
            <h3 className="min-w-0 flex-1 text-gray-900" id={titleId}>
              {title}
            </h3>
          )}
          <button
            aria-label={t("common.close")}
            className="-mx-1 flex h-7 shrink-0 cursor-pointer items-center px-1 text-gray-500 transition-colors hover:text-gray-700"
            // Goes through handleClose (not onClose) to keep the exit transition
            onClick={handleClose}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </>,
    document.body,
  );
}
