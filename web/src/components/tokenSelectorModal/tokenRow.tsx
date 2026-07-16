import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { RenderCryptoValue } from "components/base/cryptoValue";
import { BridgeTokenFiatValue } from "components/bridgeForm/bridgeTokenFiatValue";
import { TokenChainLogo } from "components/bridgeForm/tokenChainLogo";
import { TokenLogo } from "components/tokenLogo";
import type { ReactNode } from "react";
import type { Token } from "types";
import { useAccount } from "wagmi";

type Props<T extends Token> = {
  onClick: () => void;
  secondary: ReactNode;
  showChainLogo: boolean;
  token: T;
};

export function TokenRow<T extends Token>({
  onClick,
  secondary,
  showChainLogo,
  token,
}: Props<T>) {
  const { address } = useAccount();
  const { data: balance, status } = useTokenBalance({
    address: token.address,
    chainId: token.chainId,
  });

  return (
    <button
      className="hover:shadow-bs flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left hover:rounded-lg hover:bg-gray-50"
      onClick={onClick}
      type="button"
    >
      {showChainLogo ? (
        <TokenChainLogo size="large" token={token} />
      ) : (
        <TokenLogo logoURI={token.logoURI} size="large" symbol={token.symbol} />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-b-medium text-gray-900">{token.symbol}</span>
        <span className="text-b-regular truncate text-gray-500">
          {secondary}
        </span>
      </div>
      {address ? (
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <div className="text-b-medium text-gray-900">
            <RenderCryptoValue status={status} token={token} value={balance} />
          </div>
          <span className="text-b-regular text-gray-500">
            $<BridgeTokenFiatValue token={token} value={balance} />
          </span>
        </div>
      ) : null}
    </button>
  );
}
