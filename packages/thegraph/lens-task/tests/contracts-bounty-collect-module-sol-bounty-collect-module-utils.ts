import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  BountyInitialized,
  BountyPaid
} from "../generated/contractsBountyCollectModule_solBountyCollectModule/contractsBountyCollectModule_solBountyCollectModule"

export function createBountyInitializedEvent(
  profileId: BigInt,
  pubId: BigInt,
  currency: Address,
  amount: BigInt,
  asker: Address
): BountyInitialized {
  let bountyInitializedEvent = changetype<BountyInitialized>(newMockEvent())

  bountyInitializedEvent.parameters = new Array()

  bountyInitializedEvent.parameters.push(
    new ethereum.EventParam(
      "profileId",
      ethereum.Value.fromUnsignedBigInt(profileId)
    )
  )
  bountyInitializedEvent.parameters.push(
    new ethereum.EventParam("pubId", ethereum.Value.fromUnsignedBigInt(pubId))
  )
  bountyInitializedEvent.parameters.push(
    new ethereum.EventParam("currency", ethereum.Value.fromAddress(currency))
  )
  bountyInitializedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  bountyInitializedEvent.parameters.push(
    new ethereum.EventParam("asker", ethereum.Value.fromAddress(asker))
  )

  return bountyInitializedEvent
}

export function createBountyPaidEvent(
  profileId: BigInt,
  pubId: BigInt,
  expertAddress: Address,
  amount: BigInt
): BountyPaid {
  let bountyPaidEvent = changetype<BountyPaid>(newMockEvent())

  bountyPaidEvent.parameters = new Array()

  bountyPaidEvent.parameters.push(
    new ethereum.EventParam(
      "profileId",
      ethereum.Value.fromUnsignedBigInt(profileId)
    )
  )
  bountyPaidEvent.parameters.push(
    new ethereum.EventParam("pubId", ethereum.Value.fromUnsignedBigInt(pubId))
  )
  bountyPaidEvent.parameters.push(
    new ethereum.EventParam(
      "expertAddress",
      ethereum.Value.fromAddress(expertAddress)
    )
  )
  bountyPaidEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return bountyPaidEvent
}
