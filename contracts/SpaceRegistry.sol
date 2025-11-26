// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ISpaceRegistry, MembershipType} from "./ISpaceRegistry.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/// @title ENS Interface
/// @author OpenZeppelin
/// @notice Minimal interface for ENS owner lookup
interface IENS {
    /// @notice Get the owner of an ENS node
    /// @param node The ENS node hash
    /// @return The owner address
    function owner(bytes32 node) external view returns (address);
}

/// @title Space Registry Contract
/// @author Zama Team
/// @notice Manages decentralized spaces for proposals
contract SpaceRegistry is ISpaceRegistry {
    /// @notice ENS registry contract
    IENS public ens;

    struct Space {
        bytes32 spaceId;
        address owner;
        uint256 createdAt;
        uint256 criteriaAmount;
        address criteriaContract;
        MembershipType membershipType;
        bool active;
        string ensName;
        string displayName;
        address[] members;
    }

    /// @notice Mapping of space ID to space details
    mapping(bytes32 spaceId => Space space) public spaces;
    /// @notice Mapping of owner to their space IDs
    mapping(address owner => bytes32[] spaces) public ownerSpaces;
    /// @notice Mapping of space ID to existence
    mapping(bytes32 spaceId => bool exists) public spaceExists;
    /// @notice Mapping of space ID to member status
    mapping(bytes32 spaceId => mapping(address member => bool isMember)) public spaceMembers;
    /// @notice Mapping of space ID to whitelist status
    mapping(bytes32 spaceId => mapping(address user => bool isWhitelisted)) public spaceWhitelist;
    /// @notice Mapping of space ID to admin status
    mapping(bytes32 spaceId => mapping(address admin => bool isAdmin)) public spaceAdmins;

    // Errors
    error SpaceAlreadyExists();
    error SpaceDoesNotExist();
    error NotSpaceOwner();
    error InvalidENSName();
    error NotENSOwner();
    error ZeroAddress();
    error InvalidDisplayName();
    error AlreadyMember();
    error CannotJoin();
    error NotMember();

    /// @notice Constructor to set ENS registry
    /// @param _ensRegistry The ENS registry address
    constructor(address _ensRegistry) {
        ens = IENS(_ensRegistry);
    }

    /**
     * @notice Create a new space with an ENS name that you own
     * @param ensName The ENS name for the space (must end with .eth and you must own it)
     * @param displayName Display name for the space (max 30 characters)
     * @param membershipType Type of membership (Public, Whitelist, TokenHolder, NFTHolder)
     * @param criteriaContract Contract address for token/NFT (ignored for Public/Whitelist)
     * @param criteriaAmount Minimum amount for token holders (ignored for Public/Whitelist)
     */
    function createSpace(
        string calldata ensName,
        string calldata displayName,
        MembershipType membershipType,
        address criteriaContract,
        uint256 criteriaAmount
    ) external {
        // Validate ENS name format (ends with .agora)
        if (!isValidENSName(ensName)) revert InvalidENSName();
        
        // Validate display name length
        if (bytes(displayName).length > 30) revert InvalidDisplayName();

        // Compute namehash and check ENS ownership
        bytes32 node = namehash(ensName);
        if (ens.owner(node) != msg.sender) revert NotENSOwner();

        // Compute spaceId from ENS name
        bytes32 spaceId = keccak256(abi.encodePacked(ensName));

        if (spaceExists[spaceId]) revert SpaceAlreadyExists();

        spaces[spaceId] = Space({
            spaceId: spaceId,
            ensName: ensName,
            displayName: displayName,
            owner: msg.sender,
            createdAt: block.timestamp,
            active: true,
            membershipType: membershipType,
            criteriaContract: criteriaContract,
            criteriaAmount: criteriaAmount,
            members: new address[](0)
        });

        spaceExists[spaceId] = true;
        ownerSpaces[msg.sender].push(spaceId);

        // Owner automatically becomes a member
        spaceMembers[spaceId][msg.sender] = true;
        spaces[spaceId].members.push(msg.sender);

        emit SpaceCreated(spaceId, ensName, displayName, msg.sender);
    }

    /**
     * @notice Transfer space ownership
     * @param spaceId The space to transfer
     * @param newOwner The new owner address
     */
    function transferSpaceOwnership(bytes32 spaceId, address newOwner) external {
        if (!spaceExists[spaceId]) revert SpaceDoesNotExist();
        if (spaces[spaceId].owner != msg.sender) revert NotSpaceOwner();
        if (newOwner == address(0)) revert ZeroAddress();

        address previousOwner = spaces[spaceId].owner;
        spaces[spaceId].owner = newOwner;

        // Update ownerSpaces mappings
        _removeFromOwnerSpaces(previousOwner, spaceId);
        ownerSpaces[newOwner].push(spaceId);

        emit SpaceTransferred(spaceId, previousOwner, newOwner);
    }

    /**
     * @notice Deactivate a space (only owner)
     * @param spaceId The space to deactivate
     */
    function deactivateSpace(bytes32 spaceId) external {
        if (!spaceExists[spaceId]) revert SpaceDoesNotExist();
        if (spaces[spaceId].owner != msg.sender) revert NotSpaceOwner();

        spaces[spaceId].active = false;
        emit SpaceDeactivated(spaceId);
    }

    /**
     * @notice Update space display name
     * @param spaceId The space to update
     * @param newDisplayName New display name (max 30 characters)
     */
    function updateSpaceDisplayName(bytes32 spaceId, string calldata newDisplayName) external {
        if (!spaceExists[spaceId]) revert SpaceDoesNotExist();
        if (spaces[spaceId].owner != msg.sender) revert NotSpaceOwner();
        if (bytes(newDisplayName).length > 30) revert InvalidDisplayName();

        spaces[spaceId].displayName = newDisplayName;
        
        emit SpaceDisplayNameUpdated(spaceId, newDisplayName, msg.sender);
    }

    /**
     * @notice Join a space (if criteria are met)
     * @param spaceId The space to join
     */
    function joinSpace(bytes32 spaceId) external {
        if (!spaceExists[spaceId]) revert SpaceDoesNotExist();
        if (!spaces[spaceId].active) revert SpaceDoesNotExist();
        if (spaceMembers[spaceId][msg.sender]) revert AlreadyMember();

        if (!_canJoin(spaceId, msg.sender)) revert CannotJoin();

        spaceMembers[spaceId][msg.sender] = true;
        spaces[spaceId].members.push(msg.sender);
        emit MemberJoined(spaceId, msg.sender);
    }

    /**
     * @notice Leave a space
     * @param spaceId The space to leave
     */
    function leaveSpace(bytes32 spaceId) external {
        if (!spaceExists[spaceId]) revert SpaceDoesNotExist();
        if (!spaceMembers[spaceId][msg.sender]) revert NotMember();
        spaceMembers[spaceId][msg.sender] = false;
        _removeFromSpaceMembers(spaceId, msg.sender);
        emit MemberLeft(spaceId, msg.sender);
    }

    /**
     * @notice Add address to whitelist (only owner)
     * @param spaceId The space
     * @param user The user to add
     */
    function addToWhitelist(bytes32 spaceId, address user) external {
        if (!spaceExists[spaceId]) revert SpaceDoesNotExist();
        if (spaces[spaceId].owner != msg.sender) revert NotSpaceOwner();
        spaceWhitelist[spaceId][user] = true;
        emit WhitelistUpdated(spaceId, user, true);
    }

    /**
     * @notice Remove address from whitelist (only owner)
     * @param spaceId The space
     * @param user The user to remove
     */
    function removeFromWhitelist(bytes32 spaceId, address user) external {
        if (!spaceExists[spaceId]) revert SpaceDoesNotExist();
        if (spaces[spaceId].owner != msg.sender) revert NotSpaceOwner();
        spaceWhitelist[spaceId][user] = false;
        emit WhitelistUpdated(spaceId, user, false);
    }

    /**
     * @notice Add an admin to a space (only owner)
     * @param spaceId The space
     * @param admin The admin address to add
     */
    function addSpaceAdmin(bytes32 spaceId, address admin) external {
        if (!spaceExists[spaceId]) revert SpaceDoesNotExist();
        if (spaces[spaceId].owner != msg.sender) revert NotSpaceOwner();
        if (admin == address(0)) revert ZeroAddress();
        
        spaceAdmins[spaceId][admin] = true;
        emit AdminAdded(spaceId, admin);
    }

    /**
     * @notice Remove an admin from a space (only owner)
     * @param spaceId The space
     * @param admin The admin address to remove
     */
    function removeSpaceAdmin(bytes32 spaceId, address admin) external {
        if (!spaceExists[spaceId]) revert SpaceDoesNotExist();
        if (spaces[spaceId].owner != msg.sender) revert NotSpaceOwner();
        
        spaceAdmins[spaceId][admin] = false;
        emit AdminRemoved(spaceId, admin);
    }

    /**
     * @notice Check if address is an admin of a space
     * @param spaceId The space
     * @param account The address to check
     * @return True if admin and space is active
     */
    function isSpaceAdmin(bytes32 spaceId, address account) external view returns (bool) {
        return spaceExists[spaceId] && spaces[spaceId].active && spaceAdmins[spaceId][account];
    }

    /**
     * @notice Check if address is the owner of a space
     * @param spaceId The space
     * @param account The address to check
     * @return True if owner and space is active
     */
    function isSpaceOwner(bytes32 spaceId, address account) external view returns (bool) {
        return spaceExists[spaceId] && spaces[spaceId].active && spaces[spaceId].owner == account;
    }

    /**
     * @notice Check if a space exists and is active
     * @param spaceId The space to check
     * @return True if the space exists and is active
     */
    function spaceIsActive(bytes32 spaceId) external view returns (bool) {
        return spaceExists[spaceId] && spaces[spaceId].active;
    }

    /**
     * @notice Get spaces owned by an address
     * @param owner The owner address
     * @return Array of space IDs owned by the address
     */
    function getOwnerSpaces(address owner) external view returns (bytes32[] memory) {
        return ownerSpaces[owner];
    }

    /**
     * @notice Get space information
     * @param spaceId The space ID
     * @return ensName The ENS name
     * @return displayName The display name
     * @return owner Owner address
     * @return createdAt Creation timestamp
     * @return active Whether the space is active
     * @return membershipType Type of membership
     * @return criteriaContract Criteria contract address
     * @return criteriaAmount Criteria amount
     */
    function getSpace(bytes32 spaceId) external view returns (
        string memory ensName,
        string memory displayName,
        address owner,
        uint256 createdAt,
        bool active,
        MembershipType membershipType,
        address criteriaContract,
        uint256 criteriaAmount
    ) {
        Space storage space = spaces[spaceId];
        return (
            space.ensName,
            space.displayName,
            space.owner,
            space.createdAt,
            space.active,
            space.membershipType,
            space.criteriaContract,
            space.criteriaAmount
        );
    }

    /**
     * @notice Get space members
     * @param spaceId The space ID
     * @return Array of member addresses
     */
    function getSpaceMembers(bytes32 spaceId) external view returns (address[] memory) {
        if (!spaceExists[spaceId]) revert SpaceDoesNotExist();
        return spaces[spaceId].members;
    }

    /**
     * @notice Internal function to remove space from owner's list
     * @param owner The owner address
     * @param spaceId The space to remove
     */
    function _removeFromOwnerSpaces(address owner, bytes32 spaceId) internal {
        bytes32[] storage ownerSpacesList = ownerSpaces[owner];
        for (uint256 i = 0; i < ownerSpacesList.length; ++i) {
            if (ownerSpacesList[i] == spaceId) {
                ownerSpacesList[i] = ownerSpacesList[ownerSpacesList.length - 1];
                ownerSpacesList.pop();
                break;
            }
        }
    }

    /**
     * @notice Internal function to remove member from space's member list
     * @param spaceId The space
     * @param member The member address to remove
     */
    function _removeFromSpaceMembers(bytes32 spaceId, address member) internal {
        address[] storage membersList = spaces[spaceId].members;
        for (uint256 i = 0; i < membersList.length; ++i) {
            if (membersList[i] == member) {
                membersList[i] = membersList[membersList.length - 1];
                membersList.pop();
                break;
            }
        }
    }

    /**
     * @notice Check if a user can join a space based on membership criteria
     * @param spaceId The space ID
     * @param user The user address
     * @return True if the user can join
     */
    function _canJoin(bytes32 spaceId, address user) internal view returns (bool) {
        MembershipType mType = spaces[spaceId].membershipType;
        if (mType == MembershipType.Public) return true;
        if (mType == MembershipType.Whitelist) return spaceWhitelist[spaceId][user];
        if (mType == MembershipType.TokenHolder) {
            return IERC20(spaces[spaceId].criteriaContract).balanceOf(user) >= spaces[spaceId].criteriaAmount;
        }
        if (mType == MembershipType.NFTHolder) {
            return IERC721(spaces[spaceId].criteriaContract).balanceOf(user) >= spaces[spaceId].criteriaAmount;
        }
        return false;
    }

    /**
     * @notice Check if a string is a valid ENS name (ends with .agora)
     * @param name The name to validate
     * @return True if valid ENS name
     */
    function isValidENSName(string memory name) internal pure returns (bool) {
        bytes memory nameBytes = bytes(name);
        uint256 length = nameBytes.length;
        
         // Must be at least ".agora" length and end with ".agora"
        if (length < 6) return false;
        
        // Check last 6 characters are ".agora"
        return nameBytes[length - 6] == 0x2e &&
               nameBytes[length - 5] == 0x61 &&
               nameBytes[length - 4] == 0x67 &&
               nameBytes[length - 3] == 0x6f &&
               nameBytes[length - 2] == 0x72 &&
               nameBytes[length - 1] == 0x61;
    }

    /**
     * @notice Calculate the namehash of a given ENS name
     * @param name The ENS name to hash
     * @return The computed namehash
     */
    function namehash(string memory name) public pure returns (bytes32) {
        bytes memory nameBytes = bytes(name);
        bytes32 hash = 0x0000000000000000000000000000000000000000000000000000000000000000;
        
        // Split by '.' and process from right to left (TLD first)
        uint256[] memory labelStarts = new uint256[](10); // Max 10 labels
        uint256 labelCount = 0;
        uint256 start = 0;
        
        for (uint256 i = 0; i < nameBytes.length + 1; ++i) {
            if (i == nameBytes.length || nameBytes[i] == 0x2e) {
                labelStarts[labelCount] = start;
                ++labelCount;
                start = i + 1;
            }
        }
        
        // Process labels from right to left
        for (uint256 i = labelCount; i > 0; --i) {
            uint256 labelStart = labelStarts[i - 1];
            uint256 labelEnd = (i == labelCount) ? nameBytes.length : labelStarts[i] - 1;
            uint256 labelLength = labelEnd - labelStart;
            
            bytes memory label = new bytes(labelLength);
            for (uint256 j = 0; j < labelLength; ++j) {
                label[j] = nameBytes[labelStart + j];
            }
            
            hash = keccak256(abi.encodePacked(hash, keccak256(label)));
        }
        
        return hash;
    }
}