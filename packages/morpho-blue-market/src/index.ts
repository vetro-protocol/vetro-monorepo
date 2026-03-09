import type { Address, Client, Hash, WalletClient } from "viem";

import { getMarketParams } from "./actions/public/getMarketParams.js";
import {
  type BorrowAssetsParams,
  borrowAssets,
} from "./actions/wallet/borrowAssets.js";
import {
  type RepayAssetsParams,
  repayAssets,
} from "./actions/wallet/repayAssets.js";
import {
  type SupplyCollateralParams,
  supplyCollateral,
} from "./actions/wallet/supplyCollateral.js";
import {
  type SupplyCollateralAndBorrowParams,
  supplyCollateralAndBorrow,
} from "./actions/wallet/supplyCollateralAndBorrow.js";
import {
  type WithdrawCollateralParams,
  withdrawCollateral,
} from "./actions/wallet/withdrawCollateral.js";

export { morphoBlueAbi } from "./abi/morphoBlueAbi.js";

export { getMarketParams } from "./actions/public/getMarketParams.js";

export {
  type BorrowAssetsEvents,
  type MarketParams,
  type RepayAssetsEvents,
  type SupplyCollateralAndBorrowEvents,
  type SupplyCollateralEvents,
  type WithdrawCollateralEvents,
} from "./types.js";

export const morphoBluePublicActions = () => (client: Client) => ({
  getMarketParams: (params: { address: Address; marketId: Hash }) =>
    getMarketParams({ ...params, client }),
});

export const morphoBlueWalletActions = () => (client: WalletClient) => ({
  borrowAssets: (params: BorrowAssetsParams) => borrowAssets(client, params),
  repayAssets: (params: RepayAssetsParams) => repayAssets(client, params),
  supplyCollateral: (params: SupplyCollateralParams) =>
    supplyCollateral(client, params),
  supplyCollateralAndBorrow: (params: SupplyCollateralAndBorrowParams) =>
    supplyCollateralAndBorrow(client, params),
  withdrawCollateral: (params: WithdrawCollateralParams) =>
    withdrawCollateral(client, params),
});
