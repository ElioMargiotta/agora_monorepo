// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { PrivateProposal } from "./PrivateProposal.sol";

/// @title Proposal Automation Library
/// @notice Time-bucketed automation for efficient proposal resolution
/// @dev Optimized for Chainlink Automation with predictable end times
/// @author Elio Margiotta (using chainlink's approach as references)
library ProposalAutomation {
    /// @notice Automation check result
    struct AutomationCheck {
        bool upkeepNeeded;
        bytes performData;
    }

    /// @notice Time bucket configuration
    uint256 public constant BUCKET_SIZE = 1 hours;
    uint256 public constant NUM_BUCKETS = 168; // 1 week

    /// @notice Check proposals needing upkeep using time buckets
    /// @param isCancelled Mapping of cancelled status
    /// @param timeBucketedProposals Time-bucketed proposal arrays
    /// @return checkResult Automation check result
    function checkProposalsUpkeep(
        mapping(address => bool) storage isCancelled,
        mapping(uint256 => address[]) storage timeBucketedProposals
    ) external view returns (AutomationCheck memory checkResult) {
        uint256 currentTime = block.timestamp;
        uint256 currentBucket = (currentTime / BUCKET_SIZE) % NUM_BUCKETS;
        uint256 nextBucket = (currentBucket + 1) % NUM_BUCKETS;

        address[] memory candidates = new address[](50);
        uint256 candidateCount = 0;

        // Check current and next buckets
        candidateCount += _checkBucketProposals(
            timeBucketedProposals[currentBucket],
            isCancelled,
            candidates,
            candidateCount,
            50
        );

        if (candidateCount < 50) {
            candidateCount += _checkBucketProposals(
                timeBucketedProposals[nextBucket],
                isCancelled,
                candidates,
                candidateCount,
                50 - candidateCount
            );
        }

        checkResult.upkeepNeeded = candidateCount > 0;

        if (candidateCount > 0) {
            // Shrink array to actual size
            address[] memory result = new address[](candidateCount);
            for (uint256 i = 0; i < candidateCount; ) {
                result[i] = candidates[i];
                unchecked { ++i; }
            }
            checkResult.performData = abi.encode(result);
        }
    }

    /// @notice Execute upkeep on proposals
    /// @param performData Encoded proposal addresses
    /// @param maxBatchSize Maximum proposals to process
    function performProposalsUpkeep(
        bytes calldata performData,
        uint256 maxBatchSize
    ) external {
        if (performData.length == 0) return;

        address[] memory proposalsToResolve = abi.decode(performData, (address[]));
        uint256 len = proposalsToResolve.length;
        uint256 batchSize = len > maxBatchSize ? maxBatchSize : len;

        for (uint256 i = 0; i < batchSize; ) {
            PrivateProposal proposal = PrivateProposal(proposalsToResolve[i]);

            try proposal.performUpkeep("") {
                // Success - could emit event here if needed
            } catch {
                // Failure - could emit event here if needed
            }
            unchecked { ++i; }
        }
    }

    /// @notice Add proposal to time bucket
    /// @param timeBucketedProposals Time bucket mapping
    /// @param proposalAddr Proposal address
    /// @param endTime Proposal end time
    function addProposalToBucket(
        mapping(uint256 => address[]) storage timeBucketedProposals,
        address proposalAddr,
        uint256 endTime
    ) external {
        uint256 bucketIndex = (endTime / BUCKET_SIZE) % NUM_BUCKETS;
        timeBucketedProposals[bucketIndex].push(proposalAddr);
    }

    /// @notice Advance to next time bucket
    /// @param currentBucketIndex Current bucket index
    /// @return newBucketIndex Next bucket index
    function advanceBucket(uint256 currentBucketIndex) external pure returns (uint256) {
        return (currentBucketIndex + 1) % NUM_BUCKETS;
    }

    /// @notice Check proposals in a specific time bucket
    /// @param bucketProposals Proposals in the bucket
    /// @param isCancelled Cancelled status mapping
    /// @param candidates Array to store candidates
    /// @param startIdx Starting index in candidates array
    /// @param maxCandidates Maximum candidates to find
    /// @return count Number of candidates found
    function _checkBucketProposals(
        address[] storage bucketProposals,
        mapping(address => bool) storage isCancelled,
        address[] memory candidates,
        uint256 startIdx,
        uint256 maxCandidates
    ) private view returns (uint256 count) {
        uint256 len = bucketProposals.length;
        uint256 currentTime = block.timestamp;

        for (uint256 i = 0; i < len && count < maxCandidates; ) {
            address votingAddr = bucketProposals[i];
            if (!isCancelled[votingAddr]) {
                PrivateProposal voting = PrivateProposal(votingAddr);
                if (currentTime >= voting.end() &&
                    !voting.resultsRevealed() &&
                    !voting.autoRevealTriggered()) {
                    candidates[startIdx + count] = votingAddr;
                    count++;
                }
            }
            unchecked { ++i; }
        }
    }
}