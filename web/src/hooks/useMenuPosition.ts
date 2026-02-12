import { useWindowSize } from "@hemilabs/react-hooks/useWindowSize";
import { type RefObject, useEffect } from "react";

type Props = {
  isOpen: boolean;
  listRef: RefObject<HTMLElement | null>;
  triggerRef: RefObject<HTMLElement | null>;
};

export function useMenuPosition({ isOpen, listRef, triggerRef }: Props) {
  const { height: windowHeight, width: windowWidth } = useWindowSize();

  useEffect(
    function positionMenuOnScreen() {
      if (!isOpen || !triggerRef.current || !listRef.current) {
        return;
      }

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const listRect = listRef.current.getBoundingClientRect();
      const gap = 8;

      const spaceBelow = windowHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      let top: number;
      if (spaceBelow >= listRect.height || spaceBelow > spaceAbove) {
        top = triggerRect.bottom + gap;
      } else {
        top = triggerRect.top - listRect.height - gap;
      }

      const spaceRight = windowWidth - triggerRect.left;
      const spaceLeft = triggerRect.right;

      let left: number;
      if (spaceRight >= listRect.width || spaceRight > spaceLeft) {
        left = triggerRect.left;
      } else {
        left = triggerRect.right - listRect.width;
      }

      left = Math.max(gap, Math.min(left, windowWidth - listRect.width - gap));
      top = Math.max(gap, Math.min(top, windowHeight - listRect.height - gap));

      listRef.current.style.top = `${top}px`;
      listRef.current.style.left = `${left}px`;
    },
    [isOpen, listRef, triggerRef, windowHeight, windowWidth],
  );
}
