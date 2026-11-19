import type { ComponentProps } from "react";

export const Column = ({ className = "", ...props }: ComponentProps<"td">) => (
  <td
    className={`flex size-full min-h-[52px] shrink-0 items-center py-2.5 ${className}`}
    {...props}
  />
);
