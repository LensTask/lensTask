import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { BountyInitialized } from "../generated/schema"
import { BountyInitialized as BountyInitializedEvent } from "../generated/contractsBountyCollectModule_solBountyCollectModule/contractsBountyCollectModule_solBountyCollectModule"
import { handleBountyInitialized } from "../src/contracts-bounty-collect-module-sol-bounty-collect-module"
import { createBountyInitializedEvent } from "./contracts-bounty-collect-module-sol-bounty-collect-module-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let profileId = BigInt.fromI32(234)
    let pubId = BigInt.fromI32(234)
    let currency = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let amount = BigInt.fromI32(234)
    let asker = Address.fromString("0x0000000000000000000000000000000000000001")
    let newBountyInitializedEvent = createBountyInitializedEvent(
      profileId,
      pubId,
      currency,
      amount,
      asker
    )
    handleBountyInitialized(newBountyInitializedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("BountyInitialized created and stored", () => {
    assert.entityCount("BountyInitialized", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "BountyInitialized",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "profileId",
      "234"
    )
    assert.fieldEquals(
      "BountyInitialized",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "pubId",
      "234"
    )
    assert.fieldEquals(
      "BountyInitialized",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "currency",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "BountyInitialized",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "amount",
      "234"
    )
    assert.fieldEquals(
      "BountyInitialized",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "asker",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
