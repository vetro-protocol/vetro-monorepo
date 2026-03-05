import * as graphql from "./graphql.ts";

const morphoApiUrl = "https://api.morpho.org/graphql";

export async function getLoanAssetAddress({
  marketId,
}: {
  marketId: string;
}): Promise<string> {
  const query = `
      query ($marketId: String!) {
        marketByUniqueKey(uniqueKey: $marketId) {
          loanAsset {
            address
          }
        }
    }`;
  const variables = {
    marketId,
  };
  const { marketByUniqueKey } = await graphql.runQuery<{
    marketByUniqueKey: {
      loanAsset: {
        address: string;
      };
    };
  }>(morphoApiUrl, query, variables);
  return marketByUniqueKey.loanAsset.address;
}

export async function getHistoricalBorrowApy({
  interval,
  marketId,
  startTimestamp,
}: {
  interval: string;
  marketId: string;
  startTimestamp: number;
}): Promise<
  {
    x: number;
    y: number;
  }[]
> {
  const query = `
    query ($marketId: String!, $options: TimeseriesOptions) {
        marketByUniqueKey(uniqueKey: $marketId) {
          historicalState {
            borrowApy(options: $options) {
              x
              y
            }
          }
        }
    }`;
  const variables = {
    marketId,
    options: {
      interval,
      startTimestamp,
    },
  };
  const { marketByUniqueKey } = await graphql.runQuery<{
    marketByUniqueKey: {
      historicalState: {
        borrowApy: {
          x: number;
          y: number;
        }[];
      };
    };
  }>(morphoApiUrl, query, variables);
  return marketByUniqueKey.historicalState.borrowApy;
}
