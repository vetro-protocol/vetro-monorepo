import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type DexPoolReward } from "@vetro-protocol/core";
import { renderToStaticMarkup } from "react-dom/server";
import { type Address } from "viem";
import { describe, expect, it } from "vitest";

import { tokenInfoOptions } from "../../hooks/useTokenInfo";
import { type DashboardPool } from "../../lib/types";

import { RewardsApr } from "./rewardsApr";

const crv: Address = "0xD533a949740bb3306d119CC777fa900bA034cd52";
const vusd: Address = "0xCa83DDE9c22254f58e771bE5E157773212AcBAc3";
const unknownMainnetToken: Address =
  "0x1111111111111111111111111111111111111111";
const cachedMainnetToken: Address =
  "0x3333333333333333333333333333333333333333";
const unknownHemiToken: Address = "0xAbCdEf0123456789aBcDeF0123456789AbCdEf01";

const gaugeReward: DexPoolReward = {
  apr: 3,
  aprMax: 7.5,
  source: "curveGauge",
  sourceMetadata: {
    gaugeAddress: "0x737e7700e03A8c451C9B72103554a40760F1B57A",
  },
  tokens: [{ address: crv, chainId: 1 }],
};

const stakeDaoReward: DexPoolReward = {
  apr: 12,
  source: "stakeDao",
  sourceMetadata: {
    strategyKey: "1-0x102a475c8d660fde678d108dcc6d4a2227661af2",
  },
  tokens: [
    { address: crv, chainId: 1 },
    { address: vusd, chainId: 1 },
  ],
};

const merklReward = (apr: number, id: string): DexPoolReward => ({
  apr,
  source: "merkl",
  sourceMetadata: {
    campaignId: `0x${id.repeat(64)}`,
    opportunityId: id,
  },
  tokens: [{ address: vusd, chainId: 1 }],
});

const pool = (rewards: DexPoolReward[]): DashboardPool => ({
  address: "0x8bEA2a46D56c321A216F97Ab6b61C34098B819d2",
  apr: null,
  chainId: 1,
  coins: [],
  dex: "curve",
  dexMetadata: {
    name: "VUSD-USDT",
    poolId: "factory-stable-ng-1",
    registryId: "factory-stable-ng",
  },
  feesUsd24h: null,
  id: "0x8bEA2a46D56c321A216F97Ab6b61C34098B819d2",
  isRangeView: false,
  name: "VUSD-USDT",
  poolType: "factory-stable-ng",
  rewards,
  tvlUsd: 100,
  url: "https://example.com",
  volumeUsd24h: 0,
});

const render = function (
  rewards: DexPoolReward[],
  queryClient = new QueryClient(),
) {
  const markup = renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <RewardsApr align="end" pool={pool(rewards)} />
    </QueryClientProvider>,
  );
  // Plain text of each reward line, without the tooltips.
  const lines = markup
    .replace(/<span[^>]*role="tooltip"[^>]*>[^<]*<\/span>/g, "")
    .split(/<span class="flex flex-wrap/)
    .slice(1)
    .map((line) =>
      line
        .replace(/^[^>]*>/, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .replace(/ \/ /g, "/")
        .trim(),
    );
  const tooltips = [...markup.matchAll(/role="tooltip">([^<]*)</g)].map(
    (match) => match[1],
  );
  return { lines, markup, tooltips };
};

const gaugeTooltip =
  "Curve gauge CRV emissions for LPs staked in the gauge: unboosted → max veCRV boost (2.5x).";
const stakeDaoTooltip =
  "StakeDAO strategy: boosted CRV plus extra rewards, excl. fees. An alternative to the Curve gauge, not added to it.";

describe("RewardsApr", function () {
  it("shows a dash when the pool has no rewards", function () {
    const { lines, markup, tooltips } = render([]);

    expect(lines).toEqual([]);
    expect(markup).toContain("—");
    expect(markup).not.toContain("%");
    expect(tooltips).toEqual([]);
  });

  it("renders the gauge range, the StakeDAO line, then the Merkl lines", function () {
    const { lines, markup, tooltips } = render([
      gaugeReward,
      stakeDaoReward,
      merklReward(8, "a"),
      merklReward(5, "b"),
    ]);

    expect(lines).toEqual([
      "3.00% → 7.50% CRV",
      "12.00% CRV/VUSD",
      "8.00% VUSD",
      "5.00% VUSD",
    ]);
    expect(markup).not.toContain("—");
    // Merkl lines have no tooltip.
    expect(tooltips).toEqual([gaugeTooltip, stakeDaoTooltip]);
  });

  it("keeps the API order without re-sorting", function () {
    const { lines } = render([
      merklReward(5, "b"),
      merklReward(8, "a"),
      stakeDaoReward,
    ]);

    expect(lines).toEqual(["5.00% VUSD", "8.00% VUSD", "12.00% CRV/VUSD"]);
  });

  it("collapses a reward whose aprMax equals its apr", function () {
    const { lines } = render([{ ...gaugeReward, apr: 4, aprMax: 4 }]);

    expect(lines).toEqual(["4.00% CRV"]);
  });

  it("reads an unknown Ethereum token's symbol from the token info", function () {
    const queryClient = new QueryClient();
    queryClient.setQueryData(tokenInfoOptions(cachedMainnetToken).queryKey, {
      address: cachedMainnetToken,
      decimals: 18,
      symbol: "SDT",
    });

    const { lines } = render(
      [
        {
          ...stakeDaoReward,
          tokens: [
            { address: crv, chainId: 1 },
            { address: cachedMainnetToken, chainId: 1 },
          ],
        },
      ],
      queryClient,
    );

    expect(lines).toEqual(["12.00% CRV/SDT"]);
  });

  it("falls back to the short address while the token info is missing", function () {
    const { lines } = render([
      {
        ...merklReward(8, "a"),
        tokens: [{ address: unknownMainnetToken, chainId: 1 }],
      },
    ]);

    expect(lines).toEqual(["8.00% 0x1111...1111"]);
  });

  it("shows the short address for an unknown token on another chain", function () {
    const { lines } = render([
      {
        ...merklReward(8, "a"),
        tokens: [{ address: unknownHemiToken, chainId: 43111 }],
      },
    ]);

    expect(lines).toEqual(["8.00% 0xAbCd...Ef01"]);
  });
});
