const heights = {
  medium: "h-22",
  small: "h-11",
} as const;

export const StripedDivider = ({
  variant = "medium",
}: {
  variant?: keyof typeof heights;
}) => (
  <div className={`${heights[variant]} p-2`}>
    <div
      aria-hidden="true"
      className="size-full"
      style={{
        background: `repeating-linear-gradient(
          120deg,
          #f3f4f6,
          #f3f4f6 4px,
          #e5e7eb 4px,
          #e5e7eb 6px
        )`,
      }}
    />
  </div>
);
