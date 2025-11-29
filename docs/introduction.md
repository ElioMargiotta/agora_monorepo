# Agora Documentation

## Overview

Agora is a revolutionary privacy-preserving governance platform that leverages Zama's Fully Homomorphic Encryption (FHE) technology to enable truly anonymous and secure decentralized governance. Built on Ethereum-compatible blockchains, Agora allows communities to create private DAO spaces where members can submit proposals and vote anonymously while maintaining full verifiability of outcomes.

## Purpose

The core purpose of Agora is to democratize governance by solving the fundamental privacy paradox in decentralized systems: how to maintain transparency in decision-making while protecting individual voter privacy. Traditional DAOs often require sacrificing anonymity for accountability, but Agora uses cutting-edge cryptography to provide both.

### Key Problems Solved
- **Privacy vs. Transparency Trade-off**: FHE enables computation on encrypted data, allowing vote tallying without ever decrypting individual ballots
- **Voter Intimidation**: Anonymous voting prevents coercion and ensures free expression
- **Sybil Attacks**: Token-based eligibility systems prevent manipulation while maintaining privacy
- **Scalability**: Efficient encrypted computation enables large-scale governance without performance degradation

## What You Can Do

### For Community Leaders
- **Create Governance Spaces**: Set up custom DAO environments with configurable rules and member roles
- **Define Voting Models**: Choose between weighted/unweighted voting, set quorum requirements, and eligibility criteria
- **Manage Membership**: Invite members, assign permissions, and control access to your governance space

### For Community Members
- **Submit Proposals**: Create and submit governance proposals with rich text descriptions and attachments
- **Vote Anonymously**: Cast encrypted votes that remain private throughout the process
- **Track Outcomes**: View verifiable results and proposal statuses in real-time
- **Participate Securely**: Engage in governance without revealing your identity or voting preferences

### For Developers
- **Build on FHE**: Use Agora's infrastructure to create privacy-preserving dApps
- **Integrate Governance**: Add anonymous voting capabilities to existing platforms
- **Customize Workflows**: Extend the platform with custom proposal types and voting mechanisms

## How It Works

### 1. Visit the Agora Website
Start by visiting [https://agora-staged.vercel.app/](https://agora-staged.vercel.app/) and connect your Web3 wallet.

### 2. Create an Agora Name Service
Register a unique `.agora` domain name that will serve as your governance space identifier. This creates a decentralized naming system for your community.

### 3. Create Your Governance Space
Use your registered `.agora` name to establish a new governance space with custom parameters:
- Set membership rules (public, token holders, NFT owners, or whitelist)
- Configure voting models and eligibility criteria
- Define space roles and permissions

### 4. Invite Your Community
Share access with community members and assign appropriate roles:
- Owner: Full control over space settings
- Admin: Can create new proposals
- Member: Can participate in voting
- Observer: Read-only access to proposals and results

### 5. Create Private Proposals
Submit governance proposals with complete privacy guarantees:
- Rich text descriptions and multimedia attachments
- Configurable voting periods and parameters
- Automated workflow management via Chainlink

### 6. Vote Anonymously, Reveal Verifiable Results
Participate in governance with full privacy:
- Cast encrypted votes using FHE technology
- Maintain anonymity throughout the voting process
- View transparent, verifiable outcomes

## Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router and server components
- **React 19**: Latest React with concurrent features
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Framer Motion**: Animation library for smooth user interactions
- **Radix UI**: Accessible component primitives
- **RainbowKit**: Wallet connection interface
- **Wagmi**: Ethereum interaction hooks

### Blockchain & Smart Contracts
- **Solidity**: Smart contract development
- **Hardhat**: Development environment and testing framework
- **Ethers.js**: Ethereum JavaScript library
- **Zama FHE**: Fully Homomorphic Encryption for privacy-preserving computation
- **Chainlink Automation**: Decentralized oracle network for automated processes
- **Infura**: RPC provider for Ethereum network access

### Data & Indexing
- **The Graph**: Decentralized protocol for indexing and querying blockchain data
- **Apollo Client**: GraphQL client for efficient data fetching
- **IPFS**: Decentralized file storage for proposal attachments (via Pinata gateway)

### Development Tools
- **JavaScript**: Dynamic scripting for frontend development
- **ESLint**: Code linting and formatting

## Architecture

### Smart Contracts
- **SpaceRegistry.sol**: Manages creation and registration of governance spaces
- **PrivateProposalFactory.sol**: Factory contract for deploying new proposal instances
- **PrivateProposal.sol**: Core contract handling encrypted voting logic
- **MockGovernanceToken.sol**: Mock Ivotes token for testing voting eligibility

### Subgraphs
- **agora-subgraph**: Comprehensive indexing of spaces, proposals, and voting activities

### Application Structure
```
frontend/
├── src/app/                 # Next.js App Router pages
├── src/components/          # Reusable React components
├── src/lib/                 # Utility libraries and configurations
├── src/hooks/               # Custom React hooks
└── public/                  # Static assets
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn package manager
- Web3 wallet (MetaMask, Rainbow, etc.)
- Access to Ethereum testnet

### Quick Start
1. **Visit the Agora website**: [https://agora-staged.vercel.app/](https://agora-staged.vercel.app/)

### Local Development Setup
For detailed setup instructions, environment configuration, and deployment guides, see [Frontend Documentation](./frontend.md).

## Future Roadmap

### Planned Features
- **Advanced Voting Models**: Quadratic voting, customizable winner selection, and flexible quorum settings
- **Governance Analytics**: Advanced reporting and insights
- **Automation** Automatic off-chain public decryption
- **Confidential Gouvernance Token** Use confidential gouvernance token to hide user balance


### Research Directions
- **Scalability Improvements**: Optimizing FHE operations for larger communities
- **Interoperability**: Cross-protocol governance mechanisms
- **Advanced Privacy**: Enhanced anonymity sets and mixing techniques

## Acknowledgments

- **[Zama](https://zama.ai/)**: For pioneering FHE technology and fhEVM
- **[Chainlink](https://chainlink.com/)**: For decentralized automation infrastructure
- **[The Graph](https://thegraph.com/)**: For decentralized data indexing
- **[OpenZeppelin](https://openzeppelin.com/)**: For secure smart contract libraries and standards
- **[chriswilder](https://github.com/0xchriswilder/fhevm-react-template/blob/main/packages/fhevm-sdk/src/core/fhevm.ts)** For the fhevm.ts file and his availability
- **Open Source Community**: For the tools and libraries that make this possible

---

*Built with ❤️ using Zama's revolutionary FHE technology for private, secure, and transparent governance.*