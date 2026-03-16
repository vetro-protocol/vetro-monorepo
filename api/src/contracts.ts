import { type Address, type PublicClient, erc20Abi, erc4626Abi } from "viem";

export const getTotalSupply = (client: PublicClient, address: Address) =>
  client.readContract({
    abi: erc20Abi,
    address,
    functionName: "totalSupply",
  });

export const getTotalAssets = (client: PublicClient, address: Address) =>
  client.readContract({
    abi: erc4626Abi,
    address,
    functionName: "totalAssets",
  });
