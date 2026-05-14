import { TokenSelectorModal } from "components/tokenSelectorModal";
import { useTranslation } from "react-i18next";
import { type Token } from "types";

type Props<T extends Token = Token> = {
  onChange: (token: T) => void;
  tokens: T[];
  value: T;
};

export const TokenDropdown = function <T extends Token = Token>({
  onChange,
  tokens,
  value,
}: Props<T>) {
  const { t } = useTranslation();

  return (
    <TokenSelectorModal
      onChange={onChange}
      tokens={tokens}
      triggerLabel={t("pages.swap.select-option")}
      value={value}
    />
  );
};
