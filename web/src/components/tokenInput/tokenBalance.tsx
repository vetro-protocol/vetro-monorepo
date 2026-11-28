import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import type { Token } from "@vetro-protocol/core";
import { RenderCryptoValue } from "components/base/cryptoValue";
import { useTranslation } from "react-i18next";

import { Balance } from "./balance";

type Props = {
  label?: string;
  token: Token;
};

export const TokenBalance = function ({ label, token }: Props) {
  const { t } = useTranslation();

  const { data: balance, status } = useTokenBalance({
    address: token.address,
    chainId: token.chainId,
  });

  return (
    <Balance
      label={label ?? t("common.balance")}
      value={
        <RenderCryptoValue status={status} token={token} value={balance} />
      }
    />
  );
};
