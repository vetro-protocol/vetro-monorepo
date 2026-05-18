type Size = "medium" | "small";

const sizes: Record<Size, number> = {
  medium: 20,
  small: 16,
};

type Props = {
  size?: Size;
};

export const CloseIcon = ({ size = "medium" }: Props) => (
  <svg
    aria-hidden="true"
    fill="none"
    height={sizes[size]}
    viewBox="0 0 20 20"
    width={sizes[size]}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 6l8 8M14 6l-8 8"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.5"
    />
  </svg>
);
