// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import {PrivateProposal} from "./PrivateProposal.sol";
import {IProposalFactory, CreateProposalParams, EligibilityType} from "./IProposalFactory.sol";
import {SpaceRegistry} from "./SpaceRegistry.sol";
import {ProposalAutomation} from "./ProposalAutomation.sol";

/// @title Factory for deploying new proposal instances
/// @notice Deploy and manage multiple proposal contracts
/// @dev Uses time-bucketed automation for efficient upkeep
/// @author Elio Margiotta
contract PrivateProposalFactory is IProposalFactory, AutomationCompatibleInterface {
    
    // ============ State Variables ============
    
    /// @notice The owner of the contract
    address public owner;
    /// @notice The space registry contract instance
    SpaceRegistry public spaceRegistry;
    
    /// @notice Mapping to track if a proposal is cancelled
    mapping(address proposal => bool cancelled) public isCancelled; // Track cancelled votings
    
    // Space-based organization - tracks proposals per space
    /// @notice Mapping of space IDs to their proposal addresses
    mapping(bytes32 spaceId => address[] proposals) public spaceProposals; // spaceId => proposal addresses
    
    // Time-bucketed proposals for efficient automation
    /// @notice Time-bucketed proposals for automation
    mapping(uint256 bucket => address[] proposals) public timeBucketedProposals; // bucketIndex => proposal addresses
    /// @notice Current bucket index being processed
    uint256 public currentBucketIndex; // Current bucket being processed

    // ============ Events ============
    
    /// @notice Emitted when a proposal is cancelled
    /// @param proposalAddress The address of the cancelled proposal
    /// @param name The name of the proposal
    /// @param cancelledBy The address that cancelled the proposal
    event ProposalCancelled(address indexed proposalAddress, string name, address indexed cancelledBy);
    /// @notice Emitted when upkeep is performed
    /// @param votingAddress The voting address
    /// @param timestamp The timestamp when upkeep was performed
    event UpkeepPerformed(address indexed votingAddress, uint256 indexed timestamp);
    
    // ============ Errors (saves gas vs require strings) ============
    
    error OnlyOwner();
    error NotAuthorized();
    error NotSpaceOwner();
    error SpaceNotExist();
    error ZeroAddr();
    error EmptyName();
    error StartPast();
    error NameTooLong();
    error InvalidThreshold();
    error SnapshotInFuture();
    error AlreadyCancelled();
    error Started();
    error InvalidProposalType();
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }
    
    // ============ Constructor ============
    
    /// @notice Initializes the contract
    /// @param _spaceRegistry Address of the space registry
    constructor(address _spaceRegistry) {
        if (_spaceRegistry == address(0)) revert ZeroAddr();
        owner = msg.sender;
        spaceRegistry = SpaceRegistry(_spaceRegistry);
    }
    
    // ============ Voting Creation ============
    
    /// @notice Create a new proposal instance
    /// @param params Proposal parameters
    /// @return proposal Address of the newly deployed proposal contract
    /// @return proposalId Unique identifier for the proposal
    function createProposal(CreateProposalParams calldata params)
        external
        returns (address proposal, bytes32 proposalId)
    {
        bytes memory nameBytes = bytes(params.title);
        if (nameBytes.length == 0) revert EmptyName();
        if (nameBytes.length > 200) revert NameTooLong();
        
        // Check that space exists and is active
        if (!spaceRegistry.spaceIsActive(params.spaceId)) revert SpaceNotExist();
        
        // Check authorization - only space owner or space admin can create proposals
        if (!spaceRegistry.isSpaceOwner(params.spaceId, msg.sender) && 
            !spaceRegistry.isSpaceAdmin(params.spaceId, msg.sender)) {
            revert NotSpaceOwner();
        }
        
        // Validate eligibility parameters
        if (params.eligibilityType == EligibilityType.TokenHolder) {
            if (params.eligibilityToken == address(0)) revert ZeroAddr();
            if (params.eligibilityThreshold == 0) revert InvalidThreshold();
        }
        

        PrivateProposal proposalContract = new PrivateProposal(params, address(spaceRegistry));

        proposal = address(proposalContract);
        proposalId = keccak256(abi.encodePacked(params.spaceId, params.title, block.timestamp, msg.sender));

        
        // Space-based organization
        spaceProposals[params.spaceId].push(proposal);

        // Add to automation bucket for upkeep
        ProposalAutomation.addProposalToBucket(timeBucketedProposals, proposal, params.end);

        emit ProposalCreated(
            params.spaceId,
            proposalId,
            proposal,
            params
        );
    }
    
    /// @notice Cancel a proposal before it starts (only creator or owner)
    /// @param proposalAddress Address of the proposal to cancel
    function cancelProposal(address proposalAddress) external {
        if (isCancelled[proposalAddress]) revert AlreadyCancelled();
        
        PrivateProposal proposal = PrivateProposal(proposalAddress);
        
        // Only creator or owner can cancel
        if (proposal.creator() != msg.sender && msg.sender != owner) revert NotAuthorized();
        
    // Can only cancel before proposal starts
    if (block.timestamp > proposal.start()) revert Started();        string memory proposalName = proposal.title();
        
        // Mark as cancelled
        isCancelled[proposalAddress] = true;
        
        emit ProposalCancelled(proposalAddress, proposalName, msg.sender);
    }
    
    // ============ View Functions ============
    
    // ============ Chainlink Automation ============
    
    /// @notice Check if upkeep is needed for proposal resolution
    /// @return upkeepNeeded Whether upkeep is needed
    /// @return performData Data to pass to performUpkeep
    function checkUpkeep(bytes calldata /* checkData */)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        ProposalAutomation.AutomationCheck memory checkResult =
            ProposalAutomation.checkProposalsUpkeep(
                isCancelled,
                timeBucketedProposals
            );

        upkeepNeeded = checkResult.upkeepNeeded;
        performData = checkResult.performData;
    }

    /// @notice Perform upkeep on proposals that need resolution
    /// @param performData Data from checkUpkeep containing proposal addresses
    function performUpkeep(bytes calldata performData) external override {
        ProposalAutomation.performProposalsUpkeep(performData, 50); // Process up to 50 proposals per upkeep

        // Emit event if upkeep was performed
        if (performData.length > 0) {
            emit UpkeepPerformed(address(0), block.timestamp);
        }

        // Advance bucket after processing
        currentBucketIndex = ProposalAutomation.advanceBucket(currentBucketIndex);
    }
}