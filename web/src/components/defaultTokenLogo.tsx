/* eslint-disable sort-keys */
export const logoSizeClasses = {
  xSmall: "size-3",
  small: "size-4",
  base: "size-5",
  medium: "size-6",
  large: "size-8",
  xLarge: "size-11",
};
/* eslint-enable sort-keys */

export type LogoSize = keyof typeof logoSizeClasses;

type Props = {
  size?: LogoSize;
  symbol: string;
};

export const DefaultTokenLogo = ({ size = "base", symbol }: Props) => (
  <div
    className={`flex ${logoSizeClasses[size]} items-center justify-center overflow-hidden rounded-full border border-solid border-white bg-neutral-50 text-[8px] font-semibold text-neutral-700`}
  >
    {symbol}
  </div>
);
