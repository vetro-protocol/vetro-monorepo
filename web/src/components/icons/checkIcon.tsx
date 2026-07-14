import type { ComponentProps } from "react";

export const CheckIcon = (props: ComponentProps<"svg">) => (
  <svg
    aria-hidden="true"
    fill="none"
    stroke="white"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2.5}
    viewBox="0 0 12 12"
    {...props}
  >
    <path d="M2 6l3 3 5-5" />
  </svg>
);
