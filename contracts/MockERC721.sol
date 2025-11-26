// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title Mock ERC721 Contract
/// @author Elio Margiotta
/// @notice Mock implementation of ERC721 for testing purposes
contract MockERC721 is ERC721 {
    /// @notice Initializes the contract with name and symbol
    constructor() ERC721("Mock NFT", "mNFT") {}

    /// @notice Mints a new token to the specified address
    /// @param to The address to mint the token to
    /// @param tokenId The ID of the token to mint
    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}