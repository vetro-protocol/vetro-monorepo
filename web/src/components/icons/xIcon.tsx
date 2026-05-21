import type { ComponentProps } from "react";

export const XIcon = (props: ComponentProps<"svg">) => (
  <svg
    fill="none"
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g transform="translate(1.6 1.6)">
      <path
        d="M9.79302 1.06758H11.6025L7.64917 5.58639L12.3003 11.7342H8.65865L5.80673 8.00512L2.54276 11.7342H0.732283L4.96099 6.90073L0.499213 1.06807H4.23326L6.8113 4.4766L9.79302 1.06758ZM9.15823 10.6515H10.1608L3.68844 2.09378H2.61258L9.15823 10.6515Z"
        fill="currentColor"
      />
    </g>
  </svg>
);
