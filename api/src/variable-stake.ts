import { stakingVaultAddresses } from "@vetro-protocol/earn";
import { getPeggedToken } from "@vetro-protocol/gateway/actions";
// @ts-expect-error Type declarations are not available for this dependency.
import linearRegression from "simple-linear-regression";
import {
  type Address,
  createPublicClient,
  checksumAddress,
  type Hash,
  http,
} from "viem";
import { mainnet } from "viem/chains";
import { convertToAssets } from "viem-erc4626/actions";

import * as graphql from "./graphql.ts";
import * as merkl from "./merkl.ts";
import parseBigIntStringToNumber from "./parse-bigint-string-to-number.ts";
import { findStakingVaultForPeggedToken } from "./staking-vault.ts";

const secsPerDay = 86400;

/**
 * Query the subgraph for the user's staking positions across all known vaults
 * and compute the average purchase price (totalCostBasis / shares) for each.
 * Returns an object keyed by vault address with the price as a BigInt string
 * in asset units (18 decimals). Defaults to "0" when the user has no position
 * or zero shares.
 */
export async function getAveragePurchasePrice({
  address,
  url,
}: {
  address: string;
  url: string;
}) {
  const query = `
    query ($owner: Bytes!, $vaults: [Bytes!]!) {
      userStakingPositions(
        where: { owner: $owner, stakingVaultAddress_in: $vaults }
      ) {
        shares
        stakingVaultAddress
        totalCostBasis
      }
    }`;
  const variables = {
    owner: address.toLowerCase(),
    vaults: stakingVaultAddresses.map((v) => v.toLowerCase()),
  };
  const { userStakingPositions } = await graphql.runQuery<{
    userStakingPositions: {
      shares: string;
      stakingVaultAddress: `0x${string}`;
      totalCostBasis: string;
    }[];
  }>(url, query, variables);
  if (!Array.isArray(userStakingPositions)) {
    throw new Error(
      `Invalid subgraph response for staking positions of ${address}`,
    );
  }
  // Pre-seed every known vault with "0" so the response shape is stable.
  const result = Object.fromEntries(
    stakingVaultAddresses.map((vault) => [vault, 0n]),
  );
  for (const position of userStakingPositions) {
    const shares = BigInt(position.shares);
    if (shares === 0n) {
      continue;
    }
    const totalCostBasis = BigInt(position.totalCostBasis);
    const averagePrice = totalCostBasis / shares;
    result[checksumAddress(position.stakingVaultAddress)] = averagePrice;
  }
  return result;
}

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
 * Every configured vault gets an entry in the result, with an empty array if
 * the user has no rewards for that vault (including vaults whose Merkl
 * opportunity id is not configured).
 */
export async function getUserRewards({
  address,
  vaultOpportunities,
}: {
  address: Address;
  vaultOpportunities: Record<Address, string | undefined>;
}) {
  const vaultEntries = Object.entries(vaultOpportunities) as [
    Address,
    string | undefined,
  ][];

  // Only vaults with a configured opportunity id need a campaigns lookup; the
  // rest will still appear in the response with an empty rewards array.
  const vaultsWithOpportunity = vaultEntries.filter(
    ([, opportunityId]) => !!opportunityId,
  ) as [Address, string][];

  // Pre-seed every configured vault with an empty array so the response shape
  // is stable: callers can rely on every vault key being present even when a
  // user has no rewards for it.
  const rewardsByVault: Record<
    Address,
    Awaited<ReturnType<typeof merkl.getUserRewards>>[number]["rewards"]
  > = Object.fromEntries(
    vaultEntries.map(([vaultAddress]) => [vaultAddress, []]),
  );

  // Skip the external Merkl call when no vault has a configured opportunity:
  // there are no campaigns to map rewards to, so the response is the
  // pre-seeded empties.
  if (vaultsWithOpportunity.length === 0) {
    return rewardsByVault;
  }

  // Each vault maps to one Merkl opportunity, and each opportunity contains
  // multiple campaigns. Resolve the campaigns for every configured opportunity,
  // in parallel with the user's full reward list.
  const [campaignsPerVault, allUserRewards] = await Promise.all([
    Promise.all(
      vaultsWithOpportunity.map(async function ([vaultAddress, opportunityId]) {
        const { campaigns } = await merkl.getOpportunityCampaigns({
          opportunityId,
        });
        return [vaultAddress, campaigns.map((c) => c.campaignId)] as const;
      }),
    ),
    merkl.getUserRewards({ address, chainId: mainnet.id }),
  ]);

  // Reverse index: campaignId -> vault. Merkl rewards reference campaigns (not
  // opportunities/vaults) in their breakdowns, so this is what lets us attribute
  // each reward back to a vault below.
  const campaignIdToVault = Object.fromEntries(
    campaignsPerVault.flatMap(([vaultAddress, campaignIds]) =>
      campaignIds.map((campaignId) => [campaignId, vaultAddress] as const),
    ),
  ) as Record<string, Address>;

  // Bucket each reward into the vault(s) it belongs to. A reward's breakdowns
  // can list multiple campaigns; `seen` prevents pushing the same reward twice
  // into the same vault when several breakdowns map to it.
  for (const userRewards of allUserRewards) {
    for (const reward of userRewards.rewards) {
      const seen = new Set<Address>();
      for (const breakdown of reward.breakdowns) {
        const vaultAddress = campaignIdToVault[breakdown.campaignId];
        if (vaultAddress && !seen.has(vaultAddress)) {
          seen.add(vaultAddress);
          rewardsByVault[vaultAddress].push(reward);
        }
      }
    }
  }

  return rewardsByVault;
}

type ExitTicket = {
  assets: string;
  cancelTxHash?: Hash;
  claimableAt: number;
  claimTxHash?: Hash;
  id: string;
  owner: Address;
  receiver?: Address;
  requestId: string;
  requestTxHash: Hash;
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
