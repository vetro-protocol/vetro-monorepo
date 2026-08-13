import { ExternalLink } from "components/base/externalLink";
import { useMainnet } from "hooks/useMainnet";
import { useTranslation } from "react-i18next";
import { formatEvmAddress } from "utils/format";
import type { Address } from "viem";

import { PoolInfoItem } from "./poolInfoItem";

type Props = {
  address: Address;
};

export function PoolContract({ address }: Props) {
  const chain = useMainnet();
  const { t } = useTranslation();

  const explorerBaseUrl = chain.blockExplorers!.default.url;

  return (
    <div className="contents md:*:w-32">
      <PoolInfoItem label={t("pages.earn.pool-info.pool-contract")}>
        <ExternalLink
          className="text-xsm font-semibold text-gray-600 transition-colors hover:text-gray-900"
          href={`${explorerBaseUrl}/address/${address}`}
        >
          {formatEvmAddress(address)}
        </ExternalLink>
      </PoolInfoItem>
    </div>
  );
}
