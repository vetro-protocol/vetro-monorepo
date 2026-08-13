import { targetYieldVaultReadAddress } from "../../targetYieldVaults";
import { usePoolStakedAmount } from "../usePoolStakedAmount";

export const useStakedAmount = () =>
  usePoolStakedAmount(targetYieldVaultReadAddress);
