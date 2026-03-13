import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

import { getTotalAssets, getTotalSupply } from "./contracts.ts";
import {
  getStrategies,
  getStrategyConfig,
  getTotalDebt,
  getVaultName,
} from "./vesper.ts";
import {
  getPrice,
  getTokenConfig,
  getTreasury,
  getWhitelistedTokens,
  getWithdrawable,
  sVusdAddress,
  vusdAddress,
} from "./vusd.ts";

/**
 * Get the total VUSD minted and staked to calculate the TVL in the protocol.
 */
export async function getTotals({ url }: { url: string | undefined }) {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(url),
  });
  const [vusdMinted, vusdStaked] = await Promise.all([
    getTotalSupply(client, vusdAddress),
    getTotalAssets(client, sVusdAddress),
  ]);
  return {
    vusdMinted,
    vusdStaked,
  };
}

/**
 * Get the composition of the treasury by whitelisted token. For each token, get
 * holding data, the latest price and the information about each active
 * strategy. This is useful to understand the distribution of assets and
 * strategies in it, and draw compelling visualizations.
 */
export async function getTreasuryComposition({
  url,
}: {
  url: string | undefined;
}) {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(url),
  });
  const treasuryAddress = await getTreasury(client);
  const whitelistedTokens = await getWhitelistedTokens(client, treasuryAddress);
  return Promise.all(
    whitelistedTokens.map(async function (tokenAddress) {
      const [[vaultAddress], withdrawable, [latestPrice]] = await Promise.all([
        getTokenConfig(client, treasuryAddress, tokenAddress),
        getWithdrawable(client, treasuryAddress, tokenAddress),
        getPrice(client, treasuryAddress, tokenAddress),
      ]);
      const [strategies, totalDebt] = await Promise.all([
        getStrategies(client, vaultAddress),
        getTotalDebt(client, vaultAddress),
      ]);
      const strategyData = await Promise.all(
        strategies.map((strategyAddress) =>
          Promise.all([
            getStrategyConfig(client, vaultAddress, strategyAddress),
            getVaultName(client, strategyAddress),
          ]),
        ),
      );
      const activeStrategies = strategyData
        .filter(([strategyConfig]) => strategyConfig.active)
        .map(([strategyConfig, strategyName]) => ({
          name: strategyName.replaceAll("_", " "),
          totalDebt: strategyConfig.totalDebt,
        }));
      return {
        activeStrategies,
        latestPrice,
        tokenAddress,
        totalDebt,
        withdrawable,
      };
    }),
  );
}
