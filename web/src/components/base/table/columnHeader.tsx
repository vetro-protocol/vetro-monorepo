import type { ComponentProps } from "react";

export const ColumnHeader = ({
  children,
  className = "",
  style,
}: ComponentProps<"th">) => (
  <th
    className={`flex w-full shrink-0 grow-0 items-center ${className} font-medium whitespace-nowrap`}
    style={style}
  >
    {children}
  </th>
);
