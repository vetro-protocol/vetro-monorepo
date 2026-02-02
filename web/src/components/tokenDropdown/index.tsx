import { useTranslation } from "react-i18next";
import { type Token } from "types";

import { Dropdown } from "../base/dropdown";
import { TokenLogo } from "../tokenLogo";

type TokenDropdownProps = {
  onChange: (token: Token) => void;
  tokens: Token[];
  value: Token;
};

const renderTrigger = (selectedToken: Token) => (
  <>
    <TokenLogo {...selectedToken} />
    <span className="text-sm font-semibold text-gray-900">
      {selectedToken.symbol}
    </span>
  </>
);

const renderItem = (token: Token) => (
  <>
    <div className="flex items-center gap-2">
      <TokenLogo {...token} />
      <span className="text-gray-500">{token.name}</span>
    </div>
    <span>{token.symbol}</span>
  </>
);

export const TokenDropdown = function ({
  onChange,
  tokens,
  value,
}: TokenDropdownProps) {
  const { t } = useTranslation();
  return (
    <Dropdown
      getItemKey={(token) => `${token.address}-${token.chainId}`}
      items={tokens}
      onChange={onChange}
      renderItem={renderItem}
      renderTrigger={renderTrigger}
      triggerId={t("pages.swap.select-option")}
      value={value}
    />
  );
};
