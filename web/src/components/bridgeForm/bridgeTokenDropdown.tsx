import { ChevronIcon } from "components/base/chevronIcon";
import { Dropdown } from "components/base/dropdown";
import { allChains } from "networks";
import { useTranslation } from "react-i18next";
import type { BridgeableToken } from "types";

import { TokenChainLogo } from "./tokenChainLogo";

type Props = {
  onChange: (token: BridgeableToken) => void;
  tokens: BridgeableToken[];
  triggerLabel: string;
  value: BridgeableToken;
};

const renderItem = function (token: BridgeableToken) {
  const chain = allChains.find((c) => c.id === token.chainId);
  return (
    <>
      <div className="flex items-center gap-2">
        <TokenChainLogo token={token} />
        <span>{token.symbol}</span>
      </div>
      <span className="text-gray-500">{chain?.name ?? token.name}</span>
    </>
  );
};

export const BridgeTokenDropdown = function ({
  onChange,
  tokens,
  triggerLabel,
  value,
}: Props) {
  const { t } = useTranslation();
  const hasMultiple = tokens.length > 1;

  return (
    <Dropdown
      getItemKey={(token) => `${token.address}-${token.chainId}`}
      items={tokens}
      matchTriggerWidth
      onChange={onChange}
      renderItem={renderItem}
      renderTrigger={(isOpen, triggerProps) => (
        <div
          {...triggerProps}
          aria-label={triggerLabel}
          className={`flex items-center gap-1.5 rounded-full bg-white py-1.5 pr-2 pl-1.5 shadow-sm ${hasMultiple ? "cursor-pointer text-gray-500 hover:bg-gray-50 hover:text-neutral-900" : ""}`}
        >
          <TokenChainLogo token={value} />
          <span className="text-sm font-semibold text-gray-900">
            {value.symbol}
          </span>
          {hasMultiple && (
            <div className="flex items-center">
              <ChevronIcon direction={isOpen ? "up" : "down"} />
            </div>
          )}
        </div>
      )}
      triggerId={t("pages.bridge.select-chain")}
      value={value}
    />
  );
};
