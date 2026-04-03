import { getGatewayAddress } from "@vetro-protocol/gateway";
import { getTreasury } from "@vetro-protocol/gateway/actions";
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
import { getTotalAssets, getTotalSupply } from "./contracts.ts";
import {
  getStrategies,
  getStrategyConfig,
  getTotalDebt,
  getVaultName,
} from "./vesper.ts";
import {
  sVusdAddress,
  ummRoleAddress,
  vetroMultisigAddress,
  vusdAddress,
  vusdMetaAddress,
  yieldDistributorAddress,
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
  const gatewayAddress = getGatewayAddress(mainnet.id);
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
          getPrice(client, oracleAddress), // call oracle.latestAnser() and assume 8 decimals
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
  const gatewayAddress = getGatewayAddress(mainnet.id);
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
