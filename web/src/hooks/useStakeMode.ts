import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";
import type { StakeMode } from "pages/earn/components/stakeDrawer/types";

export const useStakeMode = () =>
  useQueryStates({
    stake: parseAsStringEnum<StakeMode>(["deposit", "withdraw"]),
    vault: parseAsString,
  });
