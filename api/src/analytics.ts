import { stakingVaultAddresses } from "@vetro-protocol/earn";
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
import {
  asset,
  balanceOf,
  previewRedeem,
  totalAssets,
  totalSupply,
} from "viem-erc4626/actions";

import { getPrice } from "./chainlink.ts";
import {
  getStrategies,
  getStrategyConfig,
  getTotalDebt,
  getVaultName,
} from "./vesper.ts";
import {
  ummRoleAddress,
  vetroMultisigAddress,
  vusdAddress,
  vusdMetaAddress,
  yieldDistributorAddress,
} from "./vusd.ts";

// Find the staking vault whose underlying asset matches the given pegged token.
async function findStakingVaultForPeggedToken({
  client,
  peggedTokenAddress,
}: {
  client: PublicClient;
  peggedTokenAddress: Address;
}) {
  const assets = await Promise.all(
    stakingVaultAddresses.map((address) => asset(client, { address })),
  );
  const stakingVaultAddress = stakingVaultAddresses.find(
    (_, index) =>
      assets[index].toLowerCase() === peggedTokenAddress.toLowerCase(),
  );
  if (!stakingVaultAddress) {
    throw new Error(
      `No staking vault found for pegged token ${peggedTokenAddress}`,
    );
  }
  return stakingVaultAddress;
}

/**
 * Get the total pegged token minted and staked for a given gateway, used to
 * calculate the TVL contributed by that pegged token to the protocol.
 */
export async function getTotals({
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
  const peggedTokenAddress = await getPeggedToken(client, {
    address: gatewayAddress,
  });
  const stakingVaultAddress = await findStakingVaultForPeggedToken({
    client,
    peggedTokenAddress,
  });
  const [minted, staked] = await Promise.all([
    totalSupply(client, { address: peggedTokenAddress }),
    totalAssets(client, { address: stakingVaultAddress }),
  ]);
  return {
    minted,
    staked,
  };
}

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
  treasuryAddress,
}: {
  client: PublicClient;
  treasuryAddress: Address;
}) {
  const strategicReserveAddresses = [
    treasuryAddress,
    ummRoleAddress,
    vetroMultisigAddress,
  ] as `0x${string}`[];
  const vusdMetaBalancePromises = strategicReserveAddresses.map((account) =>
    balanceOf(client, { account, address: vusdMetaAddress }),
  );
  const vusdMetaBalances = await Promise.all(vusdMetaBalancePromises);
  const totalVusdMetaBalance = vusdMetaBalances.reduce(
    (acc, balance) => acc + balance,
    0n,
  );
  return previewRedeem(client, {
    address: vusdMetaAddress,
    shares: totalVusdMetaBalance,
  });
}

async function getSurplus({
  client,
  treasuryAddress,
}: {
  client: PublicClient;
  treasuryAddress: Address;
}) {
  const surplusAddresses = [
    treasuryAddress,
    ummRoleAddress,
    yieldDistributorAddress,
  ] as `0x${string}`[];
  const surplusBalancePromises = surplusAddresses.map((account) =>
    balanceOf(client, { account, address: vusdAddress }),
  );
  const surplusBalances = await Promise.all(surplusBalancePromises);
  return surplusBalances.reduce((acc, balance) => acc + balance, 0n);
}

/**
 * The strategic reserves are the mark-to-market value of VUSDmeta receipts held
 * by the Treasury, the UMM role and the Operator (multisig). The protocol
 * surplus is any VUSD held in the Treasury or UMM or YieldDistributor.
 *
 * This is useful to understand the health of the protocol and its ability to
 * cover redemptions.
 */
export async function getBackingVusd({ url }: { url: string | undefined }) {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(url),
  });
  // TODO we may need to update this to work with multiple gateways.
  // See https://github.com/vetro-protocol/vetro-monorepo/issues/239
  const gatewayAddress = gatewayAddresses[0];
  const treasuryAddress = await getTreasury(client, {
    address: gatewayAddress,
  });
  const [strategicReserves, surplus] = await Promise.all([
    getStrategicReserves({ client, treasuryAddress }),
    getSurplus({ client, treasuryAddress }),
  ]);
  return {
    strategicReserves,
    surplus,
  };
}
