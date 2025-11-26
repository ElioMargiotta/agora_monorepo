// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

enum MembershipType { Public, Whitelist, TokenHolder, NFTHolder }

/// @title Space Registry Interface
/// @author Elio Margiotta
/// @notice Interface for managing decentralized spaces for proposals
interface ISpaceRegistry {
    // Events
    /// @notice Emitted when a new space is created
    /// @param spaceId The unique ID of the space
    /// @param ensName The ENS name of the space
    /// @param displayName The display name of the space
    /// @param owner The owner of the space
    event SpaceCreated(bytes32 indexed spaceId, string ensName, string displayName, address indexed owner);
    /// @notice Emitted when space ownership is transferred
    /// @param spaceId The space ID
    /// @param previousOwner The previous owner
    /// @param newOwner The new owner
    event SpaceTransferred(bytes32 indexed spaceId, address indexed previousOwner, address indexed newOwner);
    /// @notice Emitted when a space is deactivated
    /// @param spaceId The space ID
    event SpaceDeactivated(bytes32 indexed spaceId);
    /// @notice Emitted when space display name is updated
    /// @param spaceId The space ID
    /// @param newDisplayName The new display name
    /// @param updatedBy The address that updated it
    event SpaceDisplayNameUpdated(bytes32 indexed spaceId, string newDisplayName, address indexed updatedBy);
    /// @notice Emitted when a member joins a space
    /// @param spaceId The space ID
    /// @param member The member address
    event MemberJoined(bytes32 indexed spaceId, address indexed member);
    /// @notice Emitted when a member leaves a space
    /// @param spaceId The space ID
    /// @param member The member address
    event MemberLeft(bytes32 indexed spaceId, address indexed member);
    /// @notice Emitted when whitelist status is updated
    /// @param spaceId The space ID
    /// @param user The user address
    /// @param status The new status (true for added, false for removed)
    event WhitelistUpdated(bytes32 indexed spaceId, address indexed user, bool indexed status);
    /// @notice Emitted when an admin is added to a space
    /// @param spaceId The space ID
    /// @param admin The admin address
    event AdminAdded(bytes32 indexed spaceId, address indexed admin);
    /// @notice Emitted when an admin is removed from a space
    /// @param spaceId The space ID
    /// @param admin The admin address
    event AdminRemoved(bytes32 indexed spaceId, address indexed admin);

    // Space creation and management
    /// @notice Create a new space with an ENS name that you own
    /// @param ensName The ENS name for the space
    /// @param displayName Display name for the space
    /// @param membershipType Type of membership
    /// @param criteriaContract Contract address for token/NFT
    /// @param criteriaAmount Minimum amount for token holders
    function createSpace(
        string calldata ensName,
        string calldata displayName,
        MembershipType membershipType,
        address criteriaContract,
        uint256 criteriaAmount
    ) external;

    /// @notice Transfer space ownership
    /// @param spaceId The space to transfer
    /// @param newOwner The new owner address
    function transferSpaceOwnership(bytes32 spaceId, address newOwner) external;
    /// @notice Deactivate a space (only owner)
    /// @param spaceId The space to deactivate
    function deactivateSpace(bytes32 spaceId) external;
    /// @notice Update space display name
    /// @param spaceId The space to update
    /// @param newDisplayName New display name
    function updateSpaceDisplayName(bytes32 spaceId, string calldata newDisplayName) external;

    // Membership management
    /// @notice Join a space (if criteria are met)
    /// @param spaceId The space to join
    function joinSpace(bytes32 spaceId) external;
    /// @notice Leave a space
    /// @param spaceId The space to leave
    function leaveSpace(bytes32 spaceId) external;
    /// @notice Add address to whitelist (only owner)
    /// @param spaceId The space
    /// @param user The user to add
    function addToWhitelist(bytes32 spaceId, address user) external;
    /// @notice Remove address from whitelist (only owner)
    /// @param spaceId The space
    /// @param user The user to remove
    function removeFromWhitelist(bytes32 spaceId, address user) external;
    /// @notice Add an admin to a space (only owner)
    /// @param spaceId The space ID
    /// @param admin The admin address to add
    function addSpaceAdmin(bytes32 spaceId, address admin) external;
    /// @notice Remove an admin from a space (only owner)
    /// @param spaceId The space ID
    /// @param admin The admin address to remove
    function removeSpaceAdmin(bytes32 spaceId, address admin) external;

