// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

/// @title Mock Governance Token for Testing
/// @author Elio Margiotta
/// @notice ERC20Votes token for testing governance functionality
contract MockGovernanceToken is ERC20, ERC20Permit, ERC20Votes {
    /// @notice Initializes the contract with name and symbol
    constructor() ERC20("Mock Governance Token", "MGT") ERC20Permit("Mock Governance Token") {}

    /// @notice Mint tokens to an address (for testing only)
    /// @param to The address to mint tokens to
    /// @param amount The amount of tokens to mint
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /// @notice Burn tokens from an address (for testing only)
    /// @param from The address to burn tokens from
    /// @param amount The amount of tokens to burn
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }

    // The following functions are overrides required by Solidity.

    /// @notice Updates token balances and voting power
    /// @param from The address sending tokens
    /// @param to The address receiving tokens
    /// @param value The amount of tokens being transferred
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    /// @notice Returns the current nonce for the owner
    /// @param owner The address to query
    /// @return The current nonce
    function nonces(address owner)
        public
        view
        virtual
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}