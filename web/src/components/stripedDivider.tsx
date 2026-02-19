export const StripedDivider = () => (
  <div
    aria-hidden="true"
    className="h-22 w-full"
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
);
