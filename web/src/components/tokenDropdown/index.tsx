import { useTranslation } from "react-i18next";
import { type Token } from "types";

import { ChevronIcon } from "../base/chevronIcon";
import { Dropdown } from "../base/dropdown";
import { TokenDisplay } from "../tokenDisplay";
import { TokenLogo } from "../tokenLogo";

type Props<T extends Token = Token> = {
  onChange: (token: T) => void;
  tokens: T[];
  value: T;
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

export const TokenDropdown = function <T extends Token = Token>({
  onChange,
  tokens,
  value,
}: Props<T>) {
  const { t } = useTranslation();

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
          className={`button-secondary flex ${tokens.length > 1 ? "cursor-pointer text-gray-500! hover:bg-gray-50! hover:text-neutral-900!" : ""} items-center gap-1.5 rounded-full py-1.5 pr-2 pl-1.5`}
        >
          <TokenDisplay logoURI={value.logoURI} symbol={value.symbol} />
          {tokens.length > 1 && (
            <div className="flex items-center">
              <ChevronIcon direction={isOpen ? "up" : "down"} />
            </div>
          )}
        </div>
      )}
      triggerId={t("pages.swap.select-option")}
      value={value}
    />
  );
};
