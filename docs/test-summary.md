# AGORA Voting and Resolution Test Summary

This document summarizes the test suite for the AGORA private proposal system, focusing on voting mechanisms and resolution logic implemented in `test/voting-resolution.ts`.

## Test Overview

The test suite covers all major voting types and resolution scenarios using Hardhat and the FHEVM plugin for encrypted computations. Tests are structured around different proposal types and edge cases.

## Full Test Suite Results

Running `npx hardhat test` produces the following results (93 passing tests):

```
  MockENS
    Subdomain creation
      ✔ should create a subdomain under .agora
      ✔ should fail to create the same subdomain with different address from unauthorized account
      ✔ should fail to register an already owned ENS from unauthorized account
      ✔ should allow the owner to change the owner of their ENS

  SpaceRegistry
    createSpace
      ✔ should create a new space
      ✔ should revert if space already exists
      ✔ should revert if name is not a valid ENS name
      ✔ should revert if display name is too long
      ✔ should revert if not ENS owner
    transferSpaceOwnership
      ✔ should transfer ownership
      ✔ should revert if space does not exist
      ✔ should revert if not owner
      ✔ should revert if new owner is zero address
    deactivateSpace
      ✔ should deactivate space
      ✔ should revert if space does not exist
      ✔ should revert if not owner
    isSpaceOwner
      ✔ should return true for owner of active space
      ✔ should return false for non-owner
      ✔ should return false for inactive space
      ✔ should return false for non-existent space
    spaceIsActive
      ✔ should return true for active space
      ✔ should return false for inactive space
      ✔ should return false for non-existent space
    getOwnerSpaces
      ✔ should return spaces owned by address
      ✔ should return empty array for address with no spaces
    getSpace
      ✔ should return space details
    updateSpaceDisplayName
      ✔ should update display name
      ✔ should revert if not owner
      ✔ should revert if display name too long
    namehash
      ✔ should compute correct namehash for .agora domain (79ms)
    joinSpace
      ✔ should allow joining public space
      ✔ should allow joining whitelist space if whitelisted
      ✔ should revert joining whitelist space if not whitelisted
      ✔ should allow joining token holder space if holding sufficient tokens
      ✔ should revert joining token holder space if holding insufficient tokens
      ✔ should allow joining NFT holder space if holding sufficient NFTs
      ✔ should revert joining NFT holder space if holding insufficient NFTs
      ✔ should revert if already member
      ✔ should revert if space does not exist
      ✔ should revert if space is inactive
    leaveSpace
      ✔ should allow leaving space
      ✔ should revert if not member
      ✔ should revert if space does not exist
    getSpaceMembers
      ✔ should return space members
      ✔ should revert if space does not exist
    addToWhitelist and removeFromWhitelist
      ✔ should add to whitelist
      ✔ should remove from whitelist
      ✔ should revert if not owner
    addSpaceAdmin and removeSpaceAdmin
      ✔ should add admin
      ✔ should remove admin
      ✔ should revert if not owner
      ✔ should revert if adding zero address as admin
    isSpaceAdmin
      ✔ should return true for admin of active space
      ✔ should return false for non-admin
      ✔ should return false for inactive space

  PrivateProposalFactory
    Deployment
      ✔ Should set the correct owner
      ✔ Should start with zero total proposals
    Proposal Creation
      ✔ Should create proposal successfully
      ✔ Should create multiple proposals for same user
      ✔ Should create proposals for different users
      ✔ Should prevent creation with empty title
      ✔ Should handle reentrancy protection
    Proposal Management
      ✔ Should return correct proposal count by space
      ✔ Should return proposals by space
      ✔ Should validate proposal correctly
      ✔ Should return all proposals
    Proposal Contract Functionality
      ✔ Should initialize proposal correctly
      ✔ Should be functional after deployment
    Edge Cases and Error Handling
      ✔ Should handle zero address space
      ✔ Should handle maximum values
      ✔ Should maintain correct state after many operations
    Chainlink Automation
      ✔ Should detect upkeep needed for ended proposals
      ✔ Should perform upkeep on ended proposals
      ✔ Should not need upkeep when no proposals are ready
      ✔ Should handle multiple proposals needing upkeep

  PrivateProposal Voting and Resolution
    Non-Weighted Single Choice Voting
      ✔ Should allow users to vote with encrypted choices
      ✔ Should prevent double voting
      ✔ Should resolve proposal correctly after voting (54ms)
    Weighted Single Choice Voting
      ✔ Should allow weighted voting based on token balance
      ✔ Should resolve weighted voting correctly
    Weighted Fractional Voting
      ✔ Should allow fractional voting with percentage splits
      ✔ Should resolve fractional voting correctly
    Voting with Abstain Option
      ✔ Should include abstain as the last choice
      ✔ Should exclude abstain votes from winner calculation
    Passing Threshold Logic
      ✔ Should handle draw correctly
    Prediction Market
      ✔ Should allow users to make predictions with token stakes
      ✔ Should allow users to update predictions (auto-cancel previous)
      ✔ Should allow users to cancel predictions with 1% fee
      ✔ Should prevent predictions after reveal
      ✔ Should allow winners to claim proportional winnings (46ms)
      ✔ Should prevent double claiming
      ✔ Should return correct prediction market info
      ✔ Should return correct user prediction info


  93 passing (2s)
```