    // View functions
    /// @notice Get space information
    /// @param spaceId The space ID
    /// @return ensName The ENS name
    /// @return displayName The display name
    /// @return owner Owner address
    /// @return createdAt Creation timestamp
    /// @return active Whether the space is active
    /// @return membershipType Type of membership
    /// @return criteriaContract Criteria contract address
    /// @return criteriaAmount Criteria amount
    function getSpace(bytes32 spaceId) external view returns (
        string memory ensName,
        string memory displayName,
        address owner,
        uint256 createdAt,
        bool active,
        MembershipType membershipType,
        address criteriaContract,
        uint256 criteriaAmount
    );

    /// @notice Get space members
    /// @param spaceId The space ID
    /// @return Array of member addresses
    function getSpaceMembers(bytes32 spaceId) external view returns (address[] memory);
    /// @notice Get spaces owned by an address
    /// @param owner The owner address
    /// @return Array of space IDs owned by the address
    function getOwnerSpaces(address owner) external view returns (bytes32[] memory);

    // Permission checks
    /// @notice Check if address is the owner of a space
    /// @param spaceId The space
    /// @param account The address to check
    /// @return True if owner and space is active
    function isSpaceOwner(bytes32 spaceId, address account) external view returns (bool);
    /// @notice Check if address is an admin of a space
    /// @param spaceId The space
    /// @param account The address to check
    /// @return True if admin and space is active
    function isSpaceAdmin(bytes32 spaceId, address account) external view returns (bool);
    /// @notice Check if a space exists and is active
    /// @param spaceId The space to check
    /// @return True if the space exists and is active
    function spaceIsActive(bytes32 spaceId) external view returns (bool);

    // State mappings (automatically generated getters)
    /// @notice Get space details by ID
    /// @param spaceId The space ID
    /// @return spaceId_ The space ID
    /// @return owner Owner address
    /// @return createdAt Creation timestamp
    /// @return criteriaAmount Criteria amount
    /// @return criteriaContract Criteria contract address
    /// @return membershipType Type of membership
    /// @return active Whether the space is active
    /// @return ensName The ENS name
    /// @return displayName The display name
    function spaces(bytes32 spaceId) external view returns (
        bytes32 spaceId_,
        address owner,
        uint256 createdAt,
        uint256 criteriaAmount,
        address criteriaContract,
        MembershipType membershipType,
        bool active,
        string memory ensName,
        string memory displayName
    );

    /// @notice Check if a space exists
    /// @param spaceId The space ID
    /// @return True if the space exists
    function spaceExists(bytes32 spaceId) external view returns (bool);
    /// @notice Check if an address is a member of a space
    /// @param spaceId The space ID
    /// @param member The member address
    /// @return True if the address is a member
    function spaceMembers(bytes32 spaceId, address member) external view returns (bool);
    /// @notice Check if an address is whitelisted for a space
    /// @param spaceId The space ID
    /// @param user The user address
    /// @return True if the address is whitelisted
    function spaceWhitelist(bytes32 spaceId, address user) external view returns (bool);
    /// @notice Check if an address is an admin of a space
    /// @param spaceId The space ID
    /// @param admin The admin address
    /// @return True if the address is an admin
    function spaceAdmins(bytes32 spaceId, address admin) external view returns (bool);
    /// @notice Get a space ID owned by an address at a specific index
    /// @param owner The owner address
    /// @param index The index in the owner's spaces array
    /// @return The space ID at the given index
    function ownerSpaces(address owner, uint256 index) external view returns (bytes32);
}