import { useEffect, useState } from "react";

export function useAnimatedVisibility(active: boolean) {
  const [render, setRender] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(
    function animate() {
      if (active) {
        setRender(true);
        const frameId = requestAnimationFrame(() => setShow(true));
        return () => cancelAnimationFrame(frameId);
      }
      setShow(false);
      const timeoutId = setTimeout(() => setRender(false), 300);
      return () => clearTimeout(timeoutId);
    },
    [active, setRender, setShow],
  );

  return { render, show };
}
