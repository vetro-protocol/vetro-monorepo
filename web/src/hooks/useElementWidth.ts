import { useLayoutEffect, useRef, useState } from "react";

export const useElementWidth = function () {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(function observeWidth() {
    if (!ref.current) return undefined;
    const observer = new ResizeObserver(function ([entry]) {
      setWidth(entry.contentRect.width);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
};
