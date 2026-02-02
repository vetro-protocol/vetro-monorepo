type Props = {
  direction?: "down" | "up";
};

export const ChevronIcon = ({ direction = "down" }: Props) => (
  <svg
    className={`inline-block size-4 shrink-0 ${direction === "up" ? "rotate-180" : ""}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path
      clipRule="evenodd"
      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
      fillRule="evenodd"
    />
  </svg>
);
