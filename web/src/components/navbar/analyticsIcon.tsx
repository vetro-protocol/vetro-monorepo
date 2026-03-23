import type { ComponentProps } from "react";

export const AnalyticsIcon = (props: ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    {...props}
  >
    <path
      fill="currentColor"
      d="M13.975 6.5c.028.277-.199.5-.475.5h-4a.5.5 0 0 1-.5-.5v-4c0-.275.225-.502.5-.474A5.002 5.002 0 0 1 13.974 6.5h.001Z"
    />
    <path
      fill="currentColor"
      d="M6.5 4.026c.276-.028.5.199.5.475v4a.5.5 0 0 0 .5.5h4c.276 0 .503.225.475.5A5 5 0 1 1 6.5 4.026Z"
    />
  </svg>
);
