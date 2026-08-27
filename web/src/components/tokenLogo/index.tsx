import type { Token } from "@vetro-protocol/core";
import {
  DefaultTokenLogo,
  type LogoSize,
  logoSizeClasses,
} from "components/defaultTokenLogo";
import { useEffect, useState } from "react";

type Props = Pick<Token, "logoURI" | "symbol"> & {
  size?: LogoSize;
};

export const TokenLogo = function ({ logoURI, size = "base", symbol }: Props) {
  const [hasError, setHasError] = useState(false);

  useEffect(
    function resetOnUrlChange() {
      setHasError(false);
    },
    [logoURI],
  );

  if (!logoURI || hasError) {
    return <DefaultTokenLogo size={size} symbol={symbol} />;
  }

  return (
    <img
      alt={`${symbol} logo`}
      className={`${logoSizeClasses[size]} rounded-full`}
      onError={() => setHasError(true)}
      src={logoURI}
    />
  );
};