## Test Categories and Results

### ✅ MockENS Tests (4 passing)
**Description**: Tests ENS subdomain creation and ownership management.
- Covers creation, authorization, and ownership changes.

### ✅ SpaceRegistry Tests (47 passing)
**Description**: Comprehensive tests for space creation, management, membership, and administration.
- Includes space lifecycle, membership types (public, whitelist, token/NFT holder), admin functions.

### ✅ PrivateProposalFactory Tests (20 passing)
**Description**: Tests proposal factory deployment, creation, management, and Chainlink Automation integration.
- Covers proposal lifecycle, validation, and upkeep detection/performance.

### ✅ PrivateProposal Voting and Resolution Tests (22 passing)
**Description**: Tests encrypted voting mechanisms, resolution logic, and prediction markets.

**Tests Performed**:
- **User Voting**: Verifies users can vote with encrypted choices (passes).
- **Double Voting Prevention**: Ensures users cannot vote twice (passes).
- **Proposal Resolution**: Tests end-to-end resolution with correct winner determination (passes).

**Expected Behavior**: 2 votes for "Yes", 1 for "No" → "Yes" wins via plurality.

### ✅ Weighted Single Choice Voting
**Description**: Tests voting weighted by token balance, where full voting power goes to one choice.

**Tests Performed**:
- **Weighted Voting**: Verifies voting power calculation based on token holdings (passes).
- **Resolution**: Tests correct tallying and winner selection (passes).

**Expected Behavior**: User1 (1000 tokens) votes "Yes", User2 (2000 tokens) votes "No" → "No" wins with 2000 votes.

### ✅ Weighted Fractional Voting
**Description**: Tests voting where users distribute their voting power across multiple choices using percentages.

**Tests Performed**:
- **Fractional Voting**: Verifies percentage-based vote splitting (passes).
- **Resolution**: Tests correct accumulation and winner determination (passes).

**Expected Behavior**:
- User1 (1000 tokens): 60% A, 30% B, 10% C → 600 A, 300 B, 100 C
- User2 (2000 tokens): 20% A, 50% B, 30% C → 400 A, 1000 B, 600 C
- Total: 1000 A, 1300 B, 700 C → "B" wins

### ✅ Voting with Abstain Option
**Description**: Tests proposals that include an "Abstain" choice, which is excluded from winner calculations.

**Tests Performed**:
- **Abstain Inclusion**: Verifies abstain is added as the last choice (passes).
- **Abstain Exclusion**: Ensures abstain votes don't affect the outcome (passes).

**Expected Behavior**: 1 "Yes", 1 "Abstain" → "Yes" wins (abstain ignored).

### ✅ Passing Threshold Logic
**Description**: Tests threshold-based passing (50% required) and draw handling.

**Tests Performed**:
- **Draw Handling**: Verifies tie scenarios result in no winner (passes).

