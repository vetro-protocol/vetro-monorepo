import { useTranslation } from "react-i18next";
import { type Token } from "types";

import { Dropdown } from "../base/dropdown";
import { TokenDisplay } from "../tokenDisplay";
import { TokenLogo } from "../tokenLogo";

type TokenDropdownProps = {
  onChange: (token: Token) => void;
  tokens: Token[];
  value: Token;
};

const renderTrigger = (selectedToken: Token) => (
  <TokenDisplay logoURI={selectedToken.logoURI} symbol={selectedToken.symbol} />
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
