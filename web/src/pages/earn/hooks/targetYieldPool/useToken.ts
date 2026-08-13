import { useVaultPeggedToken } from "hooks/useVaultPeggedToken";

import { targetYieldVaultReadAddress } from "../../targetYieldVaults";

export const useToken = () => useVaultPeggedToken(targetYieldVaultReadAddress);
