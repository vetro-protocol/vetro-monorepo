import { type Address } from "viem";
import { mainnet } from "viem/chains";

import * as graphql from "./graphql.ts";

const lagoonApiUrl = "https://api.lagoon.finance/query";

type Apr = { linearNetAprWithoutExtraYields: number | null };

const daysPerYear = 365;

const compound = (apr: number) =>
  ((1 + apr / 100 / daysPerYear) ** daysPerYear - 1) * 100;

export async function getVaultNetApys(addresses: Address[]) {
  const query = `
    query ($addresses: [Address!], $chainId: Int!) {
      vaults(where: { address_in: $addresses, chainId_eq: $chainId }) {
        items {
          address
          state {
            inceptionApr {
              linearNetAprWithoutExtraYields
            }
            monthlyApr {
              linearNetAprWithoutExtraYields
            }
          }
        }
      }
    }`;
  const variables = {
    addresses,
    chainId: mainnet.id,
  };
  const { vaults } = await graphql.runQuery<{
    vaults: {
      items: {
        address: Address;
        state: { inceptionApr: Apr; monthlyApr: Apr };
      }[];
    };
  }>({ query, url: lagoonApiUrl, variables });
  return vaults.items.flatMap(function ({ address, state }) {
    const apr =
      state.monthlyApr.linearNetAprWithoutExtraYields ??
      state.inceptionApr.linearNetAprWithoutExtraYields;
    return apr === null ? [] : [{ address, apy: compound(apr) }];
  });
}
