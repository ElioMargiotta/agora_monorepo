# AGORA Proposal Deployment on Sepolia Testnet

## Overview

This document demonstrates a successful deployment of a private proposal on the Sepolia testnet using the AGORA system. It showcases the end-to-end process of creating an ENS domain, setting up a decentralized space, deploying a proposal contract, and verifying it on Etherscan.

The deployment uses the Hardhat task `proposal` which automates the entire workflow, making it easy for users to launch encrypted voting proposals without manual contract interactions.

## Deployment Summary

**Command Executed**: `npx hardhat proposal --network sepolia`

**Deployer Account**: `0xF92c6d8F1cba15eE6c737a7E5c121ad5b6b78982`

## Deployment Steps

### 1. ENS Registration
- **Domain**: `test4.agora`
- **Status**: ✅ Successfully registered

### 2. Space Creation
- **ENS Domain**: `test4.agora`
- **Status**: ✅ Space created successfully
- **Space ID**: `0x6eb01d03c46903ea10d90476ad8a23e7ef28c4e7ed8e20e08bafa0cc1db4c7a7`

### 3. Proposal Creation
- **Space**: `test4.agora` (ID: `0x6eb01d03c46903ea10d90476ad8a23e7ef28c4e7ed8e20e08bafa0cc1db4c7a7`)
- **Voting Type**: Non-weighted single choice (Public)
- **Prediction Market**: Disabled (can be enabled by setting `predictionMarketEnabled: true` and `predictionToken` to MockUSDC address)
- **Status**: ✅ Proposal created successfully
- **Proposal Address**: `0x701F379AC18E5c10487A832dF5E00E4DA4e84506`
- **Proposal ID**: `0x186207e53411b6a185b8d9fe795ab17e91e40a42ea658faeaa95a9711016d140`

### 4. Contract Verification
- **Contract**: `contracts/PrivateProposal.sol:PrivateProposal`
- **Address**: `0x701F379AC18E5c10487A832dF5E00E4DA4e84506`
- **Status**: ✅ Successfully verified on Etherscan (already verified)
- **Etherscan Link**: [View Contract](https://sepolia.etherscan.io/address/0x701F379AC18E5c10487A832dF5E00E4DA4e84506#code)
- **Wait Time**: 30 seconds for bytecode propagation

## Final Results

**Deployment Complete!**

- **ENS Domain**: `test4.agora`
- **Space ID**: `0x6eb01d03c46903ea10d90476ad8a23e7ef28c4e7ed8e20e08bafa0cc1db4c7a7`
- **Proposal Address**: `0x701F379AC18E5c10487A832dF5E00E4DA4e84506`
- **Proposal ID**: `0x186207e53411b6a185b8d9fe795ab17e91e40a42ea658faeaa95a9711016d140`

## Prediction Market Feature

The task supports optional prediction market functionality. To enable:

1. Set `predictionMarketEnabled: true` in proposal parameters
2. Set `predictionToken` to the MockUSDC address: `0xb2A0eeC6637326E2195096c9F8D03F8fA133c740`
3. Users can then stake USDC tokens on encrypted predictions of the voting outcome

See the [Contract Architecture](contract.md#prediction-market) documentation for detailed prediction market mechanics.
