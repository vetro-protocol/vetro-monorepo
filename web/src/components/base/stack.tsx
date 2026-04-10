import {
  type ReactNode,
  type TransitionEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const GAP = 12;
const SCALE_FACTOR = 0.05;
const STACK_OFFSET = 12;

const positions = {
  "bottom-center": "fixed bottom-4 left-1/2 z-40 w-72 -translate-x-1/2",
  "bottom-right":
    "fixed inset-x-4 bottom-4 z-40 md:inset-x-auto md:right-4 md:w-96",
} as const;

export type StackItem = {
  content: ReactNode;
  id: number | string;
};

type Props = {
  autoCloseMs?: number;
  items: StackItem[];
  onRemove?: (id: number | string) => void;
  position?: keyof typeof positions;
};

type ItemAnimationProps = {
  autoCloseMs: number | undefined;
  children: ReactNode;
  hovered: boolean;
  onHeightChange: (height: number) => void;
  onRemove?: VoidFunction;
};

function ItemAnimation({
  autoCloseMs,
  children,
  hovered,
  onHeightChange,
  onRemove,
}: ItemAnimationProps) {
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
      if (autoCloseMs === undefined) return undefined;
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
      onHeightChange(ref.current.offsetHeight);
    }
  });

  function handleTransitionEnd(e: TransitionEvent) {
    if (e.target === ref.current && exiting) {
      onRemove?.();
    }
  }

  const isVisible = mounted && !exiting;

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
      onTransitionEnd={handleTransitionEnd}
      ref={ref}
    >
      {children}
    </div>
  );
}

export function Stack({
  autoCloseMs,
  items,
  onRemove,
  position = "bottom-right",
}: Props) {
  const [hovered, setHovered] = useState(false);
  const heightsRef = useRef<Record<string, number>>({});
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
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
    for (let i = 0; i < index; i++) {
      offset += (heightsRef.current[String(items[i].id)] ?? 56) + GAP;
    }
    return offset;
  }

  useEffect(() => () => clearTimeout(leaveTimerRef.current), []);

  if (items.length === 0) return null;

  function handleMouseEnter() {
    clearTimeout(leaveTimerRef.current);
    setHovered(true);
  }

  function handleMouseLeave() {
    leaveTimerRef.current = setTimeout(function deferLeave() {
      setHovered(false);
    }, 150);
  }

  return createPortal(
    <div
      className={positions[position]}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <ol className="relative list-none">
        {items.map(function renderItem(item, index) {
          const expandedOffset = getExpandedOffset(index);
          const isFirst = index === 0;

          const transform = hovered
            ? `translateY(-${expandedOffset}px)`
            : isFirst
              ? undefined
              : `translateY(-${index * STACK_OFFSET}px) scale(${1 - index * SCALE_FACTOR})`;

          return (
            <li
              className={
                isFirst ? "relative" : "absolute right-0 bottom-0 left-0"
              }
              key={item.id}
              style={{
                transform,
                transformOrigin: "bottom center",
                transition: "all 300ms ease",
                zIndex: items.length - index,
              }}
            >
              <ItemAnimation
                autoCloseMs={autoCloseMs}
                hovered={hovered}
                onHeightChange={(h) => handleHeightChange(item.id, h)}
                onRemove={onRemove ? () => onRemove(item.id) : undefined}
              >
                {item.content}
              </ItemAnimation>
            </li>
          );
        })}
      </ol>
    </div>,
    document.body,
  );
}
