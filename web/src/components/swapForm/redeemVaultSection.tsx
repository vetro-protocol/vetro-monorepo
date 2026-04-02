import { StripedDivider } from "components/stripedDivider";
import { useScrollToHash } from "hooks/useScrollToHash";
import type { Token } from "types";

import { RedeemVault } from "./redeemVault";

type Props = {
  whitelistedTokens: Token[];
};
export const RedeemVaultSection = function ({ whitelistedTokens }: Props) {
  const ref = useScrollToHash("redeem-vault");

  return (
    <>
      <div className="w-full border-y border-gray-200 bg-gray-100">
        <StripedDivider />
      </div>
      <div className="w-full" id="redeem-vault" ref={ref}>
        <RedeemVault whitelistedTokens={whitelistedTokens} />
      </div>
    </>
  );
};
