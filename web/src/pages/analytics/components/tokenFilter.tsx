import { SegmentedControl } from "components/base/segmentedControl";
import { TokenDisplay } from "components/tokenDisplay";
import type { TokenWithGateway } from "types";

type Props = {
  onChange: (token: TokenWithGateway) => void;
  tokens: TokenWithGateway[];
  value: TokenWithGateway;
};

export const TokenFilter = ({ onChange, tokens, value }: Props) => (
  <SegmentedControl
    onChange={(gatewayAddress) =>
      onChange(tokens.find((t) => t.gatewayAddress === gatewayAddress)!)
    }
    options={tokens.map((token) => ({
      label: (
        <span className="flex items-center gap-1.5">
          <TokenDisplay logoURI={token.logoURI} symbol={token.symbol} />
        </span>
      ),
      value: token.gatewayAddress,
    }))}
    value={value.gatewayAddress}
    variant="pill"
  />
);
