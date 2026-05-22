/* eslint-disable sort-keys */
const sizeClasses = {
  xSmall: "size-3",
  small: "size-4",
  base: "size-5",
  medium: "size-6",
  large: "size-8",
  xLarge: "size-11",
};
/* eslint-enable sort-keys */

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
