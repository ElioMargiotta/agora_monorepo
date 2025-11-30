// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Standard ENS interface (from ens-contracts/registry/ENS.sol)
/// @title ENS Interface
/// @author ENS Team (Nick Johnson et al.)
/// @notice Standard interface for the Ethereum Name Service registry
interface IENS {
    /// @notice Emitted when a new owner is set for a subnode
    /// @param node The parent node
    /// @param label The label
    /// @param owner The new owner
    event NewOwner(bytes32 indexed node, bytes32 indexed label, address indexed owner);
    /// @notice Emitted when ownership of a node is transferred
    /// @param node The node
    /// @param owner The new owner
    event Transfer(bytes32 indexed node, address indexed owner);
    /// @notice Emitted when a new resolver is set for a node
    /// @param node The node
    /// @param resolver The new resolver
    event NewResolver(bytes32 indexed node, address indexed resolver);
    /// @notice Emitted when a new TTL is set for a node
    /// @param node The node
    /// @param ttl The new TTL
    event NewTTL(bytes32 indexed node, uint64 indexed ttl);

    /// @notice Get the owner of a node
    /// @param node The node
    /// @return The owner address
    function owner(bytes32 node) external view returns (address);
    /// @notice Get the resolver of a node
    /// @param node The node
    /// @return The resolver address
    function resolver(bytes32 node) external view returns (address);
    /// @notice Get the TTL of a node
    /// @param node The node
    /// @return The TTL value
    function ttl(bytes32 node) external view returns (uint64);
    /// @notice Set the owner of a node
    /// @param node The node
    /// @param owner The new owner
    function setOwner(bytes32 node, address owner) external;
    /// @notice Set the owner of a subnode
    /// @param node The parent node
    /// @param label The label
    /// @param owner The new owner
    function setSubnodeOwner(bytes32 node, bytes32 label, address owner) external;
    /// @notice Set the resolver of a node
    /// @param node The node
    /// @param resolver The new resolver
    function setResolver(bytes32 node, address resolver) external;
    /// @notice Set the TTL of a node
    /// @param node The node
    /// @param ttl The new TTL
    function setTTL(bytes32 node, uint64 ttl) external;
}

/// @title Mock ENS Contract
/// @author Elio Margiotta
/// @notice Mock implementation of ENS for testing purposes
contract MockENS is IENS {
    /// @notice Mapping of node to owner
    mapping(bytes32 node => address owner) public owners;
    /// @notice Mapping of node to resolver
    mapping(bytes32 node => address resolver) public resolvers;
    /// @notice Mapping of node to TTL
    mapping(bytes32 node => uint64 ttl) public ttls;

    error NotAuthorized();
    error NotOwner();

    /// @notice Set the owner of a node (mock function)
    /// @param node The node
    /// @param newOwner The new owner
    function setNodeOwner(bytes32 node, address newOwner) external {
        if (owners[node] != address(0)) revert NotAuthorized();
        owners[node] = newOwner;
    }

    // Implement standard ENS functions
    /// @notice Get the owner of a node
    /// @param node The node
    /// @return The owner address
    function owner(bytes32 node) external view override returns (address) {
        return owners[node];
    }

    /// @notice Get the resolver of a node
    /// @param node The node
    /// @return The resolver address
    function resolver(bytes32 node) external view override returns (address) {
        return resolvers[node];
    }

    /// @notice Get the TTL of a node
    /// @param node The node
    /// @return The TTL value
    function ttl(bytes32 node) external view override returns (uint64) {
        return ttls[node];
    }

    /// @notice Set the owner of a node
    /// @param node The node
    /// @param newOwner The new owner
    function setOwner(bytes32 node, address newOwner) external override {
        if (msg.sender != owners[node] && owners[node] != address(0)) revert NotAuthorized();
        owners[node] = newOwner;
        emit Transfer(node, newOwner);
    }

    /// @notice Set the owner of a subnode
    /// @param node The parent node
    /// @param label The label
    /// @param newOwner The new owner
    function setSubnodeOwner(bytes32 node, bytes32 label, address newOwner) external override {
        if (msg.sender != owners[node]) revert NotOwner();
        bytes32 subnode = keccak256(abi.encodePacked(node, label));
        owners[subnode] = newOwner;
        emit NewOwner(node, label, newOwner);
    }

    /// @notice Set the resolver of a node
    /// @param node The node
    /// @param newResolver The new resolver
    function setResolver(bytes32 node, address newResolver) external override {
        if (msg.sender != owners[node]) revert NotOwner();
        resolvers[node] = newResolver;
        emit NewResolver(node, newResolver);
    }

    /// @notice Set the TTL of a node
    /// @param node The node
    /// @param newTTL The new TTL
    function setTTL(bytes32 node, uint64 newTTL) external override {
        if (msg.sender != owners[node]) revert NotOwner();
        ttls[node] = newTTL;
        emit NewTTL(node, newTTL);
    }
}