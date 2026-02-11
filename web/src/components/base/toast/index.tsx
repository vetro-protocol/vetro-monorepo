import { useEffect } from "react";
import { createPortal } from "react-dom";

import { CheckCircleIcon } from "./checkCircleIcon";

const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    {...props}
  >
    <path
      fill="#99A1AF"
      d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z"
    />
  </svg>
);

type Props = {
  autoCloseMs?: number;
  closable?: boolean;
  description?: string;
  onClose: VoidFunction;
  title: string;
};

export function Toast({
  autoCloseMs = 10000,
  closable = false,
  description,
  onClose,
  title,
}: Props) {
  useEffect(
    function autoCloseToast() {
      const timer = setTimeout(onClose, autoCloseMs);
      return () => clearTimeout(timer);
    },
    [autoCloseMs, onClose],
  );

  return createPortal(
    <div className="fixed inset-x-4 bottom-4 z-40 flex items-start gap-3 rounded-lg bg-gray-950 p-3 pr-4 md:inset-x-auto md:right-4">
      <CheckCircleIcon className="size-4 shrink-0 text-blue-500" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm leading-5 font-medium text-gray-50">{title}</p>
        {description && (
          <p className="text-sm leading-5 text-gray-400">{description}</p>
        )}
      </div>
      {closable && (
        <button
          className="shrink-0 cursor-pointer text-gray-400 hover:text-gray-200"
          onClick={onClose}
        >
          <CloseIcon className="size-4" />
        </button>
      )}
    </div>,
    document.body,
  );
}
