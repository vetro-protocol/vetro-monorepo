import { parseAsStringEnum, useQueryState } from "nuqs";
import type { StakeMode } from "pages/earn/components/stakeDrawer/types";

const stakeModeParser = parseAsStringEnum<StakeMode>(["deposit", "withdraw"]);

export const useStakeMode = () => useQueryState("stake", stakeModeParser);
