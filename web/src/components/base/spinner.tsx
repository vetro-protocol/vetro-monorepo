type Props = {
  size?: "base" | "large" | "xLarge";
};

const sizeConfig = {
  base: {
    center: 8,
    className: "size-4",
    radius: 6.75,
    strokeWidth: 2.5,
    viewBox: "0 0 16 16",
  },
  large: {
    center: 12,
    className: "size-6",
    radius: 10.25,
    strokeWidth: 3.5,
    viewBox: "0 0 24 24",
  },
  xLarge: {
    center: 16,
    className: "size-8",
    radius: 13.75,
    strokeWidth: 4.5,
    viewBox: "0 0 32 32",
  },
};

export function Spinner({ size = "base" }: Props) {
  const config = sizeConfig[size];

  return (
    <svg
      aria-label="Loading"
      className={`animate-spin ${config.className}`}
      fill="none"
      role="status"
      viewBox={config.viewBox}
    >
      <defs>
        <linearGradient id="spinnerGradient" x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" stopColor="rgb(65, 107, 255)" stopOpacity="0.88" />
          <stop offset="50%" stopColor="rgb(65, 107, 255)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="rgb(65, 107, 255)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle
        cx={config.center}
        cy={config.center}
        r={config.radius}
        stroke="url(#spinnerGradient)"
        strokeDasharray="25 100"
        strokeLinecap="round"
        strokeWidth={config.strokeWidth}
      />
    </svg>
  );
}
