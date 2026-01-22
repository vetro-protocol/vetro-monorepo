import type { Client, WalletClient } from "viem";
import {
  getPeggedToken,
  getMintFee,
  getRedeemFee,
  previewDeposit,
  previewRedeem,
} from "./actions/public/index.js";
import { deposit, redeem } from "./actions/wallet/index.js";

// Export ABI
export { gatewayAbi } from "./abi/gatewayAbi.js";

// Export factory functions for .extend() pattern
export function gatewayPublicActions() {
  return (client: Client) => ({
    getPeggedToken: (params: Parameters<typeof getPeggedToken>[1]) =>
      getPeggedToken(client, params),
    getMintFee: (params: Parameters<typeof getMintFee>[1]) =>
      getMintFee(client, params),
    getRedeemFee: (params: Parameters<typeof getRedeemFee>[1]) =>
      getRedeemFee(client, params),
    previewDeposit: (params: Parameters<typeof previewDeposit>[1]) =>
      previewDeposit(client, params),
    previewRedeem: (params: Parameters<typeof previewRedeem>[1]) =>
      previewRedeem(client, params),
  });
}

export function gatewayWalletActions() {
  return (client: WalletClient) => ({
    deposit: (params: Parameters<typeof deposit>[1]) => deposit(client, params),
    redeem: (params: Parameters<typeof redeem>[1]) => redeem(client, params),
  });
}
