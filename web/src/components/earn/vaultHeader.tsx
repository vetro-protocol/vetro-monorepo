import type { Token } from "@vetro-protocol/core";
import { TokenLogo } from "components/tokenLogo";

type Props = {
  peggedToken: Token;
  shareTokenSymbol: string;
  title: string;
};

export const VaultHeader = ({
  peggedToken,
  shareTokenSymbol,
  title,
}: Props) => (
  <div className="relative flex h-50 items-center justify-center overflow-hidden border-b border-gray-200 px-4">
    <img
      alt=""
      aria-hidden="true"
      className="absolute top-1/2 left-1/2 size-70 -translate-x-1/2 -translate-y-1/2 opacity-5 lg:size-100"
      src={peggedToken.logoURI}
    />
    <h1 className="text-h1 relative flex flex-col items-center gap-2 text-center sm:flex-row sm:gap-4">
      <span className="flex items-center gap-4">
        <span aria-hidden="true" className="flex shrink-0">
          <TokenLogo {...peggedToken} size="xLarge" />
        </span>
        {shareTokenSymbol}
      </span>
      <span className="opacity-48 max-sm:sr-only">/</span>
      <span>{title}</span>
    </h1>
  </div>
);
