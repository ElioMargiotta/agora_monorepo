# Frontend

The frontend component of Agora is a Next.js web application that provides the user interface for the Agora platform. It enables users to interact with the decentralized governance system through a modern, responsive web interface.

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- A Web3 wallet (MetaMask, etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ElioMargiotta/agora_monorepo.git
   cd agora_monorepo/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the `local.example` file to `.env.local` and update the values with your own credentials:
   
   ```bash
   cp local.example .env.local
   ```
   
   Edit `.env.local` and fill in the required values. It is mandatory to edit the Infura and Pinata credentials; the other values can be used as provided in the example. Please refer to the documentation of Pinata and Infura to create your own credentials.



4. **Start the development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Architecture

### Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Blockchain**: EVM, Solidity smart contracts
- **Indexing**: The Graph protocol for subgraph queries
- **Deployment**: Hardhat development environment
- **Encryption**: Zama FHE (@zama-fhe/relayer-sdk)
- **Wallet**: RainbowKit, Wagmi
- **Automation**: Chainlink
- **UI Components**: Radix UI, Framer Motion animations

### Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.js                 # Landing page
│   │   ├── docs/                   # Documentation
│   │   └── app/
│   │       ├── layout.js           # App layout
│   │       ├── page.js             # App dashboard
│   │       ├── spaces/
│   │       │   └── create/
│   │       │       └── page.js     # Create new space
│   │       └── [space_name]/
│   │           ├── page.js         # Space dashboard
│   │           └── [proposal_id]/
│   │               └── page.js     # Proposal voting page
│   ├── components/
│   │   ├── landing/                # Landing page components
│   │   ├── ui/                     # Reusable UI components
│   │   ├── wallet/                 # Wallet connection components
│   │   ├── dashboard/              # Dashboard components
│   │   └── providers.jsx           # App providers
│   ├── lib/
│   │   ├── wagmi.js                # Web3 configuration
│   │   ├── apollo.ts               # GraphQL client
│   │   ├── fhevm.ts                # FHE utilities
│   │   └── utils.js                # Utility functions
│   ├── hooks/
│   │   └── useSubgraph.js          # Subgraph hooks
│   └── styles/
├── public/                         # Static assets
└── package.json                    # Dependencies
```

## Private Governance

The flagship feature of Agora is **Private Governance** - a privacy-preserving proposal and voting system that demonstrates the power of FHE in decentralized governance.

### How It Works

1. **Create a Space**: Set up a new governance space with custom settings and member controls
2. **Submit Proposals**: Members propose ideas and initiatives within the space
3. **Vote Anonymously**: Participants cast encrypted votes with voting power based on eligibility tokens
4. **Automated Resolution**: Chainlink automation handles vote tallying and proposal execution
5. **Privacy Guaranteed**: All votes remain encrypted throughout the process

### Smart Contracts

The governance system utilizes several Solidity smart contracts deployed with Hardhat:
- `SpaceRegistry.sol`: Manages space creation and registration
- `PrivateProposalFactory.sol`: Creates new private proposal instances
- `PrivateProposal.sol`: Handles encrypted proposal voting logic
- `MockGouvernanceToken.sol`: ERC-20 token for voting eligibility

For detailed contract architecture and FHE implementation, see [Contract Architecture](./contract.md).


### Subgraphs

The platform uses The Graph protocol for efficient on-chain data indexing:
- `agora-sub/`: Subgraph for Agora-related events

For local development, you can run your own subgraph node instead of using the hosted service. Refer to [The Graph documentation](https://thegraph.com/docs/) for setup instructions.

## Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Vitest tests

### Environment Setup

For local development, ensure you have:

1. **Blockchain Network**: Access to testnet (Sepolia, Base Sepolia, etc.)
2. **Wallet**: Connected wallet with test tokens

### Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test -- --coverage
```

## Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Zama FHE Documentation](https://docs.zama.ai/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Chainlink Documentation](https://docs.chain.link/)
- [The Graph Documentation](https://thegraph.com/docs/)

## 🙏 Acknowledgments

- [Chriswilder](https://github.com/0xchriswilder/fhevm-react-template/blob/main/packages/fhevm-sdk/src/core/fhevm.ts) for providing the initial skeleton of the `fhevm.ts` file