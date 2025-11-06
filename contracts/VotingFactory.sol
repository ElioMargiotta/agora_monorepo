// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./zamahub.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

/// @title Factory for deploying new voting instances with Chainlink automation
/// @notice Deploy and manage multiple voting contracts from a single factory
/// @dev ONE Chainlink Upkeep monitors ALL votings - highly scalable!
contract VotingFactory is AutomationCompatibleInterface {
    
    // ============ State Variables ============
    
    address public owner;
    address public protocolTreasury;
    address public wheelPool;
    address public usdcToken;
    
    address[] public allVotings;
    mapping(string => address) public votingByName;
    mapping(address => uint256) public votingIndex;
    mapping(address => bool) public isValidVoting;
    mapping(address => bool) public isWhitelisted;
    mapping(address => address[]) public userVotings;
    mapping(address => bool) public isCancelled; // Track cancelled votings
    
    // ============ Events ============
    
    event VotingCreated(
        address indexed votingAddress,
        string name,
        uint256 voteDepositAmount,
        uint256 votingDuration,
        uint256 votingStartTime,
        uint256 votingEndTime,
        uint256 createdAt,
        address indexed creator
    );
    
    event VotingCancelled(address indexed votingAddress, string name, address indexed cancelledBy);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event WheelPoolUpdated(address indexed oldWheelPool, address indexed newWheelPool);
    event USDCTokenUpdated(address indexed oldToken, address indexed newToken);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event WhitelistUpdated(address indexed user, bool status);
    event UserVoteRecorded(address indexed user, address indexed votingAddress);
    event UpkeepPerformed(address indexed votingAddress, uint256 timestamp);
    event UpkeepFailed(address indexed votingAddress, string reason);
    
    // ============ Errors (saves gas vs require strings) ============
    
    error OnlyOwner();
    error NotWhitelisted();
    error ZeroAddress();
    error EmptyName();
    error NameTooLong();
    error NameAlreadyUsed();
    error DurationTooShort();
    error DurationTooLong();
    error StartTimeInPast();
    error InvalidIndex();
    error NotValidVoting();
    error OnlyValidVotings();
    error InvalidDepositAmount();
    error VotingAlreadyStarted();
    error VotingNotCancellable();
    error AlreadyCancelled();
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }
    
    modifier onlyWhitelisted() {
        if (!isWhitelisted[msg.sender] && msg.sender != owner) revert NotWhitelisted();
        _;
    }
    
    // ============ Constructor ============
    
    constructor(
        address _protocolTreasury,
        address _wheelPool,
        address _usdcToken
    ) {
        if (_protocolTreasury == address(0) || _wheelPool == address(0) || _usdcToken == address(0)) {
            revert ZeroAddress();
        }
        
        owner = msg.sender;
        protocolTreasury = _protocolTreasury;
        wheelPool = _wheelPool;
        usdcToken = _usdcToken;
        isWhitelisted[msg.sender] = true;
    }
    
    // ============ Whitelist Management ============
    
    function updateWhitelist(address user, bool status) external onlyOwner {
        if (user == address(0)) revert ZeroAddress();
        isWhitelisted[user] = status;
        emit WhitelistUpdated(user, status);
    }
    
    function batchUpdateWhitelist(address[] calldata users, bool status) external onlyOwner {
        uint256 len = users.length;
        for (uint256 i = 0; i < len; ) {
            if (users[i] == address(0)) revert ZeroAddress();
            isWhitelisted[users[i]] = status;
            emit WhitelistUpdated(users[i], status);
            unchecked { ++i; }
        }
    }
    
    // ============ Voting Creation ============
    
    /// @notice Create a new voting instance with custom USDC amount and start time
    /// @param name Question/name for this vote
    /// @param voteDepositAmount USDC deposit amount (must be >= 10 USDC and multiple of 10)
    /// @param votingStartTime Unix timestamp when voting begins (0 = immediate)
    /// @param votingDuration Duration in seconds
    /// @return votingAddress Address of the newly deployed voting contract
    function createVoting(
        string memory name,
        uint256 voteDepositAmount,
        uint256 votingStartTime,
        uint256 votingDuration
    ) external onlyWhitelisted returns (address votingAddress) {
        bytes memory nameBytes = bytes(name);
        if (nameBytes.length == 0) revert EmptyName();
        if (nameBytes.length > 200) revert NameTooLong();
        if (votingByName[name] != address(0)) revert NameAlreadyUsed();
        
        // Validate USDC amount: minimum 10 USDC, must be multiple of 10
        if (voteDepositAmount < 10 * 10**6) revert InvalidDepositAmount();
        if (voteDepositAmount % (10 * 10**6) != 0) revert InvalidDepositAmount();
        
        if (votingDuration < 5 minutes) revert DurationTooShort();
        if (votingDuration > 365 days) revert DurationTooLong();
        
        if (votingStartTime == 0) {
            votingStartTime = block.timestamp;
        } else {
            if (votingStartTime < block.timestamp) revert StartTimeInPast();
        }
        
        PrivateVoting voting = new PrivateVoting(
            name,
            voteDepositAmount,
            votingStartTime,
            votingDuration,
            protocolTreasury,
            wheelPool
        );
        
        votingAddress = address(voting);
        voting.setUSDCToken(usdcToken);
        
        uint256 index = allVotings.length;
        allVotings.push(votingAddress);
        votingByName[name] = votingAddress;
        votingIndex[votingAddress] = index;
        isValidVoting[votingAddress] = true;
        
        uint256 votingEndTime = votingStartTime + votingDuration;
        
        emit VotingCreated(
            votingAddress, 
            name,
            voteDepositAmount,
            votingDuration, 
            votingStartTime,
            votingEndTime, 
            block.timestamp,
            msg.sender
        );
    }
    
    /// @notice Cancel a voting before it starts (only creator or owner)
    /// @param votingAddress Address of the voting to cancel
    function cancelVoting(address votingAddress) external {
        if (!isValidVoting[votingAddress]) revert NotValidVoting();
        if (isCancelled[votingAddress]) revert AlreadyCancelled();
        
        PrivateVoting voting = PrivateVoting(votingAddress);
        
        // Only creator or owner can cancel
        if (voting.creator() != msg.sender && msg.sender != owner) revert NotWhitelisted();
        
        // Can only cancel before voting starts
        if (block.timestamp >= voting.votingStartTime()) revert VotingAlreadyStarted();
        
        // Can only cancel if no one has voted yet
        if (voting.totalVotingUSDC() > 0) revert VotingNotCancellable();
        
        string memory votingName = voting.name();
        
        // Mark as cancelled (cheaper than array removal)
        isCancelled[votingAddress] = true;
        isValidVoting[votingAddress] = false;
        delete votingByName[votingName];
        
        emit VotingCancelled(votingAddress, votingName, msg.sender);
    }
    
    function recordUserVote(address user, address votingAddress) external {
        if (!isValidVoting[msg.sender]) revert OnlyValidVotings();
        userVotings[user].push(votingAddress);
        emit UserVoteRecorded(user, votingAddress);
    }
    
    // ============ View Functions ============
    
    function votingCount() external view returns (uint256) {
        return allVotings.length;
    }
    
    function getVoting(uint256 index) external view returns (address) {
        if (index >= allVotings.length) revert InvalidIndex();
        return allVotings[index];
    }
    
    function getAllVotings() external view returns (address[] memory) {
        return allVotings;
    }
    
    function getUpcomingVotings() external view returns (address[] memory) {
        return _filterVotings(0);
    }
    
    function getActiveVotings() external view returns (address[] memory) {
        return _filterVotings(1);
    }
    
    function getEndedVotings() external view returns (address[] memory) {
        return _filterVotings(2);
    }
    
    function getUserVotings(address user) external view returns (address[] memory) {
        return userVotings[user];
    }
    

    
    // ============ Internal Helper ============
    
    function _filterVotings(uint8 s) internal view returns (address[] memory) {
        uint256 len = allVotings.length;
        uint256 count;
        
        for (uint256 i; i < len; ) {
            // Skip cancelled votings
            if (isCancelled[allVotings[i]]) {
                unchecked { ++i; }
                continue;
            }
            
            PrivateVoting v = PrivateVoting(allVotings[i]);
            uint256 st = v.votingStartTime();
            uint256 et = v.votingEndTime();
            
            if ((s == 0 && block.timestamp < st) || 
                (s == 1 && block.timestamp >= st && block.timestamp < et) || 
                (s == 2 && block.timestamp >= et)) {
                unchecked { ++count; }
            }
            unchecked { ++i; }
        }
        
        address[] memory result = new address[](count);
        uint256 idx;
        
        for (uint256 i; i < len; ) {
            // Skip cancelled votings
            if (isCancelled[allVotings[i]]) {
                unchecked { ++i; }
                continue;
            }
            
            PrivateVoting v = PrivateVoting(allVotings[i]);
            uint256 st = v.votingStartTime();
            uint256 et = v.votingEndTime();
            
            if ((s == 0 && block.timestamp < st) || 
                (s == 1 && block.timestamp >= st && block.timestamp < et) || 
                (s == 2 && block.timestamp >= et)) {
                result[idx] = allVotings[i];
                unchecked { ++idx; }
            }
            unchecked { ++i; }
        }
        return result;
    }
    
    // ============ Chainlink Automation ============
    
    /// @notice Check if any votings need resolution (called by Chainlink off-chain)
    /// @dev Scans all votings and returns those ready for decryption
    /// @return upkeepNeeded True if at least one voting is ready
    /// @return performData Encoded array of voting addresses to process
    function checkUpkeep(bytes calldata /* checkData */)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        uint256 len = allVotings.length;
        address[] memory readyVotings = new address[](len);
        uint256 readyCount = 0;
        
        for (uint256 i = 0; i < len; ) {
            // Skip cancelled votings
            if (isCancelled[allVotings[i]]) {
                unchecked { ++i; }
                continue;
            }
            
            PrivateVoting voting = PrivateVoting(allVotings[i]);
            
            if (
                block.timestamp >= voting.votingEndTime() &&
                !voting.resultsRevealed() &&
                !voting.autoRevealTriggered() &&
                voting.usdcToken() != address(0)
            ) {
                readyVotings[readyCount] = allVotings[i];
                unchecked { ++readyCount; }
            }
            unchecked { ++i; }
        }
        
        upkeepNeeded = readyCount > 0;
        
        if (readyCount > 0) {
            address[] memory result = new address[](readyCount);
            for (uint256 i = 0; i < readyCount; ) {
                result[i] = readyVotings[i];
                unchecked { ++i; }
            }
            performData = abi.encode(result);
        }
    }
    
    /// @notice Perform upkeep - triggers decryption for ready votings
    /// @dev Called by Chainlink Automation when checkUpkeep returns true
    /// @dev Processes up to 10 votings per call to avoid gas limits
    function performUpkeep(bytes calldata performData) external override {
        address[] memory votingsToResolve = abi.decode(performData, (address[]));
        uint256 len = votingsToResolve.length;
        uint256 maxBatch = len > 10 ? 10 : len;
        
        for (uint256 i = 0; i < maxBatch; ) {
            PrivateVoting voting = PrivateVoting(votingsToResolve[i]);
            
            // Re-verify conditions before triggering
            if (
                block.timestamp >= voting.votingEndTime() &&
                !voting.resultsRevealed() &&
                !voting.autoRevealTriggered() &&
                voting.usdcToken() != address(0)
            ) {
                try voting.performUpkeep("") {
                    emit UpkeepPerformed(votingsToResolve[i], block.timestamp);
                } catch Error(string memory reason) {
                    emit UpkeepFailed(votingsToResolve[i], reason);
                } catch {
                    emit UpkeepFailed(votingsToResolve[i], "Unknown error");
                }
            }
            unchecked { ++i; }
        }
    }
    
    // ============ Admin Functions ============
    
    function updateTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        address oldTreasury = protocolTreasury;
        protocolTreasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}