import { newMockEvent } from "matchstick-as"
import { ethereum, Bytes, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  ProposalResolved,
  PublicDecryptionVerified,
  ReadyToReveal,
  ResultsRevealed,
  TallyRevealRequested,
  TotalVotersUpdated,
  VotePercentagesRevealed,
  Voted
} from "../generated/PrivateProposal/PrivateProposal"

export function createProposalResolvedEvent(
  winningChoice: i32,
  passed: boolean
): ProposalResolved {
  let proposalResolvedEvent = changetype<ProposalResolved>(newMockEvent())

  proposalResolvedEvent.parameters = new Array()

  proposalResolvedEvent.parameters.push(
    new ethereum.EventParam(
      "winningChoice",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(winningChoice))
    )
  )
  proposalResolvedEvent.parameters.push(
    new ethereum.EventParam("passed", ethereum.Value.fromBoolean(passed))
  )

  return proposalResolvedEvent
}

export function createPublicDecryptionVerifiedEvent(
  handlesList: Array<Bytes>,
  abiEncodedCleartexts: Bytes
): PublicDecryptionVerified {
  let publicDecryptionVerifiedEvent =
    changetype<PublicDecryptionVerified>(newMockEvent())

  publicDecryptionVerifiedEvent.parameters = new Array()

  publicDecryptionVerifiedEvent.parameters.push(
    new ethereum.EventParam(
      "handlesList",
      ethereum.Value.fromFixedBytesArray(handlesList)
    )
  )
  publicDecryptionVerifiedEvent.parameters.push(
    new ethereum.EventParam(
      "abiEncodedCleartexts",
      ethereum.Value.fromBytes(abiEncodedCleartexts)
    )
  )

  return publicDecryptionVerifiedEvent
}

export function createReadyToRevealEvent(timestamp: BigInt): ReadyToReveal {
  let readyToRevealEvent = changetype<ReadyToReveal>(newMockEvent())

  readyToRevealEvent.parameters = new Array()

  readyToRevealEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return readyToRevealEvent
}

export function createResultsRevealedEvent(
  choiceVotes: Array<BigInt>
): ResultsRevealed {
  let resultsRevealedEvent = changetype<ResultsRevealed>(newMockEvent())

  resultsRevealedEvent.parameters = new Array()

  resultsRevealedEvent.parameters.push(
    new ethereum.EventParam(
      "choiceVotes",
      ethereum.Value.fromUnsignedBigIntArray(choiceVotes)
    )
  )

  return resultsRevealedEvent
}

export function createTallyRevealRequestedEvent(
  choiceVoteHandles: Array<Bytes>
): TallyRevealRequested {
  let tallyRevealRequestedEvent =
    changetype<TallyRevealRequested>(newMockEvent())

  tallyRevealRequestedEvent.parameters = new Array()

  tallyRevealRequestedEvent.parameters.push(
    new ethereum.EventParam(
      "choiceVoteHandles",
      ethereum.Value.fromFixedBytesArray(choiceVoteHandles)
    )
  )

  return tallyRevealRequestedEvent
}

export function createTotalVotersUpdatedEvent(
  totalVoters: BigInt
): TotalVotersUpdated {
  let totalVotersUpdatedEvent = changetype<TotalVotersUpdated>(newMockEvent())

  totalVotersUpdatedEvent.parameters = new Array()

  totalVotersUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "totalVoters",
      ethereum.Value.fromUnsignedBigInt(totalVoters)
    )
  )

  return totalVotersUpdatedEvent
}

export function createVotePercentagesRevealedEvent(
  percentages: Array<BigInt>
): VotePercentagesRevealed {
  let votePercentagesRevealedEvent =
    changetype<VotePercentagesRevealed>(newMockEvent())

  votePercentagesRevealedEvent.parameters = new Array()

  votePercentagesRevealedEvent.parameters.push(
    new ethereum.EventParam(
      "percentages",
      ethereum.Value.fromUnsignedBigIntArray(percentages)
    )
  )

  return votePercentagesRevealedEvent
}

export function createVotedEvent(user: Address, timestamp: BigInt): Voted {
  let votedEvent = changetype<Voted>(newMockEvent())

  votedEvent.parameters = new Array()

  votedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  votedEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return votedEvent
}
