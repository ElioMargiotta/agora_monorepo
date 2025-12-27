# Contract Architecture

## Interface Contracts

The system defines several key interfaces to standardize interactions and ensure modularity:

- **ISpaceRegistry**: Manages decentralized spaces for proposals, including creation, membership, and administration. It supports different membership types (Public, Whitelist, TokenHolder, NFTHolder) and emits events for space lifecycle management.

- **IProposalFactory**: Provides a standard interface for creating proposals within spaces. It defines proposal types (NonWeightedSingleChoice, WeightedSingleChoice, WeightedFractional), eligibility criteria, and emits events upon proposal creation.

- **IPrivateProposal**: Defines the interface for private proposal contracts that handle voting with FHE. It includes functions for voting (non-weighted, weighted fractional, weighted single), resolution via Chainlink automation, and retrieving decrypted results after proposal end.

## Core Contracts

The system consists of four main core contracts and one library that implement the interfaces and handle the decentralized proposal logic:

- **SpaceRegistry**: Implements `ISpaceRegistry` to manage decentralized spaces. It allows users to create spaces tied to mock ENS names they own, manage membership types (Public, Whitelist, TokenHolder, NFTHolder), and handle space administration. Spaces serve as containers for proposals, ensuring only authorized members can participate.

- **PrivateProposal**: Implements `IPrivateProposal` and is the core voting contract. It handles proposal metadata, timing, eligibility checks, and most importantly, encrypted voting using Fully Homomorphic Encryption (FHE). Each proposal is deployed as a separate contract instance.

- **PrivateProposalFactory**: Implements `IProposalFactory` and serves as the factory for creating new proposal instances. It integrates with Chainlink Automation for efficient proposal resolution and organizes proposals by space and time buckets for scalability.

- **ProposalAutomation**: A library that provides time-bucketed automation logic for efficient proposal upkeep checks. It optimizes Chainlink Automation by grouping proposals into time buckets to reduce gas costs and improve performance.

## Mock/Test Contracts

For testing and development purposes, the system includes several mock contracts that simulate external dependencies:

- **MockENS**: Simulates the Ethereum Name Service (ENS) for registering and managing domain names in test environments.

- **MockERC721**: A mock ERC721 token contract for testing NFT-based eligibility and membership.

- **MockGovernanceToken**: A mock ERC20 token with voting capabilities (implements `IVotes`) for testing token-weighted voting scenarios.

- **MockUSDC**: A mock stablecoin (USDC) contract for testing the prediction market feature. This token is used for staking predictions and is separate from the governance token used for voting power.

### FHE Usage and Input Types

FHE (Fully Homomorphic Encryption) is required in the `PrivateProposal` contract to ensure vote privacy until proposal resolution. Votes are encrypted on the client-side and remain encrypted on-chain, allowing computations (like tallying) without revealing individual votes.

FHE is used in the following voting functions:

- **voteNonweighted**: Accepts `externalEuint8` (encrypted uint8 representing the choice index) and `bytes inputProof` for verification. Used for equal-weight single-choice voting.

- **voteWeightedFractional**: Accepts `externalEuint32[]` (array of encrypted uint32 percentages for each choice, summing to 100) and `bytes totalPercentageProof`. Used for weighted voting where users distribute their voting power across multiple choices.
  - *Note*: Percentages are integers to avoid rounding errors.

- **voteWeightedSingle**: Accepts `externalEuint8` (encrypted uint8 for the chosen option) and `bytes inputProof`. Used for weighted single-choice voting where full voting power goes to one choice.

All FHE inputs require cryptographic proofs to verify the encryption was performed correctly, preventing malicious inputs.

### Resolution Process

Proposal resolution is automated using Chainlink Automation to ensure timely decryption and result revelation:

1. **Upkeep Trigger**: After the proposal's `end` time, the `PrivateProposalFactory`'s `checkUpkeep` function detects proposals ready for resolution. It returns `upkeepNeeded = true` with proposal addresses in `performData`.

2. **performUpkeep Execution**: Chainlink calls `performUpkeep` on the factory, which iterates through ready proposals and calls each `PrivateProposal.performUpkeep()`. This marks `autoRevealTriggered = true` and emits encrypted vote handles for decryption.

3. **Decryption Request**: The emitted handles are sent to the FHE decryption service (via a frontend relayer). The service decrypts the aggregated vote counts for each choice. 

> **Note**: Further development objectives include automating the off-chain decryption step to eliminate manual intervention. Currently, one user needs to request proposal resolution by triggering the decryption service after the upkeep is performed. Future iterations will integrate this into the Chainlink Automation workflow or use dedicated oracles for seamless, fully automated resolution.

4. **Callback Resolution**: The decrypted results are passed back via `resolveProposalCallback()`, which verifies the decryption proofs using `FHE.checkSignatures()`. It then:
   - Stores decrypted vote counts in `choiceVotes`
   - Calculates percentages and determines the winning choice
   - Applies passing threshold logic (plurality if 0, or percentage-based)
   - Sets `resultsRevealed = true` and `proposalResolved = true`
   - Emits resolution events

### Voting Math and Resolution Logic

