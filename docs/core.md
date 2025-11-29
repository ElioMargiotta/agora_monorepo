# Core

The core component of Agora is the smart contract infrastructure, built using Hardhat and TypeScript. It provides the decentralized backend for private proposals and secure voting.

## Overview

AGORA enables secure, private voting on proposals within decentralized spaces. Votes are encrypted on the client-side and remain private on-chain until the proposal ends, at which point they are decrypted and tallied. The system supports multiple voting types (non-weighted, weighted single-choice, weighted fractional) and integrates with Agora Names Services (MockENS) for space management.

## Features

- **Privacy-First Voting**: FHE ensures votes are encrypted and computed without revealing individual choices.
- **Flexible Voting Types**: Support for equal-weight, weighted single-choice, and weighted fractional voting.
- **Decentralized Spaces**: Create and manage proposal spaces with various membership types (Public, Whitelist, TokenHolder, NFTHolder).
- **Automated Resolution**: Chainlink Automation handles timely proposal resolution and decryption.
- **ENS Integration**: Spaces are tied to ENS names for decentralized naming.
- **Threshold and Abstain Support**: Configurable passing thresholds and abstain options.

## Architecture

### Core Components
- **SpaceRegistry**: Manages decentralized spaces and membership.
- **PrivateProposal**: Handles encrypted voting and proposal logic.
- **PrivateProposalFactory**: Deploys proposals and integrates with Chainlink Automation.

For detailed contract architecture, FHE usage, and resolution process, see [Contract Architecture](contract.md).

## Quick Start

### Prerequisites
- **Node.js**: Version 20 or higher
- **npm or yarn/pnpm**: Package manager

### Installation
1. **Clone the repository**
   ```bash
   git clone https://github.com/ElioMargiotta/agora_monorepo.git
   cd agora_monorepo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   npx hardhat vars set MNEMONIC
   npx hardhat vars set INFURA_API_KEY
   npx hardhat vars set ETHERSCAN_API_KEY  # Optional for verification
   ```

4. **Compile contracts**
   ```bash
   npm run compile
   ```

5. **Run tests**
   ```bash
   npm run test
   ```

### Deployment
- **Local Network**:
  ```bash
  npx hardhat node
  npx hardhat deploy --network localhost
  ```

- **Sepolia Testnet**:
  ```bash
  npx hardhat deploy --network sepolia ##verify automatically
  npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
  npx hardhat proposal --network sepolia ## Create .agora ENS name, Space ID with this name and proposal in the space
  ```

  #### Deployed Contracts on Sepolia
  These are the addresses of the contracts deployed on the Sepolia testnet using the `deploy/deploy.ts` script. The script deploys and verifies each contract on Etherscan.

  - **MockENS**: 0xB94ccA29A9eCCb65AC9548DAb2d1ab768F3b494D
  - **SpaceRegistry**: 0xB1480EF7694d9e57b871fdD1a779eb5f278C8308
  - **ProposalAutomation**: 0xA3ea6b9255b606Eda856eb699DD62efc72D39167
  - **PrivateProposalFactory**: 0x6f27646A29501Ee4aF0e4b6ABC2B28c71F723A1A
  - **MockGovernanceToken**: 0x24b8aE269ad0284762AfcAC32b5c1EF42875fa7D

## Available Scripts

| Script                 | Description              |
| ---------------------- | ------------------------ |
| `npx hardhat compile`  | Compile all contracts    |
| `npx hardhat test`     | Run all tests            |
| `npx hardhat lint`     | Run linting checks       |
| `npx hardhat clean`    | Clean build artifacts    |

## Testing

The core contracts include a comprehensive test suite with 85 passing tests covering all major functionality. Tests are written using Hardhat and include:

- **ENS Management**: MockENS subdomain creation and ownership
- **Space Management**: Space creation, membership, and administration
- **Proposal Factory**: Proposal creation, validation, and Chainlink Automation
- **Voting & Resolution**: All voting types (non-weighted, weighted single-choice, weighted fractional) with FHE encryption

For detailed test results and coverage, see [Test Summary](test-summary.md).

## Tasks

The project includes custom Hardhat tasks for streamlined deployment and interaction:

- **Proposal Deployment**: Automated task to create ENS domains, spaces, and proposals on testnet
- **Contract Verification**: Automatic Etherscan verification for deployed contracts

For detailed information about deployment tasks, see [Proposal Deployment Task](task_deploy_proposal.md).

## Documentation

- [Chainlink Documentation](https://docs.chain.link/) - Smart contract automation and oracles
- [Zama FHE Documentation](https://docs.zama.ai/) - Fully Homomorphic Encryption for blockchain
- [OpenZeppelin Documentation](https://docs.openzeppelin.com/) - Secure smart contract development