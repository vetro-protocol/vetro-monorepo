import { Stack } from "../stack";

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
      fill="currentColor"
      d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z"
    />
  </svg>
);

export type ToastData = {
  closable?: boolean;
  description?: string;
  id: number | string;
  title: string;
};

type ToasterProps = {
  autoCloseMs?: number;
  onClose: (id: number | string) => void;
  toasts: ToastData[];
};

type ToastProps = {
  autoCloseMs?: number;
  closable?: boolean;
  description?: string;
  onClose: VoidFunction;
  title: string;
};

const ToastCard = ({
  closable,
  description,
  onClose,
  title,
}: {
  closable?: boolean;
  description?: string;
  onClose: VoidFunction;
  title: string;
}) => (
  <div className="group flex items-start gap-3 rounded-lg bg-gray-950 p-3 pr-4">
    <div className="flex h-5 shrink-0 items-center">
      <CheckCircleIcon className="size-4 text-blue-500" />
    </div>
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <p className="text-sm leading-5 font-medium text-gray-50">{title}</p>
      {description && (
        <p className="text-sm leading-5 text-gray-400">{description}</p>
      )}
    </div>
    {closable && (
      <button
        aria-label="Close notification"
        className="flex h-5 shrink-0 cursor-pointer items-center text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:text-white"
        onClick={onClose}
        type="button"
      >
        <CloseIcon className="size-4" />
      </button>
    )}
  </div>
);

export const Toaster = ({ autoCloseMs, onClose, toasts }: ToasterProps) => (
  <Stack
    autoCloseMs={autoCloseMs}
    items={toasts.map((toast) => ({
      content: <ToastCard {...toast} onClose={() => onClose(toast.id)} />,
      id: toast.id,
    }))}
    onRemove={onClose}
  />
);

export const Toast = ({
  autoCloseMs,
  closable,
  description,
  onClose,
  title,
}: ToastProps) => (
  <Toaster
    autoCloseMs={autoCloseMs}
    onClose={onClose}
    toasts={[{ closable, description, id: "toast", title }]}
  />
);
