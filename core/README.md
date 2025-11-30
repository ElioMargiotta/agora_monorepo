# A G O R A: Private Proposal System with FHE

A decentralized proposal infrastructure that leverages **Fully Homomorphic Encryption (FHE)** to ensure complete privacy of votes until proposal resolution. Built on the FHEVM protocol by Zama, using a factory pattern with Chainlink automation for resolution.

## 📋 Overview

AGORA enables secure, private voting on proposals within decentralized spaces. Votes are encrypted on the client-side and remain private on-chain until the proposal ends, at which point they are decrypted and tallied. The system supports multiple voting types (non-weighted, weighted single-choice, weighted fractional) and integrates with ENS for space management.

## ✨ Features

- **Privacy-First Voting**: FHE ensures votes are encrypted and computed without revealing individual choices.
- **Flexible Voting Types**: Support for equal-weight, weighted single-choice, and weighted fractional voting.
- **Decentralized Spaces**: Create and manage proposal spaces with various membership types (Public, Whitelist, TokenHolder, NFTHolder).
- **Automated Resolution**: Chainlink Automation handles timely proposal resolution and decryption.
- **ENS Integration**: Spaces are tied to ENS names for decentralized naming.
- **Threshold and Abstain Support**: Configurable passing thresholds and abstain options.

## 🏗️ Architecture

### Core Components
- **SpaceRegistry**: Manages decentralized spaces and membership.
- **PrivateProposal**: Handles encrypted voting and proposal logic.
- **PrivateProposalFactory**: Deploys proposals and integrates with Chainlink Automation.

For detailed architecture, FHE usage, and resolution process, see [Contract Architecture](../docs/contract.md).

## 🚀 Quick Start

### Prerequisites
- **Node.js**: Version 20 or higher
- **npm or yarn/pnpm**: Package manager

### Installation
1. **Clone the repository**
   ```bash
   git clone https://github.com/ElioMargiotta/agora_monorepo.git
   cd agora_monorepo/core
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

  - **MockENS**: 0x4a8BbdC602E18759E1961a886F6e3D7aA2a75Bb4
  - **SpaceRegistry**: 0x96eEFbc1452F9324a7422399c5149b8a7f011fb1
  - **ProposalAutomation**: 0xb452ec65f678139922F537Ff01Fd6036dEF7Be70
  - **PrivateProposalFactory**: 0x2E04e1BaC41D3c56b7174aC83f17753d3cEB56F4
  - **MockGovernanceToken**: 0xd989E1C299835a01C8687d64ec8A5cc6aD69bde7

## 📜 Available Scripts

| Script                 | Description              |
| ---------------------- | ------------------------ |
| `npx hardhat compile`  | Compile all contracts    |
| `npx hardhat test`     | Run all tests            |
| `npx hardhat lint`     | Run linting checks       |
| `npx hardhat clean`    | Clean build artifacts    |

## 📚 Documentation

- [AGORA System Documentation](./documentation.md) - Detailed technical docs
- [Test Summary](./test-summary.md) - Summary of tests performed
- [Deployment Details](./deploy.md) - Deployed contracts and deployment process
- [Proposal Deployment Task](./task_deploy_proposal.md) - Details on deploying proposals
- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Setup](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/ElioMargiotta/agora_monorepo/issues)
- **Zama Documentation**: [FHEVM Docs](https://docs.zama.ai)
- **Community**: [Zama Discord](https://discord.gg/zama)

---

**Built with ❤️ using FHEVM by Zama**
