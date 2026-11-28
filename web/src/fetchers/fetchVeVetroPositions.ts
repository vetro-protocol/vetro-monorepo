import fetch from "fetch-plus-plus";
import type { Address } from "viem";

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

type VeVetroResponse = {
  positions: {
    amount: string;
    status: "active" | "withdrawn";
    tokenId: string;
    unlockTime: number;
  }[];
};

export const fetchVeVetroPositions = async function (account: Address) {
  const { positions } = (await fetch(
    `${apiUrl}/ve-vetro/${account}`,
  )) as VeVetroResponse;
  return positions
    .filter(({ status }) => status === "active")
    .map(({ amount, tokenId, unlockTime }) => ({
      amount: BigInt(amount),
      tokenId: BigInt(tokenId),
      unlockTime,
    }));
};
