type Props = {
  size?: number;
};

export const MerklIcon = ({ size = 12 }: Props) => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    height={size}
    viewBox="0 -1.3114 36.5052 36.5052"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.5124 6.91086H24.8988L18.5124 24.6203L9.3504 0H0.0468L0 18.3777H6.7536V11.0864L15.348 33.5946H21.1092L29.7048 11.0864V33.5946H36.5052V6.91086V0H18.5124V6.91086Z" />
    <path d="M0 25.3415V33.5938L2.6028 32.6377C5.094 31.7231 6.7524 29.3207 6.7524 26.6293V18.377L4.1496 19.333C1.6596 20.2477 0 22.6501 0 25.3415Z" />
  </svg>
);
