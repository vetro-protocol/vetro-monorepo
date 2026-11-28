import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  assert,
  beforeEach,
  clearStore,
  describe,
  newMockEvent,
  test,
} from "matchstick-as/assembly/index";

import { handleLock } from "../src/mappings/veVetro";
import {
  handleClaimed,
  handlePositionClaimed,
} from "../src/mappings/veVetroDistributor";

import {
  createClaimedEvent,
  createLockEvent,
  createPositionClaimedEvent,
} from "./utils";

const claimantString = "0x1111111111111111111111111111111111111111";
const claimant = Address.fromString(claimantString);
const recipientString = "0x2222222222222222222222222222222222222222";
const recipient = Address.fromString(recipientString);

// Every mock event has the same transaction hash, as in a batch of claims
const transactionHash = newMockEvent().transaction.hash;

const claimId = (logIndex: i32): string =>
  transactionHash.concatI32(logIndex).toHexString();

function mint(tokenId: i32): void {
  handleLock(
    createLockEvent({
      account: recipient,
      amount: BigInt.fromI32(1000),
      lockTime: BigInt.fromI32(31557600),
      start: BigInt.fromI32(1793577600),
      tokenId: BigInt.fromI32(tokenId),
      transferable: false,
    }),
  );
}

describe("VeVetroDistributor", function () {
  beforeEach(function () {
    clearStore();
  });

  test("links the claimed veHEMI positions and the minted position to the claim", function () {
    handlePositionClaimed(
      createPositionClaimedEvent({
        claimant,
        share: BigInt.fromI32(100),
        tokenId: BigInt.fromI32(1),
        weight: BigInt.fromI32(10),
      }),
    );
    handlePositionClaimed(
      createPositionClaimedEvent({
        claimant,
        share: BigInt.fromI32(200),
        tokenId: BigInt.fromI32(2),
        weight: BigInt.fromI32(20),
      }),
    );
    mint(5);
    handleClaimed(
      createClaimedEvent({
        amount: BigInt.fromI32(300),
        claimant,
        logIndex: 9,
        recipient,
        targetTokenId: BigInt.fromI32(5),
      }),
    );

    const claim = claimId(9);
    assert.entityCount("Claim", 1);
    assert.fieldEquals("Claim", claim, "amount", "300");
    assert.fieldEquals("Claim", claim, "claimant", claimantString);
    assert.fieldEquals("Claim", claim, "position", "5");
    assert.fieldEquals("Claim", claim, "recipient", recipientString);

    assert.entityCount("ClaimedVeHemiPosition", 2);
    assert.fieldEquals("ClaimedVeHemiPosition", "1", "claim", claim);
    assert.fieldEquals(
      "ClaimedVeHemiPosition",
      "1",
      "claimant",
      claimantString,
    );
    assert.fieldEquals("ClaimedVeHemiPosition", "1", "share", "100");
    assert.fieldEquals("ClaimedVeHemiPosition", "1", "weight", "10");
    assert.fieldEquals("ClaimedVeHemiPosition", "2", "claim", claim);
    assert.fieldEquals("ClaimedVeHemiPosition", "2", "share", "200");
    assert.fieldEquals("ClaimedVeHemiPosition", "2", "weight", "20");

    assert.fieldEquals("VeVetroPosition", "5", "claim", claim);
    assert.entityCount("PendingClaim", 0);
  });

  test("splits the claims of a batch by the previous Claimed of the transaction", function () {
    handlePositionClaimed(
      createPositionClaimedEvent({
        claimant,
        share: BigInt.fromI32(100),
        tokenId: BigInt.fromI32(1),
        weight: BigInt.fromI32(10),
      }),
    );
    mint(5);
    handleClaimed(
      createClaimedEvent({
        amount: BigInt.fromI32(100),
        claimant,
        logIndex: 4,
        recipient,
        targetTokenId: BigInt.fromI32(5),
      }),
    );
    handlePositionClaimed(
      createPositionClaimedEvent({
        claimant,
        share: BigInt.fromI32(200),
        tokenId: BigInt.fromI32(2),
        weight: BigInt.fromI32(20),
      }),
    );
    handlePositionClaimed(
      createPositionClaimedEvent({
        claimant,
        share: BigInt.fromI32(300),
        tokenId: BigInt.fromI32(3),
        weight: BigInt.fromI32(30),
      }),
    );
    mint(6);
    handleClaimed(
      createClaimedEvent({
        amount: BigInt.fromI32(500),
        claimant,
        logIndex: 11,
        recipient,
        targetTokenId: BigInt.fromI32(6),
      }),
    );

    const first = claimId(4);
    const second = claimId(11);
    assert.entityCount("Claim", 2);
    assert.fieldEquals("ClaimedVeHemiPosition", "1", "claim", first);
    assert.fieldEquals("ClaimedVeHemiPosition", "2", "claim", second);
    assert.fieldEquals("ClaimedVeHemiPosition", "3", "claim", second);
    assert.fieldEquals("VeVetroPosition", "5", "claim", first);
    assert.fieldEquals("VeVetroPosition", "6", "claim", second);
    assert.entityCount("PendingClaim", 0);
  });
});
