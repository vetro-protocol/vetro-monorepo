import { useQueries, useQueryClient } from "@tanstack/react-query";
import { stakingVaultAddresses } from "@vetro-protocol/earn";
import { Badge } from "components/base/badge";
import { RenderFiatValue } from "components/base/fiatValue";
import { TokenLogo } from "components/tokenLogo";
import { Tooltip } from "components/tooltip";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useMainnet } from "hooks/useMainnet";
import { stakedBalanceQueryOptions } from "hooks/useStakedBalance";
import { useTotalStakedUsd } from "hooks/useTotalStakedUsd";
import { useVaultPeggedToken } from "hooks/useVaultPeggedToken";
import { useTranslation } from "react-i18next";
import { formatUsd } from "utils/currency";
import { formatNumber } from "utils/format";
import { type Address, formatUnits } from "viem";
import { useAccount } from "wagmi";

import { BoltIcon } from "../../icons/boltIcon";
import { StatCard } from "../statCard";

type PoolRowProps = {
  balance: bigint;
  stakingVaultAddress: Address;
};

function PoolRow({ balance, stakingVaultAddress }: PoolRowProps) {
  const { data: peggedToken } = useVaultPeggedToken(stakingVaultAddress);

  if (!peggedToken) {
    return null;
  }

  const formattedTokenAmount = formatNumber(
    formatUnits(balance, peggedToken.decimals),
  );

  return (
    <div className="flex items-center gap-1 sm:min-w-52">
      <TokenLogo
        logoURI={peggedToken.logoURI}
        size="small"
        symbol={peggedToken.symbol}
      />
      <span className="text-xsm mr-auto font-medium text-white">
        {peggedToken.symbol}
      </span>
      <span className="text-xsm font-medium text-white">
        $<RenderFiatValue token={peggedToken} value={balance} />
      </span>
      <span className="text-xsm font-medium text-gray-400">
        ({formattedTokenAmount} {peggedToken.symbol})
      </span>
    </div>
  );
}

function FromPoolsBadge() {
  const { t } = useTranslation();
  const { address: account } = useAccount();
  const chain = useMainnet();
  const client = useEthereumClient();
  const queryClient = useQueryClient();

  const balanceQueries = useQueries({
    queries: stakingVaultAddresses.map((stakingVaultAddress) =>
      stakedBalanceQueryOptions({
        account,
        chainId: chain.id,
        client,
        queryClient,
        stakingVaultAddress,
      }),
    ),
  });

  const activeVaults = stakingVaultAddresses
    .map((stakingVaultAddress, idx) => ({
      balance: balanceQueries[idx].data,
      stakingVaultAddress,
    }))
    .filter(
      (vault): vault is PoolRowProps =>
        vault.balance !== undefined && vault.balance > 0n,
    );

  const count = activeVaults.length;

  if (count === 0) {
    return null;
  }

  return (
    <Tooltip
      content={
        <div className="flex flex-col gap-1">
          {activeVaults.map(({ balance, stakingVaultAddress }) => (
            <PoolRow
              balance={balance}
              key={stakingVaultAddress}
              stakingVaultAddress={stakingVaultAddress}
            />
          ))}
        </div>
      }
    >
      <Badge hoverable variant="gray">
        {t("pages.earn.stats.from-pools", { count })}
      </Badge>
    </Tooltip>
  );
}

export function StakedBalanceStat() {
  const { t } = useTranslation();
  const { data, isLoading } = useTotalStakedUsd();

  return (
    <StatCard
      badge={<FromPoolsBadge />}
      icon={<BoltIcon />}
      isLoading={isLoading}
      label={t("pages.earn.stats.staked-balance")}
      value={data !== undefined ? formatUsd(data) : ""}
    />
  );
}
