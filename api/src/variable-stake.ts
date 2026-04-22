import { getPeggedToken } from "@vetro-protocol/gateway/actions";
// @ts-expect-error Type declarations are not available for this dependency.
import linearRegression from "simple-linear-regression";
import { type Address, createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { convertToAssets } from "viem-erc4626/actions";

import * as graphql from "./graphql.ts";
import * as merkl from "./merkl.ts";
import parseBigIntStringToNumber from "./parse-bigint-string-to-number.ts";
import { findStakingVaultForPeggedToken } from "./staking-vault.ts";

const secsPerDay = 86400;

/**
 * Query the subgraph. Get the last 7 days of data. Compute the APY using a
 * linear regression and getting the slope.
 */
export async function getApy({ url }: { url: string }) {
  const query = `
    query ($end: BigInt!, $start: BigInt!) {
      vaultHistories(
        orderBy: timestamp
        where: { timestamp_gte: $start, timestamp_lt: $end }
      ) {
        timestamp
        shareValue
      }
    }`;
  const end = Math.floor(Date.now() / 1000);
  const start = end - (7 + 1) * secsPerDay + 1; // Window is 8 days to get 7 data points
  const variables = {
    end: end.toString(),
    start: start.toString(),
  };
  const { vaultHistories } = await graphql.runQuery<{
    vaultHistories: { timestamp: string; shareValue: string }[];
  }>(url, query, variables);
  if (!Array.isArray(vaultHistories)) {
    throw new Error("Invalid subgraph response for vault history");
  }
  if (!vaultHistories.length || vaultHistories.length < 2) {
    return {
      "7d": 0,
    };
  }

  const days = vaultHistories.map((h) =>
    Math.floor(Number.parseInt(h.timestamp) / secsPerDay),
  );
  const values = vaultHistories.map((h) =>
    parseBigIntStringToNumber(h.shareValue, 18),
  );
  const delta = linearRegression(days, values).a;
  if (Number.isNaN(delta)) {
    return {
      "7d": 0,
    };
  }

  const apy = ((delta * 365) / values[values.length - 1]) * 100;
  return {
    "7d": apy,
  };
}

/**
 * Gets all the Merkl rewards for the user that are associated with the Vetro
 * opportunity.
 */
export async function getUserRewards({
  address,
  opportunityId,
}: {
  address: Address;
  opportunityId?: string;
}) {
  if (!opportunityId) {
    return [];
  }

  const [{ campaigns }, allRewards] = await Promise.all([
    merkl.getOpportunityCampaigns({ opportunityId }),
    merkl.getUserRewards({ address, chainId: 1 }),
  ]);
  const campaignIds = campaigns.map((c) => c.campaignId);
  return allRewards
    .flatMap((r) => r.rewards)
    .filter((r) =>
      r.breakdowns.some((b) => campaignIds.includes(b.campaignId)),
    );
}

type ExitTicket = {
  assets: string;
  cancelTxHash?: Address;
  claimableAt: number;
  claimTxHash?: Address;
  id: string;
  owner: Address;
  receiver?: Address;
  requestId: string;
  requestTxHash: Address;
  shares: string;
  stakingVaultAddress: Address;
};

/**
 * Query the subgraph. Get all exit tickets for the user. No pagination is
 * supported. If more than 100 entities exist, pagination will have to be
 * implemented in the query. Then the function may have to support returning
 * paginated results too.
 */
export async function getUserExitTickets({
  address,
  url,
}: {
  address: string;
  url: string;
}): Promise<ExitTicket[]> {
  const query = `
    query ($owner: Bytes!) {
      exitTickets(orderBy: claimableAt, where: { owner: $owner }) {
        assets
        cancelTxHash
        claimableAt
        claimTxHash
        owner
        receiver
        requestId
        requestTxHash
        shares
        stakingVaultAddress
      }
    }`;
  const variables = {
    owner: address.toLowerCase(),
  };
  const { exitTickets } = await graphql.runQuery<{
    exitTickets: ExitTicket[];
  }>(url, query, variables);
  if (!Array.isArray(exitTickets)) {
    throw new Error(`Invalid subgraph response for exit tickets of ${address}`);
  }
  if (exitTickets.length === 100) {
    // TODO https://github.com/vetro-protocol/vetro-monorepo/issues/339
    console.warn(
      `Got exactly 100 exit tickets for ${address}. Implement pagination!`,
    );
  }
  return exitTickets;
}

/**
 * Queries the subgraph for all open exit tickets scoped to the given gateway's
 * staking vault and returns the number of open tickets and their combined
 * value in the vault's underlying asset (shares converted via the vault's
 * exchange rate).
 */
export async function getExitTicketQueueSize({
  gatewayAddress,
  rpcUrl,
  subgraphUrl,
}: {
  gatewayAddress: Address;
  rpcUrl: string | undefined;
  subgraphUrl: string;
}) {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl),
  });
  const peggedTokenAddress = await getPeggedToken(client, {
    address: gatewayAddress,
  });
  const stakingVaultAddress = await findStakingVaultForPeggedToken({
    client,
    peggedTokenAddress,
  });
  const query = `
    query ($stakingVault: Bytes!) {
      exitTickets(
        first: 100,
        where: {
          stakingVaultAddress: $stakingVault,
          cancelTxHash: null,
          claimTxHash: null
        }
      ) {
        shares
      }
    }`;
  const variables = { stakingVault: stakingVaultAddress.toLowerCase() };
  const { exitTickets } = await graphql.runQuery<{
    exitTickets: { shares: string }[];
  }>(subgraphUrl, query, variables);
  if (!Array.isArray(exitTickets)) {
    throw new Error(
      `Invalid subgraph response for exit tickets of vault ${stakingVaultAddress}`,
    );
  }
  // TODO https://github.com/vetro-protocol/vetro-monorepo/issues/339
  if (exitTickets.length === 100) {
    console.warn(
      `Got exactly 100 open exit tickets for vault ${stakingVaultAddress}. Implement pagination!`,
    );
  }
  const shares = exitTickets.reduce(
    (acc, ticket) => acc + BigInt(ticket.shares),
    0n,
  );
  const assets = await convertToAssets(client, {
    address: stakingVaultAddress,
    shares,
  });
  return {
    assets,
    openTickets: exitTickets.length,
  };
}
