import type { ComponentProps } from "react";

export const ExternalLinkIcon = (props: ComponentProps<"svg">) => (
  <svg
    fill="none"
    height={8}
    viewBox="0 0 8 8"
    width={8}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M.22 7.78a.75.75 0 0 1 0-1.06L5.44 1.5H1.75a.75.75 0 1 1 0-1.5h5.5A.75.75 0 0 1 8 .75v5.5a.75.75 0 0 1-1.5 0V2.56L1.28 7.78a.75.75 0 0 1-1.06 0Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);
