import { fetchGauges } from "../lib/curveApi";
import { type GaugeEmission } from "../lib/types";

const SECONDS_PER_DAY = 86_400;

// Normalizes every gauge's emission data, keyed by its pool address (lowercased)
// for cheap lookup from a pool detail view.
export const fetchGaugeEmissions = async function (): Promise<
  Record<string, GaugeEmission>
> {
  const gauges = await fetchGauges();

  const emissions: Record<string, GaugeEmission> = {};
  for (const gauge of gauges) {
    if (!gauge.pool) {
      continue;
    }
    const inflationRate = Number(gauge.inflationRate) / 1e18;
    const relativeWeight = Number(gauge.relativeWeight) / 1e18;
    const key = gauge.pool.toLowerCase();
    // A pool can expose several gauges (old/killed ones linger). Keep the one
    // emitting the most CRV so a dead gauge can't zero out an active pool.
    const existing = emissions[key];
    if (existing && existing.inflationRate >= inflationRate) {
      continue;
    }
    emissions[key] = {
      estCrvPerDay: inflationRate * relativeWeight * SECONDS_PER_DAY,
      inflationRate,
      relativeWeight,
    };
  }
  return emissions;
};
