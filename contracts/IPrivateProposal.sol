// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {externalEuint32, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {ProposalType} from "./IProposalFactory.sol";

/// @title Private Proposal Interface
/// @author Elio Margiotta
/// @notice Standard interface for private proposal contracts
interface IPrivateProposal {
    /// @notice Get proposal metadata
    /// @return The space ID
    function spaceId() external view returns (bytes32);
    /// @notice Get the proposal title
    /// @return The proposal title
    function title() external view returns (string memory);
    /// @notice Get the proposal body URI
    /// @return The body URI
    function bodyURI() external view returns (string memory);

    /// @notice Get proposal configuration
    /// @return The proposal type
    function pType() external view returns (ProposalType);
    /// @notice Get a choice by index
    /// @param index The choice index
    /// @return The choice string
    function choices(uint256 index) external view returns (string memory);
    /// @notice Get the number of choices
    /// @return The number of choices
    function choicesLength() external view returns (uint256);

    /// @notice Get timing information
    /// @return The start timestamp
    function start() external view returns (uint64);
    /// @notice Get the end timestamp
    /// @return The end timestamp
    function end() external view returns (uint64);
    /// @notice Get time until proposal starts
    /// @return Time until proposal starts (0 if started)
    function timeUntilProposalStarts() external view returns (uint256);
    /// @notice Get time until proposal ends
    /// @return Time until proposal ends (0 if ended)
    function timeUntilProposalEnds() external view returns (uint256);

    /// @notice Get factory and creator
    /// @return The factory address
    function factory() external view returns (address);
    /// @notice Get the creator address
    /// @return The creator address
    function creator() external view returns (address);

    /// @notice Get voting status
    /// @param account The account to check
    /// @return True if the account has voted
    function hasVoted(address account) external view returns (bool);

    /// @notice Get decrypted results (after reveal)
    /// @return True if results are revealed
    function resultsRevealed() external view returns (bool);
    /// @notice Get vote count for a choice
    /// @param index The choice index
    /// @return The vote count for the choice
    function choiceVotes(uint256 index) external view returns (uint256);
    /// @notice Get vote percentages
    /// @return Vote percentages in basis points
    function getVotePercentages() external view returns (uint256[] memory);
    /// @notice Check if proposal is resolved
    /// @return True if proposal is resolved
    function proposalResolved() external view returns (bool);
    /// @notice Check if proposal passed
    /// @return True if proposal passed
    function proposalPassed() external view returns (bool);
    /// @notice Get the winning choice
    /// @return The winning choice index
    function winningChoice() external view returns (uint8);

    /// @notice Get automation status
    /// @return True if auto-reveal was triggered
    function autoRevealTriggered() external view returns (bool);

    // ============ Voting Functions ============

    /// @notice Vote for a choice (non-weighted single choice)
    /// @param inputEuint8 Encrypted choice index
    /// @param inputProof Proof of encryption
    function voteNonweighted(externalEuint8 inputEuint8, bytes calldata inputProof) external;

    /// @notice Vote with percentage weights across choices (weighted fractional)
    /// @param percentageInputs Encrypted percentages for each choice
    /// @param totalPercentageProof Proof that percentages sum to 100
    function voteWeightedFractional(
        externalEuint32[] calldata percentageInputs,
        bytes calldata totalPercentageProof
    ) external; 

    /// @notice Vote for a choice with token-weighted power (weighted single choice)
    /// @param inputEuint8 Encrypted choice index
    /// @param inputProof Proof of encryption
    function voteWeightedSingle(externalEuint8 inputEuint8, bytes calldata inputProof) external;

    // ============ Resolution Functions ============

    /// @notice Trigger resolution (called by factory's performUpkeep)
    /// @param performData Data from checkUpkeep
    function performUpkeep(bytes calldata performData) external;

    /// @notice Callback function called by frontend (Relayer SDK) with decrypted results
    /// @param proposalAddress The proposal address
    /// @param cleartexts Decrypted vote counts
    /// @param decryptionProof Proof of decryption
    function resolveProposalCallback(
        address proposalAddress,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) external;
}