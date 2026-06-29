import { getYieldDistributor } from "@vetro-protocol/earn/actions";
import { gatewayAddresses } from "@vetro-protocol/gateway";
import {
  getPeggedToken,
  getTreasury,
  previewRedeem as previewGatewayRedeem,
} from "@vetro-protocol/gateway/actions";
import {
  getTokenConfig,
  getWhitelistedTokens,
  getWithdrawable,
} from "@vetro-protocol/treasury/actions";
import { type Address, formatUnits, type PublicClient } from "viem";
import { decimals, totalSupply } from "viem-erc20/actions";
import { balanceOf, previewRedeem, totalAssets } from "viem-erc4626/actions";

import { getPrice } from "./chainlink.ts";
import { createMainnetClient } from "./mainnet-client.ts";
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
  const client = createMainnetClient(url);
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

async function getBacking({
  client,
  gatewayAddress,
  peggedTokenAddress,
  treasuryAddress,
}: {
  client: PublicClient;
  gatewayAddress: Address;
  peggedTokenAddress: Address;
  treasuryAddress: Address;
}) {
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
  const client = createMainnetClient(url);
  const [peggedTokenAddress, treasuryAddress] = await Promise.all([
    getPeggedToken(client, { address: gatewayAddress }),
    getTreasury(client, { address: gatewayAddress }),
  ]);
  return getBacking({
    client,
    gatewayAddress,
    peggedTokenAddress,
    treasuryAddress,
  });
}

// Converts the Treasury's whitelisted-token holdings into their pegged-token
// equivalent using the gateway's on-chain previewRedeem rate, mirroring the
// frontend's previous client-side calculation. A token whose redeem rate is
// zero is skipped to avoid dividing by zero.
async function getTreasuryTotal({
  client,
  gatewayAddress,
  oneUnit,
  treasuryAddress,
}: {
  client: PublicClient;
  gatewayAddress: Address;
  oneUnit: bigint;
  treasuryAddress: Address;
}) {
  const whitelistedTokens = await getWhitelistedTokens(client, {
    address: treasuryAddress,
  });
  const amounts = await Promise.all(
    whitelistedTokens.map(async function (token) {
      const [withdrawable, rate] = await Promise.all([
        getWithdrawable(client, { address: treasuryAddress, token }),
        previewGatewayRedeem(client, {
          address: gatewayAddress,
          peggedTokenIn: oneUnit,
          tokenOut: token,
        }),
      ]);
      return rate > 0n ? (withdrawable * oneUnit) / rate : 0n;
    }),
  );
  return amounts.reduce((acc, amount) => acc + amount, 0n);
}

/**
 * The collateralization ratio is the total backing value of a gateway's pegged
 * token divided by its circulating supply, expressed as a percentage. The
 * backing is the sum of the strategic reserves, the protocol surplus and the
 * liquid Treasury reserves (whitelisted holdings valued in the pegged token).
 *
 * Monetary fields are returned as raw bigints in the pegged token's base units;
 * only `ratio` is a number (a percentage). This moves the calculation
 * previously done on the frontend into the API so it can be cached and shared.
 */
export async function getCollateralizationRatio({
  gatewayAddress,
  url,
}: {
  gatewayAddress: Address;
  url: string | undefined;
}) {
  const client = createMainnetClient(url);
  const [peggedTokenAddress, treasuryAddress] = await Promise.all([
    getPeggedToken(client, { address: gatewayAddress }),
    getTreasury(client, { address: gatewayAddress }),
  ]);
  const peggedTokenDecimals = await decimals(client, {
    address: peggedTokenAddress,
  });
  const oneUnit = 10n ** BigInt(peggedTokenDecimals);

  const [{ strategicReserves, surplus }, supply, treasuryTotal] =
    await Promise.all([
      getBacking({
        client,
        gatewayAddress,
        peggedTokenAddress,
        treasuryAddress,
      }),
      totalSupply(client, { address: peggedTokenAddress }),
      getTreasuryTotal({ client, gatewayAddress, oneUnit, treasuryAddress }),
    ]);

  const total = strategicReserves + surplus + treasuryTotal;
  const ratio =
    supply > 0n
      ? (Number(formatUnits(total, peggedTokenDecimals)) /
          Number(formatUnits(supply, peggedTokenDecimals))) *
        100
      : 0;

  return {
    ratio,
    strategicReserves,
    supply,
    surplus,
    total,
    treasuryTotal,
  };
}

/**
 * The TVL is the circulating supply of a gateway's pegged token (its minted
 * total supply). Returned as a raw bigint in the pegged token's base units;
 * the client values it (e.g. in USD) and formats it. Moves the calculation
 * previously done on the frontend into the API so it can be cached and shared.
 */
export async function getTvl({
  gatewayAddress,
  url,
}: {
  gatewayAddress: Address;
  url: string | undefined;
}) {
  const client = createMainnetClient(url);
  const peggedTokenAddress = await getPeggedToken(client, {
    address: gatewayAddress,
  });
  const minted = await totalSupply(client, { address: peggedTokenAddress });
  return { minted };
}

/**
 * The staked total is the amount of a gateway's pegged token deposited into its
 * staking vault (the vault's ERC4626 total assets). Returned as a raw bigint in
 * the pegged token's base units; the client values it (e.g. in USD) and formats
 * it. Moves the calculation previously done on the frontend into the API so it
 * can be cached and shared.
 */
export async function getStaked({
  gatewayAddress,
  url,
}: {
  gatewayAddress: Address;
  url: string | undefined;
}) {
  const client = createMainnetClient(url);
  const peggedTokenAddress = await getPeggedToken(client, {
    address: gatewayAddress,
  });
  const stakingVaultAddress = await findStakingVaultForPeggedToken({
    client,
    peggedTokenAddress,
  });
  const staked = await totalAssets(client, { address: stakingVaultAddress });
  return { staked };
}
