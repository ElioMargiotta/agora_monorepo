# A G O R A: Private Proposal System with FHE

## 📋 Overview

AGORA is a decentralized proposal infrastructure that leverages **Fully Homomorphic Encryption (FHE)** to ensure complete privacy of votes until proposal resolution. The system uses a factory pattern with Chainlink automation for resolution.

## 🏗️ Contract Architecture

### Interface Contracts

The system defines several key interfaces to standardize interactions and ensure modularity:

- **ISpaceRegistry**: Manages decentralized spaces for proposals, including creation, membership, and administration. It supports different membership types (Public, Whitelist, TokenHolder, NFTHolder) and emits events for space lifecycle management.

- **IProposalFactory**: Provides a standard interface for creating proposals within spaces. It defines proposal types (NonWeightedSingleChoice, WeightedSingleChoice, WeightedFractional), eligibility criteria, and emits events upon proposal creation.

- **IPrivateProposal**: Defines the interface for private proposal contracts that handle voting with FHE. It includes functions for voting (non-weighted, weighted fractional, weighted single), resolution via Chainlink automation, and retrieving decrypted results after proposal end.

### Core Contracts

The system consists of four main core contracts and one library that implement the interfaces and handle the decentralized proposal logic:

- **SpaceRegistry**: Implements `ISpaceRegistry` to manage decentralized spaces. It allows users to create spaces tied to ENS names they own, manage membership types (Public, Whitelist, TokenHolder, NFTHolder), and handle space administration. Spaces serve as containers for proposals, ensuring only authorized members can participate.

- **PrivateProposal**: Implements `IPrivateProposal` and is the core voting contract. It handles proposal metadata, timing, eligibility checks, and most importantly, encrypted voting using Fully Homomorphic Encryption (FHE). Each proposal is deployed as a separate contract instance.

- **PrivateProposalFactory**: Implements `IProposalFactory` and serves as the factory for creating new proposal instances. It integrates with Chainlink Automation for efficient proposal resolution and organizes proposals by space and time buckets for scalability.

- **ProposalAutomation**: A library that provides time-bucketed automation logic for efficient proposal upkeep checks. It optimizes Chainlink Automation by grouping proposals into time buckets to reduce gas costs and improve performance.

### Mock/Test Contracts

For testing and development purposes, the system includes several mock contracts that simulate external dependencies:

- **MockENS**: Simulates the Ethereum Name Service (ENS) for registering and managing domain names in test environments.

- **MockERC721**: A mock ERC721 token contract for testing NFT-based eligibility and membership.

- **MockGovernanceToken**: A mock ERC20 token with voting capabilities (implements `IVotes`) for testing token-weighted voting scenarios.

- **MockUSDC**: A mock stablecoin (USDC) contract for testing token-holder eligibility and payments.

#### FHE Usage and Input Types

FHE (Fully Homomorphic Encryption) is required in the `PrivateProposal` contract to ensure vote privacy until proposal resolution. Votes are encrypted on the client-side and remain encrypted on-chain, allowing computations (like tallying) without revealing individual votes.

FHE is used in the following voting functions:

- **voteNonweighted**: Accepts `externalEuint8` (encrypted uint8 representing the choice index) and `bytes inputProof` for verification. Used for equal-weight single-choice voting.

- **voteWeightedFractional**: Accepts `externalEuint32[]` (array of encrypted uint32 percentages for each choice, summing to 100) and `bytes totalPercentageProof`. Used for weighted voting where users distribute their voting power across multiple choices.
  - *Note*: Percentages are integers to avoid rounding errors.

- **voteWeightedSingle**: Accepts `externalEuint8` (encrypted uint8 for the chosen option) and `bytes inputProof`. Used for weighted single-choice voting where full voting power goes to one choice.

All FHE inputs require cryptographic proofs to verify the encryption was performed correctly, preventing malicious inputs.

#### Resolution Process

Proposal resolution is automated using Chainlink Automation to ensure timely decryption and result revelation:

