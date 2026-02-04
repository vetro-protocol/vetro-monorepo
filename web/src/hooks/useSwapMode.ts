import { parseAsStringEnum, useQueryState } from "nuqs";

export type SwapMode = "deposit" | "redeem";

const swapModeParser = parseAsStringEnum<SwapMode>([
  "deposit",
  "redeem",
]).withDefault("deposit");

export const useSwapMode = () => useQueryState("mode", swapModeParser);
