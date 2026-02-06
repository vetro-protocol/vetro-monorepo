import config from "config";
import linearRegression from "simple-linear-regression";

import * as merkl from "./merkl.ts";
import parseBigIntStringToFloat from "./parse-bigint-string-to-float.ts";
import * as subgraph from "./subgraph.ts";

const secsPerDay = 86400;

/**
 * Query the subgraph. Get the last 7 days of data. Compute the APY using a
 * linear regression and getting the slope.
 */
export async function getApy() {
  const query = `
      query(
        $end: BigInt!,
        $start: BigInt!, 
      ) {
        vaultHistory(
          orderBy: timestamp,
          where: {
            timestamp_gte: $start,
            timestamp_lt: $end,
          }
        ) {
          timestamp
          shareValue
        }
      }
    `.replace(/\s+/g, "");
  const end = Math.floor(Date.now() / 1000);
  const start = end - (7 + 1) * secsPerDay + 1; // Window is 8 days to get 7 data points
  const variables = {
    end: end.toString(),
    start: start.toString(),
  };
  const history = await subgraph.runQuery(query, variables);
  if (!Array.isArray(history)) {
    throw new Error("Invalid subgraph response for vault history");
  }
  if (!history.length || history.length < 2) {
    return {
      "7d": 0,
    };
  }

  const days = history.map((h) => Math.floor(h.timestamp / secsPerDay));
  const values = history.map((h) => parseBigIntStringToFloat(h.shareValue, 18));
  const delta = linearRegression(days, values).a;
  const apy = ((delta * 365) / values[values.length - 1]) * 100;
  return {
    "7d": apy,
  };
}

/**
 * Gets all the Merkl rewards for the user that are associated with the Vetro
 * opportunity.
 */
export async function getUserRewards({ address }: { address: `0x${string}` }) {
  const opportunityId = config.get<string | undefined>("merkl.opportunityId");
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
}: {
  address: string;
}): Promise<ExitTicket[]> {
  const query = `
      query(
        $owner: Bytes!, 
      ) {
        exitTickets(
          orderBy: claimableAt,
          where: {
            owner: $owner,
          }
        ) {
          assets
          cancelTxHash
          claimableAt
          claimTxHash
          owner
          receiver
          requestId
          requestTxHash
          shares
        }
      }
    `.replace(/\s+/g, "");
  const variables = {
    owner: address.toLowerCase(),
  };
  const exitTickets = await subgraph.runQuery(query, variables);
  if (!Array.isArray(exitTickets)) {
    throw new Error(`Invalid subgraph response for exit tickets of ${address}`);
  }
  if (exitTickets.length === 100) {
    console.warn(
      `Got exactly 100 exit tickets for ${address}. Implement pagination!`,
    );
  }
  return exitTickets;
}
