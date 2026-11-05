import { BigInt } from "@graphprotocol/graph-ts";

// veHEMI's SIX_DAYS (YEAR / 60), the grid lock ends are rounded down to.
// See https://github.com/hemilabs/veHEMI/blob/c6a65c74154377e8720f584b364bdc109fbdedc5/src/VeHemi.sol#L89
const sixDays = BigInt.fromI32(525960);

class UnlockTimeParams {
  lockTime: BigInt = BigInt.zero();
  start: BigInt = BigInt.zero();
}

export const getUnlockTime = (params: UnlockTimeParams): BigInt =>
  params.start.plus(params.lockTime).div(sixDays).times(sixDays);