1. **Upkeep Trigger**: After the proposal's `end` time, the `PrivateProposalFactory`'s `checkUpkeep` function detects proposals ready for resolution. It returns `upkeepNeeded = true` with proposal addresses in `performData`.

2. **performUpkeep Execution**: Chainlink calls `performUpkeep` on the factory, which iterates through ready proposals and calls each `PrivateProposal.performUpkeep()`. This marks `autoRevealTriggered = true` and emits encrypted vote handles for decryption.

3. **Decryption Request**: The emitted handles are sent to the FHE decryption service (via a frontend relayer). The service decrypts the aggregated vote counts for each choice. 

Further development objectives include automating the off-chain decryption step to eliminate manual intervention. Currently, one user needs to request proposal resolution by triggering the decryption service after the upkeep is performed. Future iterations will integrate this into the Chainlink Automation workflow or use dedicated oracles for seamless, fully automated resolution.

4. **Callback Resolution**: The decrypted results are passed back via `resolveProposalCallback()`, which verifies the decryption proofs using `FHE.checkSignatures()`. It then:
   - Stores decrypted vote counts in `choiceVotes`
   - Calculates percentages and determines the winning choice
   - Applies passing threshold logic (plurality if 0, or percentage-based)
   - Sets `resultsRevealed = true` and `proposalResolved = true`
   - Emits resolution events

#### Voting Math and Resolution Logic

##### Proposal Types and Vote Calculation

- **NonWeightedSingleChoice**: Each voter casts one vote (weight = 1) for a single choice. The tally for each choice is the count of voters who selected it.
  ```math
  \text{Tally}_c = \sum_{v \in \text{voters}} 1 \quad \text{if } v \text{ chooses } c
  ```

- **WeightedSingleChoice**: Each voter allocates their full voting power (from `IVotes.getPastVotes()` at snapshot) to a single choice. The tally for the chosen choice increases by the voter's total weight.
  ```math
  \text{Tally}_c += w_v \quad \text{if } v \text{ chooses } c, \quad \text{where } w_v = \text{getPastVotes}(v, \text{snapshot})
  ```

- **WeightedFractional**: Each voter distributes their voting power across choices using percentages (0-100 per choice, summing to 100). The tally for each choice increases by `(percentage * totalWeight) / 100`. 

  ```math
  \text{Tally}_c += \frac{p_c \cdot w_v}{100} \quad \text{for each choice } c, \quad \text{where } \sum_c p_c = 100, \quad w_v = \text{getPastVotes}(v, \text{snapshot})
  ```

##### Resolution with Abstain, Ties, and Threshold

Resolution excludes "Abstain" votes (if included as the last choice) from winning calculations and total vote counts:

- **Abstain Handling**: Abstain votes are not counted in $\text{totalVotes}$, $\text{maxVotes}$, or tie checks. They are recorded but do not affect the outcome.

- **Tie Case**: If multiple non-abstain choices have the same highest vote count ($\text{maxVotes}$), the proposal results in a draw ($\text{isDraw} = \text{true}$, $\text{proposalPassed} = \text{false}$, $\text{winningChoice} = 255$).
  ```math
  \text{if } \exists c_1, c_2 \neq \text{abstain}, \quad \text{Tally}_{c_1} = \text{Tally}_{c_2} = \max(\text{Tally}_c \mid c \neq \text{abstain}), \quad \text{then draw}
  ```

- **Threshold Logic**:
  - If $\text{passingThreshold} = 0$ (plurality): The proposal passes if the winning choice has any votes ($\text{maxVotes} > 0$).
  - If $\text{passingThreshold} > 0$: The proposal passes if the winning choice's percentage (in basis points, e.g., 5000 = 50%) exceeds the threshold.
    ```math
    \text{passed} = \left( \frac{\text{Tally}_{\text{win}}}{\sum_{c \neq \text{abstain}} \text{Tally}_c} \times 10000 \right) > \text{passingThreshold}
    ```


