import { type MarketId } from "@morpho-org/blue-sdk";
import { fetchAccrualPosition } from "@morpho-org/blue-sdk-viem";
import { type Address, type Client, type Hash } from "viem";

export async function readPosition({
  account,
  block,
  client,
  marketId,
}: {
  account: Address;
  block: { number: bigint; timestamp: bigint };
  client: Client;
  marketId: Hash;
}) {
  const position = (
    await fetchAccrualPosition(account, marketId as MarketId, client, {
      blockNumber: block.number,
    })
  ).accrueInterest(block.timestamp);
  const { liquidity } = position.market;
  const { maxBorrowableAssets } = position;
  const hasDebt = position.borrowShares > 0n;
  return {
    borrowAssets: position.borrowAssets,
    borrowShares: position.borrowShares,
    collateral: position.collateral,
    healthFactor: hasDebt ? (position.healthFactor ?? null) : null,
    liquidationPrice: position.liquidationPrice,
    ltv: position.ltv ?? null,
    marketId,
    maxBorrow:
      maxBorrowableAssets === undefined
        ? null
        : maxBorrowableAssets < liquidity
          ? maxBorrowableAssets
          : liquidity,
    withdrawableCollateral: hasDebt
      ? (position.withdrawableCollateral ?? null)
      : position.collateral,
  };
}
