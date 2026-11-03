import { BigInt } from "@graphprotocol/graph-ts";

// veHEMI's SIX_DAYS (YEAR / 60), the grid lock ends are rounded down to.
// See https://github.com/hemilabs/veHEMI/blob/c6a65c74154377e8720f584b364bdc109fbdedc5/src/VeHemi.sol#L89
const sixDays = BigInt.fromI32(525960);

export const getUnlockTime = (start: BigInt, lockTime: BigInt): BigInt =>
  start.plus(lockTime).div(sixDays).times(sixDays);
