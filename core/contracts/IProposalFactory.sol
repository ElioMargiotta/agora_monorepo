// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ============ Enums and Structs ============

enum ProposalType   { NonWeightedSingleChoice, WeightedSingleChoice, WeightedFractional }
enum EligibilityType { Public, TokenHolder }

struct CreateProposalParams {
    bytes32 spaceId;
    uint64 start;
    uint64 end;
    address eligibilityToken;
    uint256 eligibilityThreshold;
    uint256 passingThreshold;
    ProposalType pType;
    EligibilityType eligibilityType;
    bool includeAbstain;
    bool predictionMarketEnabled;
    address predictionToken; // Token used for prediction market (e.g., USDC)
    string title;
    string bodyURI;
    string[] choices;
}

/// @title Proposal Factory Interface
/// @author Elio Margiotta
/// @notice Standard interface for proposal factory contracts
interface IProposalFactory {
    /// @notice Emitted when a new proposal is created
    /// @param spaceId The space identifier for the proposal
    /// @param proposalId Unique identifier for the proposal
    /// @param proposal Address of the deployed proposal contract
    /// @param p The parameters used to create the proposal
    event ProposalCreated(
        bytes32 indexed spaceId,
        bytes32 indexed proposalId,
        address proposal,
        CreateProposalParams p
    );

    /// @notice Create a new proposal
    /// @param p Parameters for creating the proposal
    /// @return proposal Address of the created proposal contract
    /// @return proposalId Unique identifier for the proposal
    function createProposal(CreateProposalParams calldata p)
        external
        returns (address proposal, bytes32 proposalId);
}