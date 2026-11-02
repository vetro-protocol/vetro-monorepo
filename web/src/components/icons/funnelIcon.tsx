type Props = {
  className?: string;
};

export const FunnelIcon = ({ className }: Props) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M14 2a1 1 0 0 1 1 1v1.573a1 1 0 0 1-.31.724L10 9.722v2.928a1 1 0 0 1-.553.894l-2 1A1 1 0 0 1 6 13.65V9.722L1.31 5.297A1 1 0 0 1 1 4.573V3a1 1 0 0 1 1-1h12Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);
