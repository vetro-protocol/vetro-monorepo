const sizeClasses = {
  base: "size-5",
  large: "size-8",
  small: "size-4",
  xLarge: "size-11",
};

type Props = {
  size?: keyof typeof sizeClasses;
  symbol: string;
};

export const DefaultTokenLogo = ({ size = "base", symbol }: Props) => (
  <div
    className={`flex ${sizeClasses[size]} items-center justify-center overflow-hidden rounded-full border border-solid border-white bg-neutral-50 text-[8px] font-semibold text-neutral-700`}
  >
    {symbol}
  </div>
);
