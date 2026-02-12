import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type TransitionEvent,
} from "react";
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
      fill="currentColor"
      d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z"
    />
  </svg>
);

type ToastProps = {
  autoCloseMs?: number;
  closable?: boolean;
  description?: string;
  onClose: VoidFunction;
  title: string;
};

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

const GAP = 12;
const STACK_OFFSET = 12;
const SCALE_FACTOR = 0.05;

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
    <CheckCircleIcon className="size-4 shrink-0 text-blue-500" />
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <p className="text-sm leading-5 font-medium text-gray-50">{title}</p>
      {description && (
        <p className="text-sm leading-5 text-gray-400">{description}</p>
      )}
    </div>
    {closable && (
      <button
        aria-label="Close notification"
        className="shrink-0 cursor-pointer text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:text-white"
        onClick={onClose}
        type="button"
      >
        <CloseIcon className="size-4" />
      </button>
    )}
  </div>
);

type ToastItemProps = {
  autoCloseMs: number;
  closable?: boolean;
  description?: string;
  hovered: boolean;
  onClose: VoidFunction;
  onHeightChange: (height: number) => void;
  title: string;
};

function ToastItem({
  autoCloseMs,
  closable,
  description,
  hovered,
  onClose,
  onHeightChange,
  title,
}: ToastItemProps) {
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const elapsedRef = useRef(0);
  const timerStartRef = useRef(Date.now());

  useEffect(function enterAnimation() {
    const rafId = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(
    function autoClose() {
      if (exiting) return undefined;
      if (hovered) {
        elapsedRef.current += Date.now() - timerStartRef.current;
        return undefined;
      }
      const remaining = autoCloseMs - elapsedRef.current;
      if (remaining <= 0) {
        setExiting(true);
        return undefined;
      }
      timerStartRef.current = Date.now();
      const timer = setTimeout(function startExit() {
        setExiting(true);
      }, remaining);
      return () => clearTimeout(timer);
    },
    [autoCloseMs, exiting, hovered],
  );

  useEffect(function measureHeight() {
    if (ref.current) {
      onHeightChange(ref.current.getBoundingClientRect().height);
    }
  });

  function handleClose() {
    setExiting(true);
  }

  function handleTransitionEnd(e: TransitionEvent) {
    if (e.target === ref.current && exiting) {
      onClose();
    }
  }

  const isVisible = mounted && !exiting;

  return (
    <div
      ref={ref}
      className={`transition-all duration-300 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
      onTransitionEnd={handleTransitionEnd}
    >
      <ToastCard
        closable={closable}
        description={description}
        onClose={handleClose}
        title={title}
      />
    </div>
  );
}

export function Toaster({ autoCloseMs = 8000, onClose, toasts }: ToasterProps) {
  const [hovered, setHovered] = useState(false);
  const heightsRef = useRef<Record<string, number>>({});
  const [, forceRender] = useState(0);

  const handleHeightChange = useCallback(function handleHeightChange(
    id: number | string,
    height: number,
  ) {
    if (heightsRef.current[String(id)] !== height) {
      heightsRef.current[String(id)] = height;
      forceRender((n) => n + 1);
    }
  }, []);

  function getExpandedOffset(index: number) {
    let offset = 0;
    for (let i = toasts.length - 1; i > index; i--) {
      offset += (heightsRef.current[String(toasts[i].id)] ?? 56) + GAP;
    }
    return offset;
  }

  if (toasts.length === 0) return null;

  function handleMouseEnter() {
    setHovered(true);
  }

  function handleMouseLeave() {
    setHovered(false);
  }

  return createPortal(
    <div
      className="fixed inset-x-4 bottom-4 z-40 md:inset-x-auto md:right-4 md:w-96"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <ol className="relative list-none">
        {toasts.map(function renderToast(toast, index) {
          const frontIndex = toasts.length - 1 - index;
          const expandedOffset = getExpandedOffset(index);
          const isLast = index === toasts.length - 1;

          const transform = hovered
            ? `translateY(-${expandedOffset}px)`
            : frontIndex === 0
              ? undefined
              : `translateY(-${frontIndex * STACK_OFFSET}px) scale(${1 - frontIndex * SCALE_FACTOR})`;

          return (
            <li
              key={toast.id}
              className={isLast ? "" : "absolute right-0 bottom-0 left-0"}
              style={{
                transform,
                transformOrigin: "bottom center",
                transition: "all 300ms ease",
                zIndex: index,
              }}
            >
              <ToastItem
                autoCloseMs={autoCloseMs}
                closable={toast.closable}
                description={toast.description}
                hovered={hovered}
                onClose={() => onClose(toast.id)}
                onHeightChange={(h) => handleHeightChange(toast.id, h)}
                title={toast.title}
              />
            </li>
          );
        })}
      </ol>
    </div>,
    document.body,
  );
}

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
