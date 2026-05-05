import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { Balance } from "components/tokenInput/balance";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { formatAmount } from "utils/token";

type Props = {
  token: Token;
};

export const ToTokenBalance = function ({ token }: Props) {
  const { t } = useTranslation();

  const { data: toTokenBalance, isError: isToTokenBalanceError } =
    useTokenBalance({
      address: token.address,
      chainId: token.chainId,
    });

  return (
    <Balance
      label={t("pages.swap.form.balance")}
      value={formatAmount({
        amount: toTokenBalance,
        decimals: token.decimals,
        isError: isToTokenBalanceError,
      })}
    />
  );
};
