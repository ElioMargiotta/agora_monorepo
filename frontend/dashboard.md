# User Dashboard Overview

The User Dashboard is a functional space management interface built with Next.js and React, integrated with a subgraph for querying blockchain data from smart contracts (SpaceRegistry, PrivateProposalFactory, and PrivateProposal). It provides users with an overview of their spaces, proposals, and activity in a decentralized governance platform.

## Key Features Displayed

### 1. **User Statistics**
   - **Joined Spaces**: Total number of spaces the user has joined (owned, admin, or member roles).
   - **Active Proposals**: Count of ongoing proposals across the user's spaces (filtered by current timestamp).
   - **Votes Cast**: Number of votes the user has submitted (based on `voteds` events).
   - **Spaces Created**: Number of spaces owned by the user.

### 2. **Joined Spaces**
   - Lists up to 5 recently joined spaces, including:
     - Space name (ENS or display name).
     - Member count (aggregated from `memberJoineds` events).
     - Role (owner, admin, or member).
     - Link to view the space details.

### 3. **Active Proposals**
   - Displays up to 10 recent active proposals from the user's spaces, showing:
     - Proposal title (`p_title`).
     - Space name.
     - Start and end dates (`p_start`, `p_end`).
     - Eligibility criteria (`p_eligibilityType`, `p_eligibilityToken`, `p_eligibilityThreshold`).
     - Proposal type (`p_pType`).
     - Choices (`p_choices`).
     - User's vote status (currently set to null due to privacy constraints in the subgraph).

### 4. **Recent Activity**
   - Shows up to 5 recent votes cast by the user, including:
     - Timestamp of the vote.
     - Transaction hash.
     - Note: Specific proposal details (e.g., choice, weight) are not displayed as the subgraph only indexes `user` and `timestamp` for privacy.

## Data Sources
- **Subgraph Queries**: All data is fetched from The Graph subgraph (version 0.0.6) using hooks like `useCategorizedSpaces`, `useProposalsBySpaces`, and `useUserVotes`.
- **Entities Queried**:
  - `spaceCreateds`: For space details.
  - `memberJoineds`: For membership and counts.
  - `adminAddeds`: For admin roles.
  - `proposalCreateds`: For proposal data.
  - `voteds`: For vote activity (limited fields).
- **Limitations**: Vote details are private; only timestamps and users are indexed to preserve confidentiality.

## Navigation and Tabs
- **Tabs**: Overview (default), Active Proposals, Recent Activity.
- **Responsive Design**: Uses Tailwind CSS for mobile-friendly layout.
- **Loading States**: Displays placeholders (e.g., "...") while data loads.

## Usage Notes
- Requires a connected wallet (via Wagmi) for user-specific data.
- Data is cached with React Query for performance.
- If no data is available, partial views are shown to avoid blocking the UI.

For more details on the subgraph schema or contract ABIs, refer to the `agora_subgraph` folder.