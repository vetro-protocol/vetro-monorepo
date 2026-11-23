import { isCoveredByOverlay } from "hooks/useOverlay";
import RcTooltip from "rc-tooltip";
import {
  type FocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import "./tooltip.css";

type Props = {
  children: ReactNode;
  content: ReactNode;
  stretch?: boolean;
  topic?: string;
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
  topic,
  useParentContainer = false,
  visible,
}: Props) {
  const { t } = useTranslation();
  const [hasFocusableChild, setHasFocusableChild] = useState(false);
  const [open, setOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const pointerDownInOverlayRef = useRef(false);
  const pointerTypeRef = useRef("");
  const triggerRef = useRef<HTMLDivElement>(null);
  const canOpen = visible !== false;
  const isOpen = visible ?? open;
  const isFocusTarget = canOpen && !hasFocusableChild;
  const isNamedTrigger = isFocusTarget && Boolean(topic);

  useLayoutEffect(function () {
    setHasFocusableChild(
      Boolean(triggerRef.current?.querySelector(focusableSelector)),
    );
  });

  useEffect(
    function () {
      if (!isOpen) {
        return undefined;
      }
      // Overlays close on the Escape keyup at the document, so stop it at the
      // window capture phase to close only the tooltip. An overlay opened from
      // the trigger covers the tooltip, so that overlay must get the Escape.
      function onKeyUp(event: KeyboardEvent) {
        if (event.key !== "Escape") {
          return;
        }
        if (!isCoveredByOverlay(triggerRef.current)) {
          event.stopPropagation();
        }
        setOpen(false);
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
    [isOpen],
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
    const clickOnDisabledChild =
      event.target === event.currentTarget &&
      triggerRef.current?.querySelector(":disabled");
    const tapWithoutAction =
      pointerTypeRef.current === "touch" && !hasFocusableChild;
    if (clickOnDisabledChild || tapWithoutAction) {
      event.stopPropagation();
    }
    setOpen(true);
  }

  function onHoverChange(next: boolean) {
    const focused = document.activeElement;
    const hasKeyboardFocus =
      focused?.matches(":focus-visible") &&
      (triggerRef.current?.contains(focused) ||
        overlayRef.current?.contains(focused));
    if (next || !hasKeyboardFocus) {
      setOpen(next);
    }
  }

  function onKeyDown(event: ReactKeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
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
      onVisibleChange={onHoverChange}
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
      visible={isOpen}
    >
      <div
        aria-label={
          isNamedTrigger ? t("common.more-info-about", { topic }) : undefined
        }
        className={`vetro-tooltip-trigger flex cursor-pointer ${stretch ? "size-full" : "w-fit"}`}
        onBlur={closeOnFocusLeave}
        onClick={onClick}
        onFocus={onFocus}
        onKeyDown={isFocusTarget ? onKeyDown : undefined}
        onPointerDown={function (event) {
          pointerTypeRef.current = event.pointerType;
        }}
        ref={triggerRef}
        role={isNamedTrigger ? "button" : undefined}
        tabIndex={isFocusTarget ? 0 : -1}
      >
        {children}
      </div>
    </RcTooltip>
  );
};
