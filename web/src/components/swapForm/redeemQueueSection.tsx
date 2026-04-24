import { StripedDivider } from "components/stripedDivider";
import { useScrollToHash } from "hooks/useScrollToHash";
import type { TokenWithGateway } from "types";

import { RedeemQueue } from "./redeemQueue";

type Props = {
  peggedToken: TokenWithGateway;
  whitelistedTokens: TokenWithGateway[];
};
export const RedeemQueueSection = function (props: Props) {
  const ref = useScrollToHash("redeem-queue");

  return (
    <>
      <div className="w-full border-y border-gray-200 bg-gray-100">
        <StripedDivider />
      </div>
      <div className="w-full" id="redeem-queue" ref={ref}>
        <RedeemQueue {...props} />
      </div>
    </>
  );
};
