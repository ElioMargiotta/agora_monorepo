# ZamaHub

A comprehensive platform showcasing Zama's Fully Homomorphic Encryption (FHE) innovations, featuring privacy-preserving blockchain applications and decentralized gaming.

## 🌟 Overview

ZamaHub is the ultimate platform to explore and test Zama's cutting-edge Fully Homomorphic Encryption (FHE) technology. Experience computation on encrypted data without decryption - enabling truly private, secure, and decentralized applications.

### Key Features

- **🔐 Fully Homomorphic Encryption**: Perform computations on encrypted data without ever decrypting it
- **🗳️ Privacy-Preserving Voting**: Cast anonymous votes while maintaining verifiability
- **🎮 Decentralized Gaming**: Play blockchain games with complete privacy protection
- **⚙️ Chainlink Automation**: Seamless, trustless automated processes
- **🎯 Zama Game**: Our flagship implementation showcasing FHE in competitive mind games

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- A Web3 wallet (MetaMask, etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ElioMargiotta/ZamaHub-repo.git
   cd ZamaHub-repo/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```


3. **Start the development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Blockchain**: Ethereum, Solidity smart contracts
- **Deployment**: Hardhat development environment
- **Encryption**: Zama FHE (@zama-fhe/relayer-sdk)
- **Wallet**: RainbowKit, Wagmi, Coinbase OnchainKit
- **Automation**: Chainlink oracles
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
│   │       └── zama-game/          # Main game interface
│   │           ├── page.js         # Game page
│   │           └── contracts/      # Smart contracts
│   ├── components/
│   │   ├── landing/                # Landing page    components
│   │   ├── ui/                     # Reusable UI components
│   │   ├── wallet/                 # Wallet connection components
│   │   └── providers.jsx           # App providers
│   └── lib/
│       ├── wagmi.js                # Web3 configuration
│       └── utils.js                # Utility functions
├── public/                         # Static assets
└── package.json                    # Dependencies
```

## 🎮 Zama Game

The flagship feature of ZamaHub is the **Zama Game** - a competitive, privacy-preserving voting system that demonstrates the power of FHE in blockchain gaming.

### How It Works

1. **Create a Voting**: Set up a new voting round with custom options and parameters
2. **Deposit & Vote**: Participants deposit tokens and cast encrypted votes
3. **Automated Resolution**: Chainlink automation handles vote counting and winner determination
4. **Privacy Guaranteed**: All votes remain encrypted throughout the process

### Smart Contracts

The game utilizes several Solidity smart contracts deployed with Hardhat:
- `VotingFactory.sol`: Creates new voting instances
- `PrivateVoting.sol`: Handles encrypted voting logic
- `MockUSDC.sol`: ERC-20 token for deposits
- `WheelPool.sol`: Prize distribution mechanism

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Vitest tests
- `npx hardhat compile` - Compile Solidity smart contracts
- `npx hardhat test` - Run smart contract tests
- `npx hardhat deploy` - Deploy contracts to network

### Environment Setup

For local development, ensure you have:

1. **Blockchain Network**: Access to testnet (Sepolia, Base Sepolia, etc.)
2. **Wallet**: Connected wallet with test tokens

### Testing

```bash
# Run all tests
npm dev run

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test -- --coverage
```


## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Zama FHE Documentation](https://docs.zama.ai/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Chainlink Documentation](https://docs.chain.link/)
- [Base Documentation](https://docs.base.org/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Zama](https://zama.ai/) for the FHE technology
- [Chainlink](https://chainlink.com/) for automation infrastructure
- [Coinbase](https://coinbase.com/) for OnchainKit
- [Vercel](https://vercel.com/) for hosting platform

---

Built with ❤️ using Zama's revolutionary FHE technology
