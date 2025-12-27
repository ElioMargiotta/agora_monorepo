// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32, euint8, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ProposalType, EligibilityType, CreateProposalParams} from "./IProposalFactory.sol";
import {IPrivateProposal} from "./IPrivateProposal.sol";
import {ISpaceRegistry} from "./ISpaceRegistry.sol";

/// @title Voting Factory Interface
/// @author Elio Margiotta
/// @notice Interface for voting factory
interface IVotingFactory {
    /// @notice Records a user vote
    /// @param user The user address
    /// @param votingAddress The voting contract address
    function recordUserVote(address user, address votingAddress) external;
}

/// @title Private Proposal
/// @author Elio Margiotta
/// @notice Verifies math for WeightedSingleChoice and WeightedFractional using OZ IVotes snapshots.
/// @dev FHE/Zama operations are left intact.
contract PrivateProposal is IPrivateProposal, ZamaEthereumConfig, ReentrancyGuard {
    // ============ Structs ============

    struct ProposalConfig {
        bytes32 spaceId;
        string title;
        string bodyURI;
        ProposalType pType;
        uint64 start;
        uint64 end;
        EligibilityType eligibilityType;
        address eligibilityToken;
        uint256 eligibilityThreshold;
        address creator;
        uint256 snapshotBlock;
        bool predictionMarketEnabled;
    }

    // ============ State Variables ============

    /// @notice Proposal configuration struct
    ProposalConfig public config;

    /// @notice Factory address (can trigger resolution)
    address public factory;

    /// @notice Space registry for membership verification
    ISpaceRegistry public spaceRegistry;

    string[] private _choices;

    /// @notice Track if user has voted
    mapping(address user => bool voted) public hasVoted;

    /// @notice Encrypted votes for each user (choice index) - for single choice voting
    mapping(address user => euint8 choice) private _userVotes;

    /// @notice Encrypted fractional votes for each user (array of weights per choice)
    mapping(address user => euint32[] weights) private _userFractionalVotes;

    /// @notice Encrypted vote counts for each choice
    euint32[] private _choiceVotes;

    /// @notice Decrypted vote counts after reveal
    uint256[] public choiceVotes;

    /// @notice Winning choice index
    uint8 public winningChoice;

    /// @notice Passing threshold in basis points (0 = plurality, 5000 = 50%)
    uint256 public passingThreshold;

    /// @notice Packed status flags (bits: 0=revealed, 1=resolved, 2=passed, 3=autoTrig, 4=draw, 5=abstain, 6=request)
    uint8 public statusFlags;

    /// @notice Total unique voters who participated
    uint256 public totalVoters;

    /// @notice Vote percentages in basis points (e.g., 5000 = 50%)
    uint256[] public votePercentages;

    // ============ Prediction Market Variables ============

    /// @notice Token address for prediction market (e.g., MockUSDC)
    address public predictionToken;

    /// @notice Encrypted choice predictions for each user
    mapping(address user => euint8 predictedChoice) private _userPredictions;

    /// @notice Token amounts staked by each user (not encrypted for refunds)
    mapping(address user => uint256 amount) public predictionStakes;

    /// @notice Total staked per choice (updated after reveal)
    mapping(uint8 choice => uint256 totalStaked) public totalStakedPerChoice;

    /// @notice Track if user has made a prediction
    mapping(address user => bool hasPrediction) public hasPredicted;

    /// @notice Track if user has claimed winnings
    mapping(address user => bool claimed) public hasClaimedWinnings;

    /// @notice Total prediction pool
    uint256 public totalPredictionPool;

    /// @notice Cancellation fee in basis points (e.g., 100 = 1%)
    uint256 public constant CANCELLATION_FEE_BPS = 100;

    /// @notice Accumulated fees from cancellations
    uint256 public accumulatedFees;

    /// @notice Whether predictions have been revealed for payout
    bool public predictionsRevealed;

    // Custom errors
    error OnlyFactory();
    error ProposalNotStarted();
    error ProposalEnded();
    error AlreadyVoted();
    error NotSpaceMember();
    error InvalidChoiceIndex();
    error ResultsAlreadyRevealed();
    error RevealNotRequested();
    error AlreadyResolved();
    error InvalidProposalAddress();
    error InsufficientTokenBalance();
    error NoVotingPower();
    error InvalidPercentageInputLength();
    error MissingPercentageProof();
    error WrongProposalType();
    error AutoRevealTriggered();
    error RevealAlreadyRequested();
    error TokenTransferFailed();
    error InvalidTokenAddress();
    error InsufficientTokenAllowance();
    error PredictionMarketNotEnabled();
    error NoPredictionToCancel();
    error PredictionsAlreadyRevealed();
    error PredictionsNotYetRevealed();
    error AlreadyClaimed();
    error IncorrectPrediction();
    error NoWinnings();
    error InvalidStakeAmount();

    /// @notice Whether results are revealed
    /// @return True if results are revealed
    function resultsRevealed() external view returns (bool) {
        return (statusFlags & 1) != 0;
    }

    /// @notice Whether proposal has been resolved
    /// @return True if proposal is resolved
    function proposalResolved() external view returns (bool) {
        return (statusFlags & 2) != 0;
    }

    /// @notice Whether proposal passed
    /// @return True if proposal passed
    function proposalPassed() external view returns (bool) {
        return (statusFlags & 4) != 0;
    }

    /// @notice Whether auto-reveal has been triggered by Chainlink
    /// @return True if auto-reveal triggered
    function autoRevealTriggered() external view returns (bool) {
        return (statusFlags & 8) != 0;
    }

    // ============ Events ============
    /// @notice Emitted when a user votes
    /// @param user The user address
    /// @param timestamp The timestamp of the vote
    event Voted(address indexed user, uint256 indexed timestamp);
    /// @notice Emitted when results are revealed
    /// @param choiceVotes The vote counts for each choice
    event ResultsRevealed(uint256[] choiceVotes);
    /// @notice Emitted when the proposal is resolved
    /// @param winningChoice The index of the winning choice
    /// @param passed Whether the proposal passed
    event ProposalResolved(uint8 indexed winningChoice, bool indexed passed);
    /// @notice Emitted when ready to reveal results
    /// @param timestamp The timestamp
    event ReadyToReveal(uint256 indexed timestamp);
    /// @notice Emitted when tally reveal is requested
    /// @param choiceVoteHandles The handles for choice votes
    event TallyRevealRequested(bytes32[] choiceVoteHandles);
    /// @notice Emitted when vote percentages are revealed
    /// @param percentages The vote percentages
    event VotePercentagesRevealed(uint256[] percentages);
    /// @notice Emitted when total voters is updated
    /// @param totalVoters The total number of voters
    event TotalVotersUpdated(uint256 indexed totalVoters);
    /// @notice Emitted when a user makes a prediction
    /// @param user The user address
    /// @param amount The token amount staked
    event PredictionMade(address indexed user, uint256 amount);
    /// @notice Emitted when a user cancels their prediction
    /// @param user The user address
    /// @param refundAmount The amount refunded after fees
    /// @param fee The cancellation fee charged
    event PredictionCancelled(address indexed user, uint256 refundAmount, uint256 fee);
    /// @notice Emitted when winnings are claimed
    /// @param user The user address
    /// @param amount The amount won
    event WinningsClaimed(address indexed user, uint256 amount);
    /// @notice Emitted when predictions are revealed for payout
    event PredictionMarketRevealed();

    // ============ Modifiers ============
    modifier onlyFactory() {
        if (msg.sender != factory) revert OnlyFactory();
        _;
    }

    modifier proposalActive() {
        if (block.timestamp < config.start) revert ProposalNotStarted();
        if (block.timestamp >= config.end) revert ProposalEnded();
        _;
    }

    modifier proposalEnded() {
        if (block.timestamp < config.end) revert ProposalNotStarted();
        _;
    }

    // ============ Constructor ============
    /// @notice Initializes the proposal contract
    /// @param params The parameters for creating the proposal
    /// @param _spaceRegistry The space registry address
    constructor(CreateProposalParams memory params, address _spaceRegistry) {
        // Adjust choice length validation
        uint256 maxChoices = params.includeAbstain ? 9 : 10;  // Leave room for abstain if included
        if (params.choices.length < 2 || params.choices.length > maxChoices) revert InvalidChoiceIndex();

        if (params.end <= params.start || params.end - params.start < 5 minutes) revert ProposalEnded();
        if (params.start == 0) {
            config.start = uint64(block.timestamp);
        } else {
            if (params.start < block.timestamp) revert ProposalNotStarted();
            config.start = params.start;
        }
        config.end = params.end;
        
        // Set includeAbstain and append if needed
        statusFlags |= params.includeAbstain ? 32 : 0;
        _choices = params.choices;
        if ((statusFlags & 32) != 0) {
            _choices.push("Abstain");
        }

        passingThreshold = params.passingThreshold;
        if (passingThreshold != 0 && passingThreshold > 10000) revert WrongProposalType();
        
        factory = msg.sender;
        spaceRegistry = ISpaceRegistry(_spaceRegistry);
        config.creator = msg.sender;

        config.spaceId = params.spaceId;
        config.title = params.title;
        config.bodyURI = params.bodyURI;
        config.pType = params.pType;
        config.eligibilityType = params.eligibilityType;
        config.eligibilityToken = params.eligibilityToken;
        config.eligibilityThreshold = params.eligibilityThreshold;

        // Initialize encrypted vote counters
        _choiceVotes = new euint32[](_choices.length);
        for (uint256 i = 0; i < _choices.length; ++i) {
            _choiceVotes[i] = FHE.asEuint32(0);
            FHE.allowThis(_choiceVotes[i]);
        }

        // Snapshot immediately (OZ uses proposal snapshot block)
        config.snapshotBlock = block.number;

        // Set prediction market configuration
        config.predictionMarketEnabled = params.predictionMarketEnabled;
        if (config.predictionMarketEnabled) {
            predictionToken = params.predictionToken;
            if (predictionToken == address(0)) revert InvalidTokenAddress();
        }
    }

    // ============ Getter Functions for Config ============

    /// @notice Returns the space ID
    /// @return The space ID
    function spaceId() external view returns (bytes32) { return config.spaceId; }
    /// @notice Returns the proposal title
    /// @return The title
    function title() external view returns (string memory) { return config.title; }
    /// @notice Returns the proposal body URI
    /// @return The body URI
    function bodyURI() external view returns (string memory) { return config.bodyURI; }
    /// @notice Returns the proposal type
    /// @return The proposal type
    function pType() external view returns (ProposalType) { return config.pType; }
    /// @notice Returns the start time
    /// @return The start time
    function start() external view returns (uint64) { return config.start; }
    /// @notice Returns the end time
    /// @return The end time
    function end() external view returns (uint64) { return config.end; }
    /// @notice Returns the eligibility type
    /// @return The eligibility type
    function eligibilityType() external view returns (EligibilityType) { return config.eligibilityType; }
    /// @notice Returns the eligibility token
    /// @return The eligibility token address
    function eligibilityToken() external view returns (address) { return config.eligibilityToken; }
    /// @notice Returns the eligibility threshold
    /// @return The eligibility threshold
    function eligibilityThreshold() external view returns (uint256) { return config.eligibilityThreshold; }
    /// @notice Returns the creator address
    /// @return The creator address
    function creator() external view returns (address) { return config.creator; }

    // ============ View Functions ============
    /// @notice Returns the number of choices
    /// @return The number of choices
    function choicesLength() external view returns (uint256) {
        return _choices.length;
    }

    /// @notice Returns the choice at the given index
    /// @param index The index of the choice
    /// @return The choice string
    function choices(uint256 index) external view returns (string memory) {
        if (index >= _choices.length) revert InvalidChoiceIndex();
        return _choices[index];
    }

    /// @notice Returns the encrypted vote count for a choice
    /// @param choiceIndex The index of the choice
    /// @return The encrypted vote count
    function getEncryptedChoiceVotes(uint256 choiceIndex) external view returns (euint32) {
        if (choiceIndex >= _choices.length) revert InvalidChoiceIndex();
        return _choiceVotes[choiceIndex];
    }

    /// @notice Get vote percentages for each choice (basis points, e.g., 5000 = 50%)
    /// @return The vote percentages
    function getVotePercentages() external view returns (uint256[] memory) {
        if ((statusFlags & 1) == 0) revert ResultsAlreadyRevealed();
        uint256[] memory percentages = new uint256[](_choices.length);
        uint256 total = 0;
        for (uint256 i = 0; i < choiceVotes.length; ++i) {
            total += choiceVotes[i];
        }
        if (total == 0) return percentages;
        for (uint256 i = 0; i < choiceVotes.length; ++i) {
            percentages[i] = (choiceVotes[i] * 10000) / total;
        }
        return percentages;
    }

    /// @notice Returns the time until the proposal starts
    /// @return The time in seconds
    function timeUntilProposalStarts() external view returns (uint256) {
        return config.start > block.timestamp ? config.start - block.timestamp : 0;
    }

    /// @notice Returns the time until the proposal ends
    /// @return The time in seconds
    function timeUntilProposalEnds() external view returns (uint256) {
        return config.end > block.timestamp ? config.end - block.timestamp : 0;
    }

    // ============ Voting Functions ============
    /// @notice Non-weighted single choice voting
    /// @param inputEuint8 The encrypted choice
    /// @param inputProof The proof for the input
    function voteNonweighted(externalEuint8 inputEuint8, bytes calldata inputProof) external proposalActive {
        if (hasVoted[msg.sender]) revert AlreadyVoted();
        if (!spaceRegistry.spaceMembers(config.spaceId, msg.sender)) revert NotSpaceMember();

        _userVotes[msg.sender] = FHE.fromExternal(inputEuint8, inputProof);
        FHE.allowThis(_userVotes[msg.sender]);

        for (uint256 i = 0; i < _choices.length; ++i) {
            _choiceVotes[i] = FHE.add(
                _choiceVotes[i],
                FHE.select(FHE.eq(_userVotes[msg.sender], FHE.asEuint8(uint8(i))), FHE.asEuint32(1), FHE.asEuint32(0))
            );
            FHE.allowThis(_choiceVotes[i]);
        }

        hasVoted[msg.sender] = true;
        ++totalVoters; // add total unique voters
        emit Voted(msg.sender, block.timestamp);
        emit TotalVotersUpdated(totalVoters);
    }

    /// @notice Weighted fractional: split snapshotted weight by encrypted percentages (0..100 per choice; sum == 100)
    /// @param percentageInputs The encrypted percentages
    /// @param totalPercentageProof The proof for the percentages
    function voteWeightedFractional(
        externalEuint32[] calldata percentageInputs,
        bytes calldata totalPercentageProof
    ) external proposalActive {
        if (hasVoted[msg.sender]) revert AlreadyVoted();
        if (config.pType != ProposalType.WeightedFractional) revert WrongProposalType();
        if (percentageInputs.length != _choices.length) revert InvalidPercentageInputLength();
        if (totalPercentageProof.length == 0) revert MissingPercentageProof();

        if (!spaceRegistry.spaceMembers(config.spaceId, msg.sender)) revert NotSpaceMember();

        uint256 totalWeight = _getTotalWeight();

        euint32 encryptedTotalWeight = FHE.asEuint32(uint32(totalWeight));
        FHE.allowThis(encryptedTotalWeight);

        _userFractionalVotes[msg.sender] = new euint32[](_choices.length);
        for (uint256 i = 0; i < _choices.length; ++i) {
            _userFractionalVotes[msg.sender][i] = FHE.fromExternal(percentageInputs[i], totalPercentageProof);
            FHE.allowThis(_userFractionalVotes[msg.sender][i]);
        }

        for (uint256 i = 0; i < _choices.length; ++i) {
            euint32 weightedVote = FHE.mul(_userFractionalVotes[msg.sender][i], encryptedTotalWeight);
            FHE.allowThis(weightedVote);
            _choiceVotes[i] = FHE.add(_choiceVotes[i], weightedVote);
            FHE.allowThis(_choiceVotes[i]);
        }

        hasVoted[msg.sender] = true;
        ++totalVoters; // add total unique voters
        emit Voted(msg.sender, block.timestamp);
        emit TotalVotersUpdated(totalVoters);
    }

    /// @notice Weighted single: full snapshotted weight to one encrypted choice
    /// @param inputEuint8 The encrypted choice
    /// @param inputProof The proof for the input
    function voteWeightedSingle(externalEuint8 inputEuint8, bytes calldata inputProof) external proposalActive {
        if (hasVoted[msg.sender]) revert AlreadyVoted();
        if (config.pType != ProposalType.WeightedSingleChoice) revert WrongProposalType();

        if (!spaceRegistry.spaceMembers(config.spaceId, msg.sender)) revert NotSpaceMember();

        uint256 totalWeight = _getTotalWeight();

        euint32 encryptedTotalWeight = FHE.asEuint32(uint32(totalWeight));
        FHE.allowThis(encryptedTotalWeight);

        euint8 encryptedChoice = FHE.fromExternal(inputEuint8, inputProof);
        FHE.allowThis(encryptedChoice);

        for (uint256 i = 0; i < _choices.length; ++i) {
            _choiceVotes[i] = FHE.add(
                _choiceVotes[i],
                FHE.select(FHE.eq(encryptedChoice, FHE.asEuint8(uint8(i))), encryptedTotalWeight, FHE.asEuint32(0))
            );
            FHE.allowThis(_choiceVotes[i]);
        }

        hasVoted[msg.sender] = true;
        ++totalVoters; // add total unique voters
        emit Voted(msg.sender, block.timestamp);
        emit TotalVotersUpdated(totalVoters);
    }

    // ============ Prediction Market Functions ============

    /**
     * @notice Make a prediction on which choice will win by staking tokens
     * @param encryptedChoice The encrypted choice index (0-based)
     * @param choiceProof The proof for the encrypted choice
     * @param tokenAmount The amount of tokens to stake (not encrypted for refunds)
     * @dev Anyone can predict unlimited times, cancellations allowed with fee
     */
    function makePrediction(
        externalEuint8 encryptedChoice,
        bytes calldata choiceProof,
        uint256 tokenAmount
    ) external nonReentrant {
        if (!config.predictionMarketEnabled) revert PredictionMarketNotEnabled();
        if (predictionToken == address(0)) revert InvalidTokenAddress();
        if (tokenAmount == 0) revert InvalidStakeAmount();
        if (predictionsRevealed) revert PredictionsAlreadyRevealed();

        // If user already has a prediction, they must cancel it first
        if (hasPredicted[msg.sender]) {
            _cancelPrediction(msg.sender);
        }

        // Convert external encrypted input
        euint8 predictedChoice = FHE.fromExternal(encryptedChoice, choiceProof);
        FHE.allowThis(predictedChoice);

        // Store encrypted prediction
        _userPredictions[msg.sender] = predictedChoice;
        predictionStakes[msg.sender] = tokenAmount;
        hasPredicted[msg.sender] = true;
        totalPredictionPool += tokenAmount;

        // Transfer tokens from user to contract
        bool success = IERC20(predictionToken).transferFrom(msg.sender, address(this), tokenAmount);
        if (!success) revert TokenTransferFailed();

        emit PredictionMade(msg.sender, tokenAmount);
    }

    /**
     * @notice Cancel prediction and get refund minus cancellation fee
     * @dev Can be called anytime before predictions are revealed
     */
    function cancelPrediction() external nonReentrant {
        _cancelPrediction(msg.sender);
    }

    /**
     * @notice Internal function to cancel a prediction
     * @param user The user whose prediction to cancel
     */
    function _cancelPrediction(address user) internal {
        if (!hasPredicted[user]) revert NoPredictionToCancel();
        if (predictionsRevealed) revert PredictionsAlreadyRevealed();

        uint256 stakedAmount = predictionStakes[user];
        uint256 fee = (stakedAmount * CANCELLATION_FEE_BPS) / 10000;
        uint256 refundAmount = stakedAmount - fee;

        // Update state (set encrypted prediction to 0 instead of deleting)
        _userPredictions[user] = FHE.asEuint8(0);
        delete predictionStakes[user];
        hasPredicted[user] = false;
        totalPredictionPool -= stakedAmount;
        accumulatedFees += fee;

        // Refund user minus fee
        bool success = IERC20(predictionToken).transfer(user, refundAmount);
        if (!success) revert TokenTransferFailed();

        emit PredictionCancelled(user, refundAmount, fee);
    }

    /**
     * @notice Reveal predictions after voting ends (anyone can call)
     * @dev Makes all predictions publicly decryptable for tallying
     */
    function revealPredictionsForPayout() external proposalEnded {
        if ((statusFlags & 1) == 0) revert ResultsAlreadyRevealed(); // Voting must be revealed first
        if (predictionsRevealed) revert PredictionsAlreadyRevealed();
        if (!config.predictionMarketEnabled) revert PredictionMarketNotEnabled();

        predictionsRevealed = true;
        emit PredictionMarketRevealed();
    }

    /**
     * @notice Claim winnings if prediction was correct
     * @dev Winners split the pool proportionally to their stake
     * @dev User must call revealMyPrediction first to make their prediction decryptable
     */
    function claimWinnings() external nonReentrant {
        if (!predictionsRevealed) revert PredictionsNotYetRevealed();
        if (!hasPredicted[msg.sender]) revert NoPredictionToCancel();
        if (hasClaimedWinnings[msg.sender]) revert AlreadyClaimed();

        // Note: In production, predictions need to be made publicly decryptable
        // and then decrypted through the callback mechanism similar to vote results
        // For now, we assume the prediction has been revealed through tallyPredictions

        // Calculate winnings
        uint256 userStake = predictionStakes[msg.sender];
        
        uint256 totalWinningStakes = totalStakedPerChoice[winningChoice];
        if (totalWinningStakes == 0) revert NoWinnings();

        // Winner gets proportional share of entire pool
        uint256 winnings = (totalPredictionPool * userStake) / totalWinningStakes;

        hasClaimedWinnings[msg.sender] = true;

        // Transfer winnings
        bool success = IERC20(predictionToken).transfer(msg.sender, winnings);
        if (!success) revert TokenTransferFailed();

        emit WinningsClaimed(msg.sender, winnings);
    }

    /**
     * @notice Calculate total staked per choice (called once during first claim)
     * @dev This is expensive but only done once
     */
    function _calculateTotalStakedPerChoice() internal {
        // Note: In production, you'd maintain a list of predictors
        // For now, this is a placeholder that needs to be called with actual user addresses
        // The frontend would need to track all predictors and call a batch function
    }

    /**
     * @notice Manual function to register stakes per choice for a batch of users
     * @param users Array of user addresses who made predictions
     * @param predictedChoices Array of decrypted prediction choices (same order as users)
     * @dev Call this after predictions are revealed to tally up stakes per choice
     * @dev The predictions must be decrypted off-chain and provided here
     */
    function tallyPredictions(address[] calldata users, uint8[] calldata predictedChoices) external {
        if (!predictionsRevealed) revert PredictionsNotYetRevealed();
        if (users.length != predictedChoices.length) revert InvalidPercentageInputLength();

        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            if (hasPredicted[user] && !hasClaimedWinnings[user]) {
                uint8 predictedChoice = predictedChoices[i];
                uint256 stake = predictionStakes[user];
                totalStakedPerChoice[predictedChoice] += stake;
                
                // Check if user predicted correctly and mark them eligible
                if (predictedChoice != winningChoice) {
                    hasClaimedWinnings[user] = true; // Mark as "claimed" to prevent claiming
                }
            }
        }
    }

    /**
     * @notice Set the prediction token address (only callable by factory)
     * @param _token The token address to use for predictions
     */
    function setPredictionToken(address _token) external onlyFactory {
        if (_token == address(0)) revert InvalidTokenAddress();
        predictionToken = _token;
    }

    /**
     * @notice Get prediction market info
     */
    function getPredictionMarketInfo() external view returns (
        bool enabled,
        address token,
        uint256 totalPool,
        uint256 fees,
        bool revealed
    ) {
        return (
            config.predictionMarketEnabled,
            predictionToken,
            totalPredictionPool,
            accumulatedFees,
            predictionsRevealed
        );
    }

    /**
     * @notice Get user's prediction info
     */
    function getUserPredictionInfo(address user) external view returns (
        bool hasMadePrediction,
        uint256 stakedAmount,
        bool hasClaimed
    ) {
        return (
            hasPredicted[user],
            predictionStakes[user],
            hasClaimedWinnings[user]
        );
    }

    // ============ Resolution (no quorum/threshold) ============
    /// @notice Performs upkeep to trigger reveal
    function performUpkeep(bytes calldata /* _performData */) external onlyFactory {
        if (block.timestamp < config.end) revert ProposalEnded();
        if ((statusFlags & 1) != 0) revert ResultsAlreadyRevealed();
        if ((statusFlags & 8) != 0) revert AutoRevealTriggered();
        if ((statusFlags & 64) != 0) revert RevealAlreadyRequested();

        statusFlags |= 8 | 64;

        for (uint256 i = 0; i < _choices.length; ++i) {
            _choiceVotes[i] = FHE.makePubliclyDecryptable(_choiceVotes[i]);
        }

        bytes32[] memory choiceVoteHandles = new bytes32[](_choices.length);
        for (uint256 i = 0; i < _choices.length; ++i) {
            choiceVoteHandles[i] = FHE.toBytes32(_choiceVotes[i]);
        }

        emit TallyRevealRequested(choiceVoteHandles);
        emit ReadyToReveal(block.timestamp);
    }

    /// @notice Computes vote percentages in basis points
    /// @param votes The vote counts
    /// @return The percentages
    function _computeVotePercentages(uint256[] memory votes) internal pure returns (uint256[] memory) {
        uint256[] memory percentages = new uint256[](votes.length);
        uint256 total = 0;
        for (uint256 i = 0; i < votes.length; ++i) {
            total += votes[i];
        }
        if (total > 0) {
            for (uint256 i = 0; i < votes.length; ++i) {
                percentages[i] = (votes[i] * 10000) / total;
            }
        }
        return percentages;
    }

    /// @notice Gets the total weight for the sender
    /// @return The total voting weight
    function _getTotalWeight() internal view returns (uint256) {
        if (config.eligibilityType == EligibilityType.TokenHolder) {
            if (IERC20(config.eligibilityToken).balanceOf(msg.sender) < config.eligibilityThreshold) {
                revert InsufficientTokenBalance();
            }
        }
        if (config.eligibilityToken == address(0)) revert NoVotingPower();
        uint256 totalWeight = IVotes(config.eligibilityToken).getPastVotes(msg.sender, config.snapshotBlock);
        if (totalWeight == 0) revert NoVotingPower();
        return totalWeight;
    }

    /// @notice Finds the winner and tie count
    /// @return win The winning choice index
    /// @return maxVotes The maximum votes
    /// @return tieCount The number of ties
    function _findWinner() internal view returns (uint8 win, uint256 maxVotes, uint256 tieCount) {
        uint256 abstainIndex = (statusFlags & 32) != 0 ? _choices.length - 1 : type(uint256).max;
        uint256 maxV = 0;
        uint8 w = 0;
        uint256 tCount = 0;
        bool found = false;
        for (uint256 i = 0; i < _choices.length; ++i) {
            if (i != abstainIndex) {
                if (!found || choiceVotes[i] > maxV) {
                    maxV = choiceVotes[i];
                    w = uint8(i);
                    tCount = 1;
                    found = true;
                } else if (choiceVotes[i] == maxV) {
                    ++tCount;
                }
            }
        }
        return (w, maxV, tCount);
    }

    /// @notice Resolves the proposal outcome
    function _resolveProposalOutcome() internal {
        if ((statusFlags & 2) != 0) revert AlreadyResolved();

        (uint8 win, uint256 maxVotes, uint256 tieCount) = _findWinner();

        if (tieCount > 1) {
            statusFlags |= 16;
            statusFlags &= ~uint8(4);
            winningChoice = 255;
        } else {
            winningChoice = win;
            if (passingThreshold == 0) {
                if (maxVotes > 0) statusFlags |= 4; else statusFlags &= ~uint8(4);
            } else {
                if (votePercentages[win] > passingThreshold) statusFlags |= 4; else statusFlags &= ~uint8(4);
            }
        }

        statusFlags |= 2;
        emit ProposalResolved(winningChoice, (statusFlags & 4) != 0);
    }

    /// @notice Resolves the proposal with decrypted results
    /// @param proposalAddress The proposal address
    /// @param cleartexts The decrypted vote counts
    /// @param decryptionProof The proof for decryption
    function resolveProposalCallback(
        address proposalAddress,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) public {
        if (proposalAddress != address(this)) revert InvalidProposalAddress();
        if ((statusFlags & 64) == 0) revert RevealNotRequested();
        if ((statusFlags & 1) != 0) revert ResultsAlreadyRevealed();

        bytes32[] memory handlesList = new bytes32[](_choices.length);
        for (uint256 i = 0; i < _choices.length; ++i) {
            handlesList[i] = FHE.toBytes32(_choiceVotes[i]);
        }

        FHE.checkSignatures(handlesList, cleartexts, decryptionProof);

        uint256[] memory votes = new uint256[](_choices.length);
        for (uint256 i = 0; i < _choices.length; ++i) {
            assembly {
                mstore(add(add(votes, 32), mul(i, 32)), mload(add(add(cleartexts, 32), mul(i, 32))))
            }
        }

        // Apply fractional scaling (percentages) once, after decryption
        if (config.pType == ProposalType.WeightedFractional) {
            for (uint256 i = 0; i < votes.length; ++i) {
                votes[i] = votes[i] / 100;
            }
        }

        choiceVotes = votes;

        // Compute and store vote percentages in basis points
        votePercentages = _computeVotePercentages(choiceVotes);

        statusFlags |= 1;
        emit ResultsRevealed(choiceVotes);
        emit VotePercentagesRevealed(votePercentages);

        _resolveProposalOutcome();
    }
}
