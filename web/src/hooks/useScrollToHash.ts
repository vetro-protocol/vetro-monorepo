import { useEffect, useRef } from "react";

export const useScrollToHash = function (hash: string) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(
    function scrollToHash() {
      if (window.location.hash === `#${hash}`) {
        ref.current?.scrollIntoView({ behavior: "smooth" });
        history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      }
    },
    [hash],
  );

  return ref;
};
