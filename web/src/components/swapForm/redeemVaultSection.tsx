import { StripedDivider } from "components/stripedDivider";
import { useEffect, useRef } from "react";
import type { Token } from "types";

import { RedeemVault } from "./redeemVault";

type Props = {
  whitelistedTokens: Token[];
};
export const RedeemVaultSection = function ({ whitelistedTokens }: Props) {
  const redeemVaultRef = useRef<HTMLDivElement>(null);

  useEffect(function scrollIntoVault() {
    if (window.location.hash === "#redeem-vault") {
      redeemVaultRef.current?.scrollIntoView({ behavior: "smooth" });
      // remove hash from the url keeping it clean
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
  }, []);

  return (
    <>
      <div className="w-full border-b border-gray-200 bg-gray-100">
        <StripedDivider />
      </div>
      <div className="w-full" id="redeem-vault" ref={redeemVaultRef}>
        <RedeemVault whitelistedTokens={whitelistedTokens} />
      </div>
    </>
  );
};
