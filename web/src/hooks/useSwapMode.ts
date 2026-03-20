import { parseAsStringEnum, useQueryState } from "nuqs";

type SwapMode = "deposit" | "redeem";

const swapModeParser = parseAsStringEnum<SwapMode>([
  "deposit",
  "redeem",
]).withDefault("deposit");

export const useSwapMode = () => useQueryState("mode", swapModeParser);
