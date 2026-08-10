import type { Token } from "@vetro-protocol/core";
import { RenderFiatValue } from "components/base/fiatValue";
import { ShareTokenFiatValue } from "components/base/shareTokenFiatValue";

type Props = {
  token: Token;
  value: bigint | undefined;
};

export function BridgeTokenFiatValue(props: Props) {
  if (props.token.extensions?.isVaultShare) {
    return <ShareTokenFiatValue {...props} />;
  }
  return <RenderFiatValue {...props} />;
}
