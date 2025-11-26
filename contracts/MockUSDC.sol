// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Mock USDC Contract
/// @author Elio Margiotta
/// @notice Mock implementation of ERC20 USDC for testing purposes
contract MockUSDC is ERC20 {
    /// @notice Initializes the contract with name and symbol
    constructor() ERC20("Mock USDC", "mUSDC") {}

    /// @notice Mints tokens to an address (for testing only)
    /// @param to The address to mint tokens to
    /// @param amount The amount of tokens to mint
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}