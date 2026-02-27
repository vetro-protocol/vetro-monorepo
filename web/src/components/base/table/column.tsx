import type { ComponentProps } from "react";

export const Column = ({ className = "", ...props }: ComponentProps<"td">) => (
  <td
    className={`flex h-full min-h-[52px] w-full shrink-0 items-center py-2.5 ${className}`}
    {...props}
  />
);
