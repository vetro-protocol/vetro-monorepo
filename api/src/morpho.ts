import { mainnet } from "viem/chains";

import * as graphql from "./graphql.ts";

const morphoApiUrl = "https://api.morpho.org/graphql";

const chainId = mainnet.id;

export async function getLoanAssetAddress({
  marketId,
}: {
  marketId: string;
}): Promise<string> {
  const query = `
    query ($chainId: Int!, $marketId: String!) {
      marketById(marketId: $marketId, chainId: $chainId) {
        loanAsset {
          address
        }
      }
    }`;
  const variables = {
    chainId,
    marketId,
  };
  const { marketById } = await graphql.runQuery<{
    marketById: {
      loanAsset: {
        address: string;
      };
    };
  }>(morphoApiUrl, query, variables);
  return marketById.loanAsset.address;
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
    query ($chainId: Int!, $marketId: String!, $options: TimeseriesOptions) {
      marketById(marketId: $marketId, chainId: $chainId) {
        historicalState {
          borrowApy(options: $options) {
            x
            y
          }
        }
      }
    }`;
  const variables = {
    chainId,
    marketId,
    options: {
      interval,
      startTimestamp,
    },
  };
  const { marketById } = await graphql.runQuery<{
    marketById: {
      historicalState: {
        borrowApy: {
          x: number;
          y: number;
        }[];
      };
    };
  }>(morphoApiUrl, query, variables);
  return marketById.historicalState.borrowApy;
}

export async function getCollateralAssets({
  marketId,
}: {
  marketId: string;
}): Promise<number> {
  const query = `
    query ($chainId: Int!, $marketId: String!) {
      marketById(marketId: $marketId, chainId: $chainId) {
        state {
          collateralAssets
        }
      }
    }`;
  const variables = {
    chainId,
    marketId,
  };
  const { marketById } = await graphql.runQuery<{
    marketById: {
      state: {
        collateralAssets: number;
      };
    };
  }>(morphoApiUrl, query, variables);
  return marketById.state.collateralAssets;
}
