import type { Address, Client, Hash, WalletClient } from "viem";

import { getMarketParams } from "./actions/public/getMarketParams.ts";
import {
  type BorrowAssetsParams,
  borrowAssets,
} from "./actions/wallet/borrowAssets.ts";
import {
  type RepayAssetsParams,
  repayAssets,
} from "./actions/wallet/repayAssets.ts";
import {
  type SupplyCollateralParams,
  supplyCollateral,
} from "./actions/wallet/supplyCollateral.ts";
import {
  type SupplyCollateralAndBorrowParams,
  supplyCollateralAndBorrow,
} from "./actions/wallet/supplyCollateralAndBorrow.ts";
import {
  type WithdrawCollateralParams,
  withdrawCollateral,
} from "./actions/wallet/withdrawCollateral.ts";

export { morphoBlueAbi } from "./abi/morphoBlueAbi.ts";

export { getMarketParams } from "./actions/public/getMarketParams.ts";

export {
  type BorrowAssetsEvents,
  type MarketParams,
  type RepayAssetsEvents,
  type SupplyCollateralAndBorrowEvents,
  type SupplyCollateralEvents,
  type WithdrawCollateralEvents,
} from "./types.ts";

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