#### Proposal Types and Vote Calculation

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

### Prediction Market

The `PrivateProposal` contract includes an optional prediction market feature that allows users to stake tokens on their prediction of which choice will win. This creates a financial incentive layer on top of the voting mechanism, enabling speculative participation separate from actual voting.

#### Prediction Market Configuration

When creating a proposal, two parameters control the prediction market:
- **`predictionMarketEnabled`**: Boolean flag to enable/disable the prediction market feature
- **`predictionToken`**: Address of the ERC20 token to use for staking predictions (typically MockUSDC or another stablecoin)

This design allows complete separation between voting eligibility and prediction staking:
- **Public Voting + Prediction Market**: Set `eligibilityType=Public`, `predictionToken=USDC` → Anyone can vote and predict with USDC
- **Token-Gated Voting + Prediction Market**: Set `eligibilityType=TokenHolder`, `eligibilityToken=GovernanceToken`, `predictionToken=USDC` → Only token holders can vote, but anyone can predict with USDC

The prediction token is independent from the governance token, enabling flexible economic models where voting power and prediction stakes are completely decoupled.

#### Prediction Mechanism

Users can make encrypted predictions using the `makePrediction()` function:

- **Input**: `externalEuint8 encryptedPrediction` (encrypted choice index) and `bytes inputProof`, plus `uint256 amount` (token stake).
- **Behavior**: 
  - Transfers `amount` tokens from the user to the contract via `IERC20.transferFrom()`.
  - Stores the encrypted prediction using FHE (`euint8`).
  - Records the stake amount in `predictionStakes[user]`.
  - Updates `totalPredictionPool` to track the total staked amount.
  - If the user had a previous prediction, it is automatically cancelled (refunded at 99% minus 1% fee).

**Privacy**: Predictions remain encrypted on-chain, preventing front-running or social influence based on prediction distribution.

#### Cancellation and Fees

Users can cancel their prediction anytime before results are revealed via `cancelPrediction()`:

- **Refund**: Returns 99% of the staked amount to the user.
- **Fee**: Retains 1% as a cancellation fee, accumulated in `accumulatedFees`.
- **State Update**: Resets the user's encrypted prediction to `FHE.asEuint8(0)` and clears their stake.

**Auto-Cancellation**: When a user makes a new prediction, any existing prediction is automatically cancelled with the same 99% refund and 1% fee applied before the new prediction is recorded.

#### Prediction Tallying and Payout

After voting ends and results are revealed:

1. **Reveal Trigger**: The contract owner or admin calls `revealPredictionsForPayout()` to enable claiming. This sets `predictionsRevealed = true`.

2. **Tally Predictions**: Since FHE decryption on-chain is limited, the system uses off-chain decryption. The `tallyPredictions(address[] users, uint8[] predictions)` function is called with the decrypted prediction values:
   - Iterates through provided users and their decrypted predictions.
   - Accumulates stakes for each choice in `predictionTotalsPerChoice[choice]`.
   - Marks users as having claimed (`predictionClaimed[user] = true`) to prepare for payout.

3. **Claim Winnings**: Winners call `claimWinnings()` to receive their proportional share:
   - Verifies the user predicted the winning choice.
   - Calculates payout as: 
     ```math
     \text{payout} = \frac{\text{totalPredictionPool} \times \text{userStake}}{\text{totalWinningStakes}}
     ```
   - Transfers the payout via `IERC20.transfer()`.
   - Marks the user as claimed to prevent double-claiming.

**Winner-Takes-All**: The entire pool (including losers' stakes) is distributed proportionally among winners based on their stake percentages. Users who predicted incorrectly lose their entire stake.

#### Security and State Management

- **ReentrancyGuard**: `makePrediction()`, `cancelPrediction()`, and `claimWinnings()` are protected against reentrancy attacks.
- **State Checks**: 
  - Predictions are only allowed before `predictionsRevealed = true`.
  - Claims are only allowed after predictions are revealed and tallied.
  - Double-claiming is prevented via the `predictionClaimed` mapping.
- **FHE Encryption**: All predictions are stored as `euint8` encrypted values, maintaining privacy until off-chain decryption.

#### View Functions

The contract provides two view functions for monitoring prediction market state:

- **getPredictionMarketInfo()**: Returns `(bool enabled, address token, uint256 totalPool, uint256 fees, bool revealed)` with the market's configuration and current state.
- **getUserPredictionInfo(address user)**: Returns `(bool hasMadePrediction, uint256 stakedAmount, bool hasClaimed)` for a specific user's prediction status.

#### Game Theory and Economics

The prediction market creates a financial layer that:
- **Incentivizes Accuracy**: Users stake tokens on their belief about the outcome, rewarding correct predictions.
- **Enables Speculation**: Non-voters can participate financially without voting rights.
- **Price Discovery**: The distribution of stakes (though encrypted) can reveal market sentiment after resolution.
- **Fee Mechanism**: The 1% cancellation fee discourages rapid strategy changes and generates protocol revenue.
- **Risk-Reward Balance**: Winner-takes-all distribution creates high upside for correct predictions but total loss for incorrect ones.