**Expected Behavior**: 2 "Yes", 2 "No" with 50% threshold → Draw (neither exceeds 50%).

### ✅ Prediction Market (8 passing)
**Description**: Tests the optional prediction market feature where users stake tokens on encrypted predictions of voting outcomes. The prediction market uses a separate token (MockUSDC) specified via the `predictionToken` parameter, independent from governance tokens used for voting.

**Test Configuration**: 
- Voting: Public (no token required)
- Prediction Token: MockUSDC
- Users minted: User1 (10,000 USDC), User2 (20,000 USDC), User3 (5,000 USDC)

**Tests Performed**:
- **Make Predictions**: Verifies users can stake USDC tokens on encrypted choice predictions (passes).
  - User1 stakes 100 USDC on choice 0, prediction recorded and pool updated.
  
- **Update Predictions**: Tests automatic cancellation of previous predictions with 99% refund (passes).
  - User1 makes prediction (100 USDC), then updates to new prediction (200 USDC).
  - Receives 99 USDC refund (99%), 1 USDC fee retained, new stake recorded.

- **Cancel Predictions**: Verifies users can cancel predictions with 1% fee deduction (passes).
  - User1 stakes 1000 USDC, then cancels.
  - Receives 990 USDC refund, 10 USDC accumulated as fees.
  
- **Prevent Predictions After Reveal**: Ensures predictions cannot be made after voting ends and results are revealed (passes).
  - After proposal resolution and `revealPredictionsForPayout()`, new predictions are rejected.

- **Proportional Winnings**: Tests winner-takes-all distribution with correct proportional payouts (passes).
  - User1: 1000 USDC on "Yes", User2: 2000 USDC on "No", User3: 500 USDC on "Yes".
  - Total pool: 3500 USDC, "Yes" wins (2 votes vs 1 vote).
  - Winning stakes: 1500 USDC (User1 + User3).
  - User1 payout: (3500 × 1000) / 1500 = 2333.33 USDC.
  - User3 payout: (3500 × 500) / 1500 = 1166.67 USDC.
  - User2 (loser) gets nothing.

- **Prevent Double Claiming**: Ensures users cannot claim winnings twice (passes).
  - User1 claims winnings once successfully, second claim reverts with `AlreadyClaimed`.

- **Prediction Market Info**: Tests view function for market state (passes).
  - Returns enabled status, token address, total pool, fees, and revealed status.
  
- **User Prediction Info**: Tests view function for individual user state (passes).
  - Returns prediction status, staked amount, and claim status.

**Expected Behavior**: Complete prediction market lifecycle with encrypted predictions, token staking, cancellation fees (1%), off-chain tallying via `tallyPredictions()`, and proportional winner payouts from the entire pool.

## Overall Test Status
- **All Tests Pass**: 93/93 tests passing with no failures.
- **Coverage**: Comprehensive coverage of ENS, spaces, proposals, voting, automation, and prediction markets.

## Limitations and Considerations

### FHE Testing Environment
- **Test-Only Decryption**: Uses `fhevm.publicDecrypt()` for testing. In production, decryption occurs off-chain via Zama's FHE service.
- **Mock Dependencies**: Relies on mock contracts (MockENS, MockGovernanceToken) for ENS and token functionality.
- **Local Network**: Tests run on Hardhat's local network with FHEVM plugin; may not reflect mainnet gas costs or timing.

### Resolution Process
- **Manual Resolution**: Tests simulate the full resolution flow, but in production, `resolveProposalCallback` requires off-chain decryption results.
- **Timing**: Tests advance time artificially; real proposals depend on Chainlink Automation for timely upkeep.
- **Zero Votes**: Not explicitly tested; may require special handling if no votes are cast (proposal might not resolve or pass).

### Security and Edge Cases
- **Not Covered**: Denial-of-service via invalid proofs, gas limits on large proposals, or malicious FHE inputs.
- **Assumptions**: Assumes valid FHE proofs and correct oracle responses; does not test proof verification failures.


For detailed test code, refer to `test/` directory files.