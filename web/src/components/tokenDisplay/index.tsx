import { TokenLogo } from "../tokenLogo";

type Props = {
  logoURI: string;
  symbol: string;
};

export const TokenDisplay = ({ logoURI, symbol }: Props) => (
  <>
    <TokenLogo logoURI={logoURI} symbol={symbol} />
    <span className="text-sm font-semibold text-gray-900">{symbol}</span>
  </>
);
