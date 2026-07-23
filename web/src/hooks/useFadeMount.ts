import { type TransitionEvent, useEffect, useState } from "react";

/**
 * Drives the app's fade-in/out for a floating element: it mounts hidden, fades
 * in on the next frame, and stays mounted through the fade-out, unmounting only
 * once the opacity transition ends. Gate rendering on `isMounted`, feed
 * `isVisible` into the opacity class, and wire `handleTransitionEnd` to the
 * animated element's `onTransitionEnd`.
 */
export function useFadeMount() {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(
    function fadeInAfterMount() {
      if (!isMounted) {
        return undefined;
      }
      const rafId = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(rafId);
    },
    [isMounted],
  );

  function open() {
    if (isMounted) {
      // Re-show while a previous fade-out is still in flight.
      setIsVisible(true);
    } else {
      setIsMounted(true);
    }
  }

  function close() {
    setIsVisible(false);
  }

  function handleTransitionEnd(event: TransitionEvent) {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (!isVisible) {
      setIsMounted(false);
    }
  }

  return { close, handleTransitionEnd, isMounted, isVisible, open };
}
