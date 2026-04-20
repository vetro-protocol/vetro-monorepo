// @ts-expect-error Type declarations are not available for this dependency.
import linearRegression from "simple-linear-regression";

import * as graphql from "./graphql.ts";
import * as merkl from "./merkl.ts";
import parseBigIntStringToNumber from "./parse-bigint-string-to-number.ts";

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
  address: `0x${string}`;
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
  cancelTxHash?: `0x${string}`;
  claimableAt: number;
  claimTxHash?: `0x${string}`;
  id: string;
  owner: `0x${string}`;
  receiver?: `0x${string}`;
  requestId: string;
  requestTxHash: `0x${string}`;
  shares: string;
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
        stakingVaultAddress,
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
 * Queries the subgraph for the precomputed queue summary singleton and returns
 * the total number of open exit tickets and their combined shares.
 */
export async function getExitTicketQueueSize({ url }: { url: string }) {
  const query = `
    {
      exitTicketQueueSummary(id: "singleton") {
        shares
        openTickets
      }
    }`;
  const { exitTicketQueueSummary } = await graphql.runQuery<{
    exitTicketQueueSummary: { shares: string; openTickets: number } | null;
  }>(url, query);
  if (!exitTicketQueueSummary) {
    return {
      openTickets: 0,
      shares: 0n,
    };
  }
  return {
    openTickets: exitTicketQueueSummary.openTickets,
    shares: BigInt(exitTicketQueueSummary.shares),
  };
}
