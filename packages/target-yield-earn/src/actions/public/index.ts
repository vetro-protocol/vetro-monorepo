// The vault is an ERC-7540 async vault, so we re-export the ERC-7540 reads it supports
export { pendingDepositRequest } from "viem-erc7540/actions";

export * from "./getEpochId.js";
