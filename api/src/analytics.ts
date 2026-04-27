import { getYieldDistributor } from "@vetro-protocol/earn/actions";
import { gatewayAddresses } from "@vetro-protocol/gateway";
import { getPeggedToken, getTreasury } from "@vetro-protocol/gateway/actions";
import {
  getTokenConfig,
  getWhitelistedTokens,
  getWithdrawable,
} from "@vetro-protocol/treasury/actions";
import {
  type Address,
  createPublicClient,
  http,
  type PublicClient,
} from "viem";
import { mainnet } from "viem/chains";
import { balanceOf, previewRedeem } from "viem-erc4626/actions";

import { getPrice } from "./chainlink.ts";
import { findStakingVaultForPeggedToken } from "./staking-vault.ts";
import {
  getStrategies,
  getStrategyConfig,
  getTotalDebt,
  getVaultName,
} from "./vesper.ts";
import {
  ummRoleAddress,
  vetroMultisigAddress,
  vusdMetaAddress,
} from "./vusd.ts";

/**
 * Get the composition of the treasury by whitelisted token. For each token, get
 * holding data, the latest price and the information about each active
 * strategy. This is useful to understand the distribution of assets and
 * strategies in it, and draw compelling visualizations.
 */
export async function getTreasuryComposition({
  gatewayAddress,
  url,
}: {
  gatewayAddress: Address;
  url: string | undefined;
}) {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(url),
  });
  const treasuryAddress = await getTreasury(client, {
    address: gatewayAddress,
  });
  const whitelistedTokens = await getWhitelistedTokens(client, {
    address: treasuryAddress,
  });
  return Promise.all(
    whitelistedTokens.map(async function (tokenAddress) {
      const [[vaultAddress, oracleAddress], withdrawable] = await Promise.all([
        getTokenConfig(client, {
          address: treasuryAddress,
          token: tokenAddress,
        }),
        getWithdrawable(client, {
          address: treasuryAddress,
          token: tokenAddress,
        }),
      ]);
      const [strategies, [latestPrice, priceDecimals], totalDebt] =
        await Promise.all([
          getStrategies(client, vaultAddress),
          getPrice(client, oracleAddress),
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
        priceDecimals,
        tokenAddress,
        totalDebt,
        withdrawable,
      };
    }),
  );
}

async function getStrategicReserves({
  client,
  gatewayAddress,
  treasuryAddress,
}: {
  client: PublicClient;
  gatewayAddress: Address;
  treasuryAddress: Address;
}) {
  if (gatewayAddress !== gatewayAddresses[0]) {
    return 0n;
  }
  const strategicReserveAddresses = [
    treasuryAddress,
    ummRoleAddress,
    vetroMultisigAddress,
  ] as Address[];
  const metaBalances = await Promise.all(
    strategicReserveAddresses.map((account) =>
      balanceOf(client, { account, address: vusdMetaAddress }),
    ),
  );
  const totalMetaBalance = metaBalances.reduce(
    (acc, balance) => acc + balance,
    0n,
  );
  return previewRedeem(client, {
    address: vusdMetaAddress,
    shares: totalMetaBalance,
  });
}

async function getSurplus({
  client,
  peggedTokenAddress,
  treasuryAddress,
  yieldDistributorAddress,
}: {
  client: PublicClient;
  peggedTokenAddress: Address;
  treasuryAddress: Address;
  yieldDistributorAddress: Address;
}) {
  const surplusAddresses = [
    treasuryAddress,
    ummRoleAddress,
    yieldDistributorAddress,
  ] as Address[];

  const surplusBalances = await Promise.all(
    surplusAddresses.map((account) =>
      balanceOf(client, { account, address: peggedTokenAddress }),
    ),
  );
  return surplusBalances.reduce((acc, balance) => acc + balance, 0n);
}

/**
 * The strategic reserves are the mark-to-market value of yield-bearing
 * receipts held by the Treasury, the UMM role and the Operator (multisig).
 * The protocol surplus is any pegged token held in the Treasury, UMM or
 * YieldDistributor.
 *
 * This is useful to understand the health of the protocol and its ability to
 * cover redemptions for the given gateway's pegged token.
 */
export async function getPeggedTokenBacking({
  gatewayAddress,
  url,
}: {
  gatewayAddress: Address;
  url: string | undefined;
}) {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(url),
  });
  const [peggedTokenAddress, treasuryAddress] = await Promise.all([
    getPeggedToken(client, { address: gatewayAddress }),
    getTreasury(client, { address: gatewayAddress }),
  ]);

  const [strategicReserves, surplus] = await Promise.all([
    getStrategicReserves({ client, gatewayAddress, treasuryAddress }),
    findStakingVaultForPeggedToken({
      client,
      peggedTokenAddress,
    })
      .then((stakingVaultAddress) =>
        getYieldDistributor(client, {
          address: stakingVaultAddress,
        }),
      )
      .then((yieldDistributorAddress) =>
        getSurplus({
          client,
          peggedTokenAddress,
          treasuryAddress,
          yieldDistributorAddress,
        }),
      ),
  ]);
  return {
    strategicReserves,
    surplus,
  };
}
