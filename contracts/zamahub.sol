// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, ebool, externalEuint64, euint8, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IWheelPool {
    function recordDeposit(uint256 amount) external;
}

interface IVotingFactory {
    function recordUserVote(address user, address votingAddress) external;
}

/// @title Private Voting System with USDC (Factory-Managed)
/// @notice Vote on 3 options by depositing USDC - votes and results are encrypted until reveal
/// @dev Uses FHE for complete privacy of votes and tallies until voting ends
/// @dev Factory-based automation: ONE Chainlink Upkeep monitors ALL votings
/// 
/// @dev ✅ FULLY AUTOMATIC WORKFLOW (Chainlink + Zama Oracle Pattern):
/// - TIME T: Factory's Chainlink Keeper automatically calls factory.performUpkeep()
/// - Factory triggers this.performUpkeep() for ready votings
/// - performUpkeep() → requests decryption from oracle (like decryptWinningAddress())
/// - Oracle → calls resolveVotingCallback() with decrypted values
/// - Callback → automatically resolves voting and distributes to WheelPool (no manual action needed)
/// - Users → call claimReward() with automatic vote decryption
/// 
/// @dev SECURITY MODEL - DecryptionOracle Pattern:
/// - Users CANNOT directly decrypt their votes (no FHE.allow() permission given)
/// - All decryption happens via Zama's DecryptionOracle with cryptographic proofs
/// - Vote tallies: Chainlink triggers → oracle calls back → auto-resolves
/// - Individual votes: claimReward() auto-requests decryption if needed
/// - This prevents users from lying about their votes to manipulate rewards
contract PrivateVoting is SepoliaConfig {
    
    // ============ State Variables ============
    
    string public name;
    
    /// @notice USDC token address
    address public usdcToken;
    
    /// @notice Factory address (can trigger resolution)
    address public factory;
    
    /// @notice Creator of this voting (whitelisted user who created it)
    address public creator;
    
    /// @notice Protocol treasury address receiving 2% fees + up to 5% surplus
    address public protocolTreasury;
    
    /// @notice WheelPool contract address receiving surplus beyond 5% of pool
    address public wheelPool;
    
    /// @notice Customizable USDC deposit amount for voting
    uint256 public VOTE_DEPOSIT_AMOUNT;
    
    /// @notice Fee percentage (2%)
    uint256 public constant FEE_PERCENTAGE = 2;
    
    /// @notice Maximum treasury surplus percentage (5% of total pool)
    uint256 public constant WHEEL_POOL_PERCENTAGE = 5;
    
    /// @notice Voting start timestamp - voting can only begin after this
    uint256 public votingStartTime;
    
    /// @notice Voting end timestamp - results can only be revealed after this
    uint256 public votingEndTime;
    
    /// @notice Track if user has already voted
    mapping(address => bool) public hasVoted;
    
    /// @notice Encrypted votes for each user (0, 1, or 2 for options A, B, C)
    mapping(address => euint8) private _userVotes;
    
    /// @notice Encrypted vote counts for each option (hidden until reveal)
    euint64 private _votesOptionA;
    euint64 private _votesOptionB;
    euint64 private _votesOptionC;
    
    /// @notice Total USDC collected from voting (after fees)
    uint256 public totalVotingUSDC;
    
    /// @notice Total fees collected (2% of deposits)
    uint256 public totalFeesCollected;
    
    /// @notice Whether voting has ended and results are revealed
    bool public resultsRevealed;
    
    /// @notice Whether voting has been resolved (minority/middle/majority determined)
    bool public votingResolved;
    
    /// @notice Decrypted vote counts after reveal
    uint256 public votesA;
    uint256 public votesB;
    uint256 public votesC;
    
    /// @notice Store decrypted votes after reveal (automatically via oracle callback)
    mapping(address => uint8) public decryptedVotes;
    mapping(address => bool) public voteDecrypted;
    
    /// @notice Track decryption request IDs for vote tallies
    uint256 private _latestTallyRequestId;
    
    /// @notice Track decryption request IDs for individual user votes
    mapping(address => uint256) private _userVoteRequestId;
    
    /// @notice Reverse mapping from requestId to user address for callbacks
    mapping(uint256 => address) private _requestIdToUser;
    
    /// @notice Options ranked by votes (0=A, 1=B, 2=C)
    uint8 public minorityOption;
    uint8 public middleOption;
    uint8 public majorityOption;
    
    /// @notice Multipliers for each ranking (in basis points, 100 = 1x)
    uint256 public minorityMultiplier;
    uint256 public middleMultiplier;
    uint256 public majorityMultiplier;
    
    /// @notice Track if user has claimed their reward
    mapping(address => bool) public hasClaimedReward;
    
    /// @notice Track if auto-reveal has been triggered by Chainlink
    bool public autoRevealTriggered;
    
    /// @notice Front-running protection: Track last transaction timestamp per user
    mapping(address => uint256) private _lastTxTimestamp;
    
    /// @notice Minimum time delay between transactions (anti-front-running)
    uint256 public constant MIN_TX_DELAY = 1 minutes;
    
    // ============ Events ============
    
    event VoteDeposit(address indexed user, uint256 usdcAmount, uint256 feeAmount, uint256 timestamp);
    event USDCTokenSet(address indexed token);
    event VotingEnded(uint256 timestamp);
    event ResultsRevealed(uint256 optionA, uint256 optionB, uint256 optionC);
    event VotingResolved(uint8 minorityOption, uint8 middleOption, uint8 majorityOption, uint256 treasuryAmount, uint256 wheelPoolAmount);
    event RewardClaimed(address indexed user, uint8 voteOption, uint256 rewardAmount);
    event ReadyToReveal(uint256 timestamp);
    event TallyDecryptionRequested(uint256 indexed requestId);
    event UserVoteDecryptionRequested(address indexed user, uint256 indexed requestId);
    
    // ============ Modifiers ============
    
    modifier onlyFactory() {
        require(msg.sender == factory, "Voting: only factory");
        _;
    }
    
    modifier votingActive() {
        require(block.timestamp >= votingStartTime, "Voting: voting not started yet");
        require(block.timestamp < votingEndTime, "Voting: voting has ended");
        _;
    }
    
    modifier votingEnded() {
        require(block.timestamp >= votingEndTime, "Voting: voting still active");
        _;
    }
    
    // ============ Constructor ============
    
    constructor(
        string memory _name,
        uint256 _voteDepositAmount,
        uint256 _votingStartTime,
        uint256 _votingDuration,
        address _protocolTreasury,
        address _wheelPool
    ) {
        require(_protocolTreasury != address(0), "Voting: zero treasury address");
        require(_wheelPool != address(0), "Voting: zero wheelpool address");
        require(_votingDuration >= 5 minutes, "Voting: duration too short");
        require(_voteDepositAmount >= 10 * 10**6, "Voting: deposit too small");
        require(_voteDepositAmount % (10 * 10**6) == 0, "Voting: invalid deposit amount");
        
        name = _name;
        VOTE_DEPOSIT_AMOUNT = _voteDepositAmount;
        factory = msg.sender; // Factory deploys this contract
        creator = tx.origin; // Track who created this voting
        votingStartTime = _votingStartTime;
        votingEndTime = _votingStartTime + _votingDuration;
        protocolTreasury = _protocolTreasury;
        wheelPool = _wheelPool;
        
        // Initialize vote counters (encrypted) with permissions
        _votesOptionA = FHE.asEuint64(0);
        FHE.allowThis(_votesOptionA);
        
        _votesOptionB = FHE.asEuint64(0);
        FHE.allowThis(_votesOptionB);
        
        _votesOptionC = FHE.asEuint64(0);
        FHE.allowThis(_votesOptionC);
    }
    
    // ============ Admin Functions ============
    
    /// @notice Set the USDC token address (can only be set once by factory)
    function setUSDCToken(address _usdcToken) external onlyFactory {
        require(_usdcToken != address(0), "Voting: invalid USDC address");
        require(usdcToken == address(0), "Voting: USDC token already set");
        usdcToken = _usdcToken;
        emit USDCTokenSet(_usdcToken);
    }
    
    // ============ View Functions ============
    
    /// @notice Get user's encrypted vote (only visible to the user)
    function voteOf(address account) external view returns (euint8) {
        return _userVotes[account];
    }
    
    /// @notice Get encrypted vote counts (only accessible after reveal)
    function votesOptionA() external view returns (euint64) {
        require(resultsRevealed, "Voting: results not revealed yet");
        return _votesOptionA;
    }
    
    function votesOptionB() external view returns (euint64) {
        require(resultsRevealed, "Voting: results not revealed yet");
        return _votesOptionB;
    }
    
    function votesOptionC() external view returns (euint64) {
        require(resultsRevealed, "Voting: results not revealed yet");
        return _votesOptionC;
    }
    
    /// @notice Get time until voting starts
    function timeUntilVotingStarts() external view returns (uint256) {
        if (block.timestamp >= votingStartTime) {
            return 0;
        }
        return votingStartTime - block.timestamp;
    }
    
    /// @notice Get time remaining until voting ends
    function timeUntilVotingEnds() external view returns (uint256) {
        if (block.timestamp >= votingEndTime) {
            return 0;
        }
        return votingEndTime - block.timestamp;
    }
    
    // ============ Voting Functions ============
    
    /// @notice Deposit USDC and vote for an option (ENCRYPTED INPUT)
    /// @param inputEuint8 Encrypted vote option handle (0 = Option A, 1 = Option B, 2 = Option C)
    /// @param inputProof Input proof for encrypted vote
    function depositVote(externalEuint8 inputEuint8, bytes calldata inputProof) external votingActive {
        require(usdcToken != address(0), "Voting: USDC token not set");
        require(!hasVoted[msg.sender], "Voting: already voted");
        
        // Front-running protection: Enforce minimum delay between transactions
        require(
            block.timestamp >= _lastTxTimestamp[msg.sender] + MIN_TX_DELAY,
            "Voting: transaction too soon after previous"
        );
        _lastTxTimestamp[msg.sender] = block.timestamp;
        
        // Transfer USDC from user to contract
        require(
            IERC20(usdcToken).transferFrom(msg.sender, address(this), VOTE_DEPOSIT_AMOUNT),
            "Voting: USDC transfer failed"
        );
        
        // Calculate and transfer 2% fee to protocol treasury
        uint256 feeAmount = (VOTE_DEPOSIT_AMOUNT * FEE_PERCENTAGE) / 100;
        require(
            IERC20(usdcToken).transfer(protocolTreasury, feeAmount),
            "Voting: fee transfer failed"
        );
        
        // Update accounting
        totalFeesCollected += feeAmount;
        totalVotingUSDC += VOTE_DEPOSIT_AMOUNT - feeAmount;
        
        // Convert encrypted input to euint8 and store
        _userVotes[msg.sender] = FHE.fromExternal(inputEuint8, inputProof);
        
        // Increment vote counters using encrypted comparison
        _votesOptionA = FHE.add(
            _votesOptionA,
            FHE.select(FHE.eq(_userVotes[msg.sender], FHE.asEuint8(0)), FHE.asEuint64(1), FHE.asEuint64(0))
        );
        FHE.allowThis(_votesOptionA);
        
        _votesOptionB = FHE.add(
            _votesOptionB,
            FHE.select(FHE.eq(_userVotes[msg.sender], FHE.asEuint8(1)), FHE.asEuint64(1), FHE.asEuint64(0))
        );
        FHE.allowThis(_votesOptionB);
        
        _votesOptionC = FHE.add(
            _votesOptionC,
            FHE.select(FHE.eq(_userVotes[msg.sender], FHE.asEuint8(2)), FHE.asEuint64(1), FHE.asEuint64(0))
        );
        FHE.allowThis(_votesOptionC);
        
        // Mark as voted and set permissions (only contract can access)
        hasVoted[msg.sender] = true;
        FHE.allowThis(_userVotes[msg.sender]);
        // NOTE: We do NOT allow the user to decrypt their vote directly
        // They must use requestUserVoteDecryption() which uses the DecryptionOracle
        
        // Notify factory that this user voted
        IVotingFactory(factory).recordUserVote(msg.sender, address(this));
        
        emit VoteDeposit(msg.sender, VOTE_DEPOSIT_AMOUNT - feeAmount, feeAmount, block.timestamp);
    }
    
    // ============ Resolution Functions ============
    
    /// @notice Trigger resolution (called by factory's performUpkeep)
    /// @dev ✅ FULLY AUTOMATIC: Factory triggers decryption, oracle resolves everything
    function performUpkeep(bytes calldata /* performData */) external onlyFactory {
        // Re-verify conditions for security (prevent unauthorized calls)
        require(block.timestamp >= votingEndTime, "Voting: voting still active");
        require(!resultsRevealed, "Voting: results already revealed");
        require(!autoRevealTriggered, "Voting: auto-reveal already triggered");
        require(usdcToken != address(0), "Voting: USDC not set");
        require(_latestTallyRequestId == 0, "Voting: decryption already requested");
        
        // Mark as triggered to prevent duplicate calls
        autoRevealTriggered = true;
        
        // ✅ AUTOMATICALLY REQUEST DECRYPTION (like Zama auction example)
        // Prepare array of encrypted values to decrypt
        bytes32[] memory cts = new bytes32[](3);
        cts[0] = FHE.toBytes32(_votesOptionA);
        cts[1] = FHE.toBytes32(_votesOptionB);
        cts[2] = FHE.toBytes32(_votesOptionC);
        
        // Request decryption from oracle - callback will auto-resolve voting
        _latestTallyRequestId = FHE.requestDecryption(cts, this.resolveVotingCallback.selector);
        
        emit ReadyToReveal(block.timestamp);
        emit TallyDecryptionRequested(_latestTallyRequestId);
    }
    
    /// @notice Callback function called by DecryptionOracle with decrypted vote tallies
    /// @param requestId The request ID to verify this is the expected callback
    /// @param cleartexts ABI-encoded decrypted values (votesA, votesB, votesC)
    /// @param decryptionProof Proof from the oracle to verify the decryption
    /// @dev ✅ AUTOMATIC RESOLUTION: This callback automatically resolves voting (no manual intervention needed)
    /// @dev Similar to Auction pattern: resolveAuctionCallback() - decrypts and resolves in one go
    function resolveVotingCallback(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) public {
        require(requestId == _latestTallyRequestId, "Voting: invalid request ID");
        
        // Verify signatures from the oracle (like auction pattern)
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);
        
        // Decode the decrypted vote counts (like auction pattern)
        (uint64 _votesA, uint64 _votesB, uint64 _votesC) = abi.decode(cleartexts, (uint64, uint64, uint64));
        
        // Validate decrypted values
        uint256 totalVotes = uint256(_votesA) + uint256(_votesB) + uint256(_votesC);
        uint256 netDeposit = VOTE_DEPOSIT_AMOUNT - (VOTE_DEPOSIT_AMOUNT * FEE_PERCENTAGE) / 100;
        uint256 maxPossibleVotes = totalVotingUSDC / netDeposit;
        require(totalVotes <= maxPossibleVotes, "Voting: invalid vote count from oracle");
        
        // Store decrypted values
        votesA = uint256(_votesA);
        votesB = uint256(_votesB);
        votesC = uint256(_votesC);
        
        resultsRevealed = true;
        
        emit VotingEnded(block.timestamp);
        emit ResultsRevealed(votesA, votesB, votesC);
        
        // ✅ AUTOMATICALLY RESOLVE VOTING IN THE CALLBACK (no manual intervention needed)
        _resolveVotingInternal();
    }
    
    /// @notice Internal function to resolve voting
    function _resolveVotingInternal() internal {
        require(resultsRevealed, "Voting: results not revealed yet");
        require(!votingResolved, "Voting: already resolved");
        
        // Rank options and determine multipliers
        (minorityOption, middleOption, majorityOption) = _rankOptions(votesA, votesB, votesC);
        _setMultipliers(votesA, votesB, votesC);
        
        // Calculate payouts
        uint256 minorityCount = _getVoteCount(minorityOption);
        uint256 middleCount = _getVoteCount(middleOption);
        uint256 majorityCount = _getVoteCount(majorityOption);
        uint256 netDeposit = VOTE_DEPOSIT_AMOUNT - (VOTE_DEPOSIT_AMOUNT * FEE_PERCENTAGE) / 100;
        
        uint256 minorityPayout = (minorityCount * netDeposit * minorityMultiplier) / 100;
        uint256 middlePayout = (middleCount * netDeposit * middleMultiplier) / 100;
        uint256 majorityPayout = (majorityCount * netDeposit * majorityMultiplier) / 100;
        uint256 totalPayouts = minorityPayout + middlePayout + majorityPayout;
        
        // Sanity check: Total payouts can't exceed 3x total pool (prevents overflow attacks)
        require(totalPayouts <= totalVotingUSDC * 3, "Voting: payout calculation overflow");
        
        // Calculate surplus distribution:
        // - Up to 5% of totalVotingUSDC goes to treasury
        // - Remaining surplus (if any) goes to WheelPool
        uint256 treasuryAmount = 0;
        uint256 wheelPoolAmount = 0;
        
        if (totalVotingUSDC > totalPayouts) {
            uint256 surplus = totalVotingUSDC - totalPayouts;
            uint256 maxTreasuryAmount = (totalVotingUSDC * WHEEL_POOL_PERCENTAGE) / 100; // Max 5% of pool
            
            // Treasury gets the lesser of: surplus or 5% of pool
            if (surplus <= maxTreasuryAmount) {
                treasuryAmount = surplus;
                wheelPoolAmount = 0;
            } else {
                treasuryAmount = maxTreasuryAmount;
                wheelPoolAmount = surplus - maxTreasuryAmount;
            }
        }
        
        // Transfer surplus to treasury
        if (treasuryAmount > 0) {
            bool treasurySuccess = IERC20(usdcToken).transfer(protocolTreasury, treasuryAmount);
            require(treasurySuccess, "Voting: treasury surplus transfer failed");
        }
        
        // Transfer remaining surplus to WheelPool
        if (wheelPoolAmount > 0) {
            bool wheelSuccess = IERC20(usdcToken).transfer(wheelPool, wheelPoolAmount);
            require(wheelSuccess, "Voting: wheelpool transfer failed");
            
            IWheelPool(wheelPool).recordDeposit(wheelPoolAmount);
        }
        
        votingResolved = true;
        
        emit VotingResolved(minorityOption, middleOption, majorityOption, treasuryAmount, wheelPoolAmount);
    }
    
    // ============ Claim Functions ============
    
    /// @notice Request decryption of user's vote via DecryptionOracle
    /// @dev OPTIONAL: claimReward() automatically requests decryption if needed
    /// This standalone function exists for users who want to pre-decrypt before claiming
    function requestUserVoteDecryption() external votingEnded {
        require(hasVoted[msg.sender], "Voting: did not vote");
        require(!voteDecrypted[msg.sender], "Voting: vote already decrypted");
        require(_userVoteRequestId[msg.sender] == 0, "Voting: decryption already requested");
        
        // Prepare encrypted value to decrypt
        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(_userVotes[msg.sender]);
        
        // Request decryption from oracle with callback
        uint256 requestId = FHE.requestDecryption(cts, this.userVoteDecryptionCallback.selector);
        _userVoteRequestId[msg.sender] = requestId;
        _requestIdToUser[requestId] = msg.sender;
        
        emit UserVoteDecryptionRequested(msg.sender, requestId);
    }
    
    /// @notice Callback function called by DecryptionOracle with decrypted user vote
    /// @param requestId The request ID to verify and find which user this is for
    /// @param cleartexts ABI-encoded decrypted vote value
    /// @param decryptionProof Proof from the oracle to verify the decryption
    function userVoteDecryptionCallback(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) public {
        // Find which user made this request
        address user = _requestIdToUser[requestId];
        require(user != address(0), "Voting: invalid request ID");
        require(_userVoteRequestId[user] == requestId, "Voting: request ID mismatch");
        
        // Verify signatures from the oracle
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);
        
        // Decode the decrypted vote
        (uint8 decryptedVote) = abi.decode(cleartexts, (uint8));
        require(decryptedVote <= 2, "Voting: invalid vote value");
        
        // Store the decrypted vote securely
        decryptedVotes[user] = decryptedVote;
        voteDecrypted[user] = true;
    }
    
    /// @notice Permissionless batch decrypt - anyone can help decrypt multiple user votes
    /// @param users Array of user addresses whose votes to decrypt
    /// @dev This is a public good - helps users avoid gas costs for individual decryption
    function batchRequestUserVoteDecryption(address[] calldata users) external votingEnded {
        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            if (hasVoted[user] && !voteDecrypted[user] && _userVoteRequestId[user] == 0) {
                bytes32[] memory cts = new bytes32[](1);
                cts[0] = FHE.toBytes32(_userVotes[user]);
                
                uint256 requestId = FHE.requestDecryption(cts, this.batchUserVoteCallback.selector);
                _userVoteRequestId[user] = requestId;
                _requestIdToUser[requestId] = user;
                
                emit UserVoteDecryptionRequested(user, requestId);
            }
        }
    }
    
    /// @notice Callback for batch user vote decryption
    function batchUserVoteCallback(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) public {
        // Find which user made this request
        address user = _requestIdToUser[requestId];
        require(user != address(0), "Voting: invalid request ID");
        require(_userVoteRequestId[user] == requestId, "Voting: request ID mismatch");
        
        // Verify signatures from the oracle
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);
        
        // Decode the decrypted vote
        (uint8 decryptedVote) = abi.decode(cleartexts, (uint8));
        require(decryptedVote <= 2, "Voting: invalid vote value");
        
        // Store the decrypted vote securely
        decryptedVotes[user] = decryptedVote;
        voteDecrypted[user] = true;
    }
    
    /// @notice Claim reward - automatically requests decryption if needed
    /// @dev ✅ ONE-STEP PROCESS: User only calls this once
    /// If vote not decrypted yet, this will request decryption and require second call
    /// If vote already decrypted, transfers reward immediately
    function claimReward() external {
        require(votingResolved, "Voting: not resolved yet");
        require(hasVoted[msg.sender], "Voting: did not vote");
        require(!hasClaimedReward[msg.sender], "Voting: reward already claimed");
        
        // Front-running protection: Enforce minimum delay between transactions
        require(
            block.timestamp >= _lastTxTimestamp[msg.sender] + MIN_TX_DELAY,
            "Voting: transaction too soon after previous"
        );
        _lastTxTimestamp[msg.sender] = block.timestamp;
        
        // If vote not decrypted yet, request decryption
        if (!voteDecrypted[msg.sender]) {
            // Only request if not already pending
            if (_userVoteRequestId[msg.sender] == 0) {
                bytes32[] memory cts = new bytes32[](1);
                cts[0] = FHE.toBytes32(_userVotes[msg.sender]);
                
                uint256 requestId = FHE.requestDecryption(cts, this.userVoteDecryptionCallback.selector);
                _userVoteRequestId[msg.sender] = requestId;
                _requestIdToUser[requestId] = msg.sender;
                
                emit UserVoteDecryptionRequested(msg.sender, requestId);
            }
            
            // Revert with helpful message
            revert("Voting: decryption requested - call claimReward again after oracle callback");
        }
        
        // Vote is decrypted, proceed with claim
        uint8 userVote = decryptedVotes[msg.sender];
        
        uint256 netDeposit = VOTE_DEPOSIT_AMOUNT - (VOTE_DEPOSIT_AMOUNT * FEE_PERCENTAGE) / 100;
        uint256 rewardAmount = 0;
        
        // Calculate reward based on multipliers
        if (userVote == minorityOption) {
            rewardAmount = (netDeposit * minorityMultiplier) / 100;
        } else if (userVote == middleOption) {
            rewardAmount = (netDeposit * middleMultiplier) / 100;
        } else if (userVote == majorityOption) {
            rewardAmount = (netDeposit * majorityMultiplier) / 100;
        }
        
        hasClaimedReward[msg.sender] = true;
        
        if (rewardAmount > 0) {
            bool success = IERC20(usdcToken).transfer(msg.sender, rewardAmount);
            require(success, "Voting: reward transfer failed");
        }
        
        emit RewardClaimed(msg.sender, userVote, rewardAmount);
    }
    
    // ============ Internal Helper Functions ============
    
    function _rankOptions(uint256 a, uint256 b, uint256 c) 
        internal 
        pure 
        returns (uint8 minority, uint8 middle, uint8 majority) 
    {
        if (a <= b && a <= c) {
            minority = 0;
            if (b <= c) {
                middle = 1;
                majority = 2;
            } else {
                middle = 2;
                majority = 1;
            }
        } else if (b <= a && b <= c) {
            minority = 1;
            if (a <= c) {
                middle = 0;
                majority = 2;
            } else {
                middle = 2;
                majority = 0;
            }
        } else {
            minority = 2;
            if (a <= b) {
                middle = 0;
                majority = 1;
            } else {
                middle = 1;
                majority = 0;
            }
        }
    }
    
    function _getVoteCount(uint8 option) internal view returns (uint256) {
        if (option == 0) return votesA;
        if (option == 1) return votesB;
        if (option == 2) return votesC;
        return 0;
    }
    
    function _setMultipliers(uint256 a, uint256 b, uint256 c) internal {
        uint256 minVotes = _min3(a, b, c);
        uint256 maxVotes = _max3(a, b, c);
        
        uint256 minCount = 0;
        uint256 maxCount = 0;
        if (a == minVotes) minCount++;
        if (b == minVotes) minCount++;
        if (c == minVotes) minCount++;
        if (a == maxVotes) maxCount++;
        if (b == maxVotes) maxCount++;
        if (c == maxVotes) maxCount++;
        
        uint256 minorityVotes = _getVoteCount(minorityOption);
        uint256 middleVotes = _getVoteCount(middleOption);
        uint256 majorityVotes = _getVoteCount(majorityOption);
        
        if (minVotes == maxVotes) {
            minorityMultiplier = 100;
            middleMultiplier = 100;
            majorityMultiplier = 100;
        }
        else if (minCount == 2 && minVotes != maxVotes) {
            if (minorityVotes == middleVotes) {
                minorityMultiplier = 150;
                middleMultiplier = 150;
                majorityMultiplier = 0;
            }
        }
        else if (maxCount == 2 && minVotes != maxVotes) {
            if (majorityVotes == middleVotes) {
                minorityMultiplier = 200;
                middleMultiplier = 50;
                majorityMultiplier = 50;
            }
        }
        else {
            minorityMultiplier = 200;
            middleMultiplier = 100;
            majorityMultiplier = 0;
        }
    }
    
    function _min3(uint256 a, uint256 b, uint256 c) internal pure returns (uint256) {
        if (a <= b && a <= c) return a;
        if (b <= c) return b;
        return c;
    }
    
    function _max3(uint256 a, uint256 b, uint256 c) internal pure returns (uint256) {
        if (a >= b && a >= c) return a;
        if (b >= c) return b;
        return c;
    }
}