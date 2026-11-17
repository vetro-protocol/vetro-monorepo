import RcTooltip from "rc-tooltip";
import {
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import "./tooltip.css";

type Props = {
  children: ReactNode;
  content: ReactNode;
  stretch?: boolean;
  useParentContainer?: boolean;
  visible?: boolean;
};

const focusableSelector = [
  "a[href]",
  "button:not(:disabled)",
  "input:not(:disabled)",
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const getTooltipContainer = (node: HTMLElement) => node.parentElement!;
// motionName is the prefix rc-motion uses to toggle the
// `vetro-tooltip-{appear,enter,leave}[-active]` classes that tooltip.css targets.
// rc-motion ignores the transitionend that bubbles up from .rc-tooltip-content,
// so without a deadline a closed tooltip stays mounted at opacity 0.
const motion = { motionDeadline: 200, motionName: "vetro-tooltip" };

export const Tooltip = function ({
  children,
  content,
  stretch = false,
  useParentContainer = false,
  visible,
}: Props) {
  const [hasFocusableChild, setHasFocusableChild] = useState(false);
  const [open, setOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const pointerDownInOverlayRef = useRef(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const canOpen = visible !== false;

  useLayoutEffect(function () {
    setHasFocusableChild(
      Boolean(triggerRef.current?.querySelector(focusableSelector)),
    );
  });

  useEffect(
    function () {
      if (!open) {
        return undefined;
      }
      // Overlays close on the Escape keyup at the document, so stop it at the
      // window capture phase to close only the tooltip.
      function onKeyUp(event: KeyboardEvent) {
        if (event.key === "Escape") {
          event.stopPropagation();
          setOpen(false);
        }
      }
      function onPointerDown(event: PointerEvent) {
        const target = event.target as Node;
        if (
          !triggerRef.current?.contains(target) &&
          !overlayRef.current?.contains(target)
        ) {
          setOpen(false);
        }
      }
      function onPointerUp() {
        pointerDownInOverlayRef.current = false;
      }
      window.addEventListener("keyup", onKeyUp, true);
      document.addEventListener("pointerdown", onPointerDown);
      document.addEventListener("pointerup", onPointerUp);
      return function () {
        window.removeEventListener("keyup", onKeyUp, true);
        document.removeEventListener("pointerdown", onPointerDown);
        document.removeEventListener("pointerup", onPointerUp);
      };
    },
    [open],
  );

  function closeOnFocusLeave(event: FocusEvent) {
    const next = event.relatedTarget;
    if (
      pointerDownInOverlayRef.current ||
      triggerRef.current?.contains(next as Node | null) ||
      overlayRef.current?.contains(next as Node | null)
    ) {
      return;
    }
    setOpen(false);
  }

  function onClick(event: MouseEvent) {
    if (!canOpen) {
      return;
    }
    // A disabled child passes the click to the wrapper (see tooltip.css). The
    // browser drops clicks on disabled controls, so parents must not get it.
    if (
      event.target === event.currentTarget &&
      triggerRef.current?.querySelector(":disabled")
    ) {
      event.stopPropagation();
    }
    setOpen(true);
  }

  function onFocus(event: FocusEvent) {
    if (canOpen && (event.target as Element).matches(":focus-visible")) {
      setOpen(true);
    }
  }

  return (
    <RcTooltip
      getTooltipContainer={useParentContainer ? getTooltipContainer : undefined}
      motion={motion}
      onVisibleChange={setOpen}
      overlay={
        <div
          className="text-b-medium max-w-xs rounded-md bg-gray-900 px-1.5 py-1 text-white"
          onBlur={closeOnFocusLeave}
          onPointerDown={function () {
            pointerDownInOverlayRef.current = true;
          }}
          ref={overlayRef}
        >
          {content}
        </div>
      }
      placement="top"
      showArrow={false}
      trigger={["hover"]}
      visible={visible ?? open}
    >
      <div
        className={`vetro-tooltip-trigger flex cursor-pointer ${stretch ? "size-full" : "w-fit"}`}
        onBlur={closeOnFocusLeave}
        onClick={onClick}
        onFocus={onFocus}
        ref={triggerRef}
        tabIndex={canOpen && !hasFocusableChild ? 0 : undefined}
      >
        {children}
      </div>
    </RcTooltip>
  );
};
