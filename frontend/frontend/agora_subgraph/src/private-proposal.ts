import {
  ProposalResolved as ProposalResolvedEvent,
  PublicDecryptionVerified as PublicDecryptionVerifiedEvent,
  ReadyToReveal as ReadyToRevealEvent,
  ResultsRevealed as ResultsRevealedEvent,
  TallyRevealRequested as TallyRevealRequestedEvent,
  TotalVotersUpdated as TotalVotersUpdatedEvent,
  VotePercentagesRevealed as VotePercentagesRevealedEvent,
  Voted as VotedEvent,
  PredictionMade as PredictionMadeEvent,
  PredictionCancelled as PredictionCancelledEvent,
  WinningsClaimed as WinningsClaimedEvent,
  PredictionMarketRevealed as PredictionMarketRevealedEvent,
} from "../generated/PrivateProposal/PrivateProposal"
import {
  ProposalResolved,
  PublicDecryptionVerified,
  ReadyToReveal,
  ResultsRevealed,
  TallyRevealRequested,
  TotalVotersUpdated,
  VotePercentagesRevealed,
  Voted,
  PredictionMade,
  PredictionCancelled,
  WinningsClaimed,
  PredictionMarketRevealed,
} from "../generated/schema"

export function handleProposalResolved(event: ProposalResolvedEvent): void {
  let entity = new ProposalResolved(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.winningChoice = event.params.winningChoice
  entity.passed = event.params.passed

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePublicDecryptionVerified(
  event: PublicDecryptionVerifiedEvent,
): void {
  let entity = new PublicDecryptionVerified(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.handlesList = event.params.handlesList
  entity.abiEncodedCleartexts = event.params.abiEncodedCleartexts

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleReadyToReveal(event: ReadyToRevealEvent): void {
  let entity = new ReadyToReveal(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleResultsRevealed(event: ResultsRevealedEvent): void {
  let entity = new ResultsRevealed(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.choiceVotes = event.params.choiceVotes

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTallyRevealRequested(
  event: TallyRevealRequestedEvent,
): void {
  let entity = new TallyRevealRequested(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.choiceVoteHandles = event.params.choiceVoteHandles

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTotalVotersUpdated(event: TotalVotersUpdatedEvent): void {
  let entity = new TotalVotersUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.totalVoters = event.params.totalVoters

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleVotePercentagesRevealed(
  event: VotePercentagesRevealedEvent,
): void {
  let entity = new VotePercentagesRevealed(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.percentages = event.params.percentages

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleVoted(event: VotedEvent): void {
  let entity = new Voted(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.user = event.params.user
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePredictionMade(event: PredictionMadeEvent): void {
  let entity = new PredictionMade(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.user = event.params.user
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePredictionCancelled(event: PredictionCancelledEvent): void {
  let entity = new PredictionCancelled(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.user = event.params.user
  entity.refundAmount = event.params.refundAmount
  entity.fee = event.params.fee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleWinningsClaimed(event: WinningsClaimedEvent): void {
  let entity = new WinningsClaimed(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.user = event.params.user
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePredictionMarketRevealed(event: PredictionMarketRevealedEvent): void {
  let entity = new PredictionMarketRevealed(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}


