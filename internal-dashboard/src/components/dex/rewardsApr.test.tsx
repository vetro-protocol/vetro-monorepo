import { renderToStaticMarkup } from "react-dom/server";
import { type Address, zeroHash } from "viem";
import { describe, expect, it } from "vitest";

import { type PoolReward, type TrackedPool } from "../../lib/types";

import { RewardsApr } from "./rewardsApr";

const crv: Address = "0xD533a949740bb3306d119CC777fa900bA034cd52";
const gauge: Address = "0x737e7700e03A8c451C9B72103554a40760F1B57A";

const gaugeReward: PoolReward = {
  apr: 3,
  aprMax: 7.5,
  source: "curveGauge",
  sourceMetadata: { gaugeAddress: gauge },
  tokens: [{ address: crv, chainId: 1 }],
  tokenSymbols: "CRV",
};

const stakeDaoReward: PoolReward = {
  apr: 12,
  source: "stakeDao",
  sourceMetadata: { strategyKey: "1-0x102a" },
  tokens: [{ address: crv, chainId: 1 }],
  tokenSymbols: "CRV/YB",
};

const merklReward = ({
  apr,
  tokenSymbols,
}: {
  apr: number;
  tokenSymbols: string;
}): PoolReward => ({
  apr,
  source: "merkl",
  sourceMetadata: { campaignId: zeroHash, opportunityId: `${apr}` },
  tokens: [],
  tokenSymbols,
});

const render = (rewards: PoolReward[]) =>
  renderToStaticMarkup(
    <RewardsApr align="end" pool={{ rewards } as TrackedPool} />,
  );

const tooltipLabels = (markup: string) =>
  [...markup.matchAll(/role="tooltip">([^<]*)</g)].map((match) => match[1]);

const textOf = (markup: string) =>
  markup
    .replace(/<span role="tooltip">[^<]*<\/span>/g, "")
    .replace(/<[^>]+>/g, "|");

describe("RewardsApr", function () {
  it("shows a dash when the pool has no rewards", function () {
    expect(textOf(render([]))).toContain("—");
  });

  it("renders the gauge range, StakeDAO, then Merkl by APR, each with its tokens", function () {
    const text = textOf(
      render([
        merklReward({ apr: 5, tokenSymbols: "VUSD" }),
        stakeDaoReward,
        merklReward({ apr: 8, tokenSymbols: "OP" }),
        gaugeReward,
      ]),
    );

    const lines = [
      "3.00% → 7.50%",
      "CRV|",
      "12.00%",
      "CRV/YB",
      "8.00%",
      "OP",
      "5.00%",
      "VUSD",
    ];
    const positions = lines.map((line) => text.indexOf(line));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("adds a tooltip to the gauge and StakeDAO lines only", function () {
    const labels = tooltipLabels(
      render([
        gaugeReward,
        stakeDaoReward,
        merklReward({ apr: 5, tokenSymbols: "VUSD" }),
      ]),
    );

    expect(labels).toHaveLength(2);
    expect(labels[0]).toContain("Curve gauge CRV emissions");
    expect(labels[1]).toContain("StakeDAO strategy");
  });
});
