import { TokenLogo } from "components/tokenLogo";
import { Tooltip } from "components/tooltip";

type RewardToken = {
  logoURI?: string;
  symbol: string;
};

type Props = {
  tokens: RewardToken[];
};

const TokenList = ({ tokens }: { tokens: RewardToken[] }) => (
  <div className="flex flex-col gap-0.5">
    {tokens.map((token) => (
      <div className="flex items-center gap-1" key={token.symbol}>
        <div className="size-3 *:size-3 *:text-[6px]">
          <TokenLogo logoURI={token.logoURI ?? ""} symbol={token.symbol} />
        </div>
        <span>{token.symbol}</span>
      </div>
    ))}
  </div>
);

export function TokenIconStack({ tokens }: Props) {
  if (tokens.length === 0) {
    return <span className="text-xsm font-semibold text-gray-900">-</span>;
  }

  return (
    <Tooltip content={<TokenList tokens={tokens} />}>
      <div className="group flex items-center">
        {tokens.map((token, index) => (
          <div
            className={`size-4 transition-all duration-200 *:size-4 *:text-[7px] ${
              index > 0 ? "-ml-1 group-hover:ml-0" : ""
            }`}
            key={token.symbol}
          >
            <TokenLogo logoURI={token.logoURI ?? ""} symbol={token.symbol} />
          </div>
        ))}
      </div>
    </Tooltip>
  );
}
