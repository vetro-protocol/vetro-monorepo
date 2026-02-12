import { useTranslation } from "react-i18next";
import { type Token } from "types";

import { ChevronIcon } from "../base/chevronIcon";
import { Dropdown } from "../base/dropdown";
import { TokenDisplay } from "../tokenDisplay";
import { TokenLogo } from "../tokenLogo";

type Props = {
  onChange: (token: Token) => void;
  tokens: Token[];
  value: Token;
};

const renderItem = (token: Token) => (
  <>
    <div className="flex items-center gap-2">
      <TokenLogo {...token} />
      <span className="text-gray-500">{token.name}</span>
    </div>
    <span>{token.symbol}</span>
  </>
);

export const TokenDropdown = function ({ onChange, tokens, value }: Props) {
  const { t } = useTranslation();

  return (
    <Dropdown
      getItemKey={(token) => `${token.address}-${token.chainId}`}
      items={tokens}
      matchTriggerWidth
      onChange={onChange}
      renderItem={renderItem}
      renderTrigger={(isOpen) => (
        <div
          className={`flex ${tokens.length > 1 ? "cursor-pointer hover:bg-gray-50" : ""} items-center gap-1.5 rounded-full bg-white/5 py-1.5 pr-3 pl-1.5 shadow-sm`}
        >
          <TokenDisplay logoURI={value.logoURI} symbol={value.symbol} />
          {tokens.length > 1 && (
            <ChevronIcon direction={isOpen ? "up" : "down"} />
          )}
        </div>
      )}
      triggerId={t("pages.swap.select-option")}
      value={value}
    />
  );
};
