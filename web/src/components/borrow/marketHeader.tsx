import { TokenLogo } from "components/tokenLogo";
import type { Token } from "types";

type Props = {
  collateralToken: Token;
  loanToken: Token;
};

const sideClasses = {
  left: "left-1/8 -translate-x-2/3 md:left-1/4 md:-translate-x-1/2",
  right: "right-1/8 translate-x-2/3 md:right-1/4 md:translate-x-1/2",
};

const TokenBackground = ({
  logoURI,
  side,
}: {
  logoURI: string;
  side: "left" | "right";
}) => (
  <img
    alt=""
    aria-hidden="true"
    className={`absolute top-1/2 size-[280px] -translate-y-1/2 opacity-5 lg:size-[400px] ${sideClasses[side]}`}
    src={logoURI}
  />
);

const TokenSection = ({ token }: { token: Token }) => (
  <div className="flex flex-1 items-center justify-center gap-4">
    <TokenLogo {...token} size="xLarge" />
    <span className="text-h1 max-md:hidden">{token.symbol}</span>
  </div>
);

export const MarketHeader = ({ collateralToken, loanToken }: Props) => (
  <div className="relative flex h-50 items-center overflow-hidden border-b border-gray-200">
    <TokenBackground logoURI={collateralToken.logoURI} side="left" />
    <TokenBackground logoURI={loanToken.logoURI} side="right" />
    <TokenSection token={collateralToken} />
    <span className="text-h1 opacity-48">/</span>
    <TokenSection token={loanToken} />
  </div>
);
