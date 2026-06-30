import { VictoryPie, VictoryTooltip } from "victory";
import { formatUnits } from "viem";

import { useTokenPrices } from "../../hooks/useTokenPrices";
import { useTrackedTokens } from "../../hooks/useTrackedTokens";
import {
  computeDistributions,
  type TokenDistribution as TokenDistributionData,
} from "../../lib/distribution";
import { formatPercent, formatTokenAmount, formatUsd } from "../../lib/format";
import { type TrackedPool } from "../../lib/types";

import { TokenIcon } from "./tokenIcon";

type Props = {
  pools: TrackedPool[];
};

// Slice colors, reused by the pie and its legend.
const COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#db2777",
  "#7c3aed",
  "#0891b2",
  "#dc2626",
  "#65a30d",
  "#c026d3",
  "#0d9488",
  "#ea580c",
  "#4f46e5",
];

const DistributionCard = function ({
  distribution,
  price,
}: {
  distribution: TokenDistributionData;
  price: number | undefined;
}) {
  const { slices, token } = distribution;
  const totalBalance = Number(
    formatUnits(distribution.totalBalance, token.decimals),
  );
  const totalUsd = price !== undefined ? totalBalance * price : undefined;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-x-2">
        <TokenIcon address={token.address} symbol={token.symbol} />
        <h4 className="font-semibold text-neutral-950">{token.symbol}</h4>
      </div>

      {slices.length > 1 ? (
        <div className="mx-auto w-full max-w-55">
          <VictoryPie
            colorScale={COLORS}
            data={slices.map(function (slice) {
              const balance = Number(
                formatUnits(slice.balance, token.decimals),
              );
              return {
                balance,
                usd: price !== undefined ? balance * price : undefined,
                x: slice.pool.name,
                y: slice.share * 100,
              };
            })}
            height={220}
            innerRadius={55}
            labelComponent={
              <VictoryTooltip
                cornerRadius={6}
                flyoutStyle={{ fill: "#ffffff", stroke: "#e5e5e5" }}
                style={{ fontSize: 11 }}
              />
            }
            labels={({ datum }) =>
              [
                datum.x,
                `${formatTokenAmount(datum.balance)} ${token.symbol}`,
                datum.usd !== undefined ? formatUsd(datum.usd) : undefined,
              ]
                .filter(Boolean)
                .join("\n")
            }
            padding={20}
            width={220}
          />
        </div>
      ) : (
        <p className="mt-3 text-sm text-neutral-600">100% in a single pool.</p>
      )}

      <ul className="mt-3 space-y-1 text-xs">
        {slices.map((slice, index) => (
          <li
            className="flex items-center justify-between gap-x-2"
            key={slice.pool.address}
          >
            <span className="flex min-w-0 items-center gap-x-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="truncate text-neutral-700">
                {slice.pool.name}
              </span>
            </span>
            <span className="shrink-0 font-medium text-neutral-950">
              {formatPercent(slice.share * 100)}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 border-t border-neutral-100 pt-2 text-xs text-neutral-500">
        Total tracked:{" "}
        <span className="font-medium text-neutral-700">
          {formatTokenAmount(totalBalance)} {token.symbol}
          {totalUsd !== undefined ? ` (${formatUsd(totalUsd)})` : ""}
        </span>
      </p>
    </div>
  );
};

export const TokenDistribution = function ({ pools }: Props) {
  const { data: tokens } = useTrackedTokens();
  const { data: prices } = useTokenPrices();

  if (!tokens) {
    return null;
  }

  const distributions = computeDistributions({ pools, tokens }).filter(
    (distribution) => distribution.slices.length > 0,
  );

  if (distributions.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {distributions.map((distribution) => (
        <DistributionCard
          distribution={distribution}
          key={distribution.token.address}
          price={prices?.[distribution.token.address.toLowerCase()]}
        />
      ))}
    </div>
  );
};
