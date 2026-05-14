import { useSyncExternalStore } from "react";

function subscribe(callback: (this: VisualViewport, ev: Event) => unknown) {
  window.visualViewport?.addEventListener("resize", callback);
  window.visualViewport?.addEventListener("scroll", callback);
  return function cleanup() {
    window.visualViewport?.removeEventListener("resize", callback);
    window.visualViewport?.removeEventListener("scroll", callback);
  };
}

const getHeightSnapshot = () =>
  typeof window !== "undefined" && window.visualViewport
    ? window.visualViewport.height
    : 0;

const getOffsetTopSnapshot = () =>
  typeof window !== "undefined" && window.visualViewport
    ? window.visualViewport.offsetTop
    : 0;

export function useVisualViewportSize() {
  const height = useSyncExternalStore(subscribe, getHeightSnapshot);
  const offsetTop = useSyncExternalStore(subscribe, getOffsetTopSnapshot);
  return { height, offsetTop };
}
