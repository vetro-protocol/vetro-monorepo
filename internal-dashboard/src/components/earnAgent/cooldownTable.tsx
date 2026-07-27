import { formatUnits } from "viem";

import { type VaultCooldownPosition } from "../../fetchers/fetchEarnAgentStatus";
import { summarizeCooldown } from "../../lib/cooldownSummary";
import { formatDuration, formatTokenAmount } from "../../lib/format";
import { ExplorerLink } from "../dex/explorerLink";

import { CooldownStatusBadge } from "./cooldownStatusBadge";

type Props = {
  nowSeconds: number;
  vaults: VaultCooldownPosition[];
};

// Amounts are in the vault's underlying pegged token (that's what the vault
// locks during cooldown), so they carry the underlying's symbol, not the
// share's.
const formatBucket = function ({
  bucket,
  underlying,
}: {
  bucket: { assets: bigint; count: number };
  underlying: VaultCooldownPosition["underlying"];
}) {
  if (bucket.count === 0) {
    return "—";
  }
  const amount = formatTokenAmount(
    Number(formatUnits(bucket.assets, underlying.decimals)),
  );
  const requestLabel = bucket.count === 1 ? "request" : "requests";
  return `${bucket.count} ${requestLabel} · ${amount} ${underlying.symbol}`;
};

export const CooldownTable = ({ nowSeconds, vaults }: Props) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-neutral-200 text-xs font-medium text-neutral-500">
          <th className="py-2 pr-4 text-left font-medium">Vault</th>
          <th className="py-2 pr-4 text-right font-medium">In cooldown</th>
          <th className="py-2 pr-4 text-right font-medium">Ready to claim</th>
          <th className="py-2 pr-4 text-right font-medium">
            Oldest ready{" "}
            <span className="font-normal text-neutral-400">
              (since maturity)
            </span>
          </th>
          <th className="py-2 text-right font-medium">Status</th>
        </tr>
      </thead>
      <tbody>
        {vaults.map(function (vault) {
          const summary = summarizeCooldown({
            nowSeconds,
            requests: vault.requests,
          });
          return (
            <tr className="border-b border-neutral-100" key={vault.address}>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-x-2">
                  <span className="font-medium text-neutral-950">
                    {vault.symbol}
                  </span>
                  <span className="text-xs">
                    <ExplorerLink address={vault.address} />
                  </span>
                </div>
              </td>
              <td className="py-3 pr-4 text-right font-medium text-neutral-950">
                {formatBucket({
                  bucket: summary.inCooldown,
                  underlying: vault.underlying,
                })}
              </td>
              <td className="py-3 pr-4 text-right font-medium text-neutral-950">
                {formatBucket({
                  bucket: summary.ready,
                  underlying: vault.underlying,
                })}
              </td>
              <td
                className={`py-3 pr-4 text-right font-medium ${
                  summary.isKeeperBehind ? "text-amber-600" : "text-neutral-950"
                }`}
              >
                {summary.oldestReadySeconds !== undefined
                  ? formatDuration(summary.oldestReadySeconds)
                  : "—"}
              </td>
              <td className="py-3 text-right">
                <CooldownStatusBadge isBehind={summary.isKeeperBehind} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
