import {
  BountyInitialized as BountyInitializedEvent,
  BountyPaid as BountyPaidEvent
} from "../generated/contractsBountyCollectModule_solBountyCollectModule/contractsBountyCollectModule_solBountyCollectModule"
import { BountyInitialized, BountyPaid } from "../generated/schema"

export function handleBountyInitialized(event: BountyInitializedEvent): void {
  let entity = new BountyInitialized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.profileId = event.params.profileId
  entity.pubId = event.params.pubId
  entity.currency = event.params.currency
  entity.amount = event.params.amount
  entity.asker = event.params.asker

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBountyPaid(event: BountyPaidEvent): void {
  let entity = new BountyPaid(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.profileId = event.params.profileId
  entity.pubId = event.params.pubId
  entity.expertAddress = event.params.expertAddress
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
