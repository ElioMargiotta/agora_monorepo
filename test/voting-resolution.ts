import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { PrivateProposal, PrivateProposalFactory, SpaceRegistry, MockENS, MockGovernanceToken } from "../types";
import { CreateProposalParamsStruct } from "../types/contracts/IProposalFactory";
import { FhevmType } from "@fhevm/hardhat-plugin";
import * as hre from "hardhat";

describe("PrivateProposal Voting and Resolution", function () {
  let factory: PrivateProposalFactory;
  let spaceRegistry: SpaceRegistry;
  let mockENS: MockENS;
  let mockToken: MockGovernanceToken;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let user3: HardhatEthersSigner;
  let stranger: HardhatEthersSigner;

  // Test constants
  const PROPOSAL_CONFIG = {
    TITLE: "Voting Test Proposal",
    BODY_URI: "https://example.com/proposal",
    PTYPE: 0,
    CHOICES: ["Yes", "No"],
    START_OFFSET: 100, // Start 100 seconds from now
    DURATION: 3600, // Last 1 hour
    ELIGIBILITY_TYPE: 0, // Public
    ELIGIBILITY_TOKEN: ethers.ZeroAddress,
    ELIGIBILITY_THRESHOLD: 0,
    INCLUDE_ABSTAIN: false,
    PASSING_THRESHOLD: 0
  };

  beforeEach(async function () {
    [owner, user1, user2, user3, stranger] = await ethers.getSigners();

    // Deploy MockENS
    const MockENSFactory = await ethers.getContractFactory("MockENS");
    mockENS = await MockENSFactory.deploy();

    // Deploy Mock Governance Token for weighted voting
    const MockGovernanceTokenFactory = await ethers.getContractFactory("MockGovernanceToken");
    mockToken = await MockGovernanceTokenFactory.deploy();
    await mockToken.mint(user1.address, 1000);
    await mockToken.mint(user2.address, 2000);
    await mockToken.mint(user3.address, 500);

    // Delegate voting power to themselves
    await mockToken.connect(user1).delegate(user1.address);
    await mockToken.connect(user2).delegate(user2.address);
    await mockToken.connect(user3).delegate(user3.address);

    // Deploy SpaceRegistry
    const SpaceRegistryFactory = await ethers.getContractFactory("SpaceRegistry");
    spaceRegistry = await SpaceRegistryFactory.deploy(mockENS.target);

    // Deploy ProposalAutomation library
    const ProposalAutomationFactory = await ethers.getContractFactory("ProposalAutomation");
    const proposalAutomation = await ProposalAutomationFactory.deploy();

    // Deploy factory with space registry and link libraries
    const PrivateProposalFactoryFactory = await ethers.getContractFactory("PrivateProposalFactory", {
      libraries: {
        ProposalAutomation: proposalAutomation.target
      }
    });
    const factoryInstance = await PrivateProposalFactoryFactory.deploy(spaceRegistry.target);
    await factoryInstance.waitForDeployment();

    factory = factoryInstance as unknown as PrivateProposalFactory;

    // Create a test space
    const ensName = "test.agora";
    const spaceId = ethers.keccak256(ethers.toUtf8Bytes(ensName));
    const node = await spaceRegistry.namehash(ensName);
    await mockENS.setNodeOwner(node, owner.address);
    await spaceRegistry.createSpace(ensName, "Test Space", 0, ethers.ZeroAddress, 0);

    // Add users to space
    await spaceRegistry.connect(user1).joinSpace(spaceId);
    await spaceRegistry.connect(user2).joinSpace(spaceId);
    await spaceRegistry.connect(user3).joinSpace(spaceId);

    // Store spaceId for tests
    (global as any).testSpaceId = spaceId;
  });

  describe("Non-Weighted Single Choice Voting", function () {
    let proposal: PrivateProposal;

    beforeEach(async function () {
      const spaceId = (global as any).testSpaceId;
      const currentTime = await time.latest();
      const startTime = currentTime + PROPOSAL_CONFIG.START_OFFSET;
      const endTime = startTime + PROPOSAL_CONFIG.DURATION;

      const params: CreateProposalParamsStruct = {
        spaceId: spaceId,
        title: "Non-Weighted Voting Test",
        bodyURI: PROPOSAL_CONFIG.BODY_URI,
        pType: 0, // NonWeightedSingleChoice
        choices: PROPOSAL_CONFIG.CHOICES,
        start: startTime,
        end: endTime,
        eligibilityType: PROPOSAL_CONFIG.ELIGIBILITY_TYPE,
        eligibilityToken: PROPOSAL_CONFIG.ELIGIBILITY_TOKEN,
        eligibilityThreshold: PROPOSAL_CONFIG.ELIGIBILITY_THRESHOLD,
        includeAbstain: PROPOSAL_CONFIG.INCLUDE_ABSTAIN,
        passingThreshold: PROPOSAL_CONFIG.PASSING_THRESHOLD,
      };

      const tx = await factory.createProposal(params);
      const receipt = await tx.wait();
      const event = receipt!.logs.find(log => {
        try {
          return factory.interface.parseLog(log)?.name === "ProposalCreated";
        } catch {
          return false;
        }
      });
      const parsedEvent = factory.interface.parseLog(event!);
      const proposalAddress = parsedEvent!.args[2];

      proposal = await ethers.getContractAt("PrivateProposal", proposalAddress);

      // Advance time to start the proposal
      await time.increase(PROPOSAL_CONFIG.START_OFFSET + 10);
    });

    it("Should allow users to vote with encrypted choices", async function () {
      // User1 votes for choice 0 (Yes)
      const encryptedVote1 = await fhevm
        .createEncryptedInput(proposal.target.toString(), user1.address)
        .add8(0)
        .encrypt();
      await proposal.connect(user1).voteNonweighted(encryptedVote1.handles[0], encryptedVote1.inputProof);

      // User2 votes for choice 1 (No)
      const encryptedVote2 = await fhevm
        .createEncryptedInput(proposal.target.toString(), user2.address)
        .add8(1)
        .encrypt();
      await proposal.connect(user2).voteNonweighted(encryptedVote2.handles[0], encryptedVote2.inputProof);

      // User3 votes for choice 0 (Yes)
      const encryptedVote3 = await fhevm
        .createEncryptedInput(proposal.target.toString(), user3.address)
        .add8(0)
        .encrypt();
      await proposal.connect(user3).voteNonweighted(encryptedVote3.handles[0], encryptedVote3.inputProof);

      // Check voting status
      expect(await proposal.hasVoted(user1.address)).to.be.true;
      expect(await proposal.hasVoted(user2.address)).to.be.true;
      expect(await proposal.hasVoted(user3.address)).to.be.true;
    });

    it("Should prevent double voting", async function () {
      const encryptedVote = await fhevm
        .createEncryptedInput(proposal.target.toString(), user1.address)
        .add8(0)
        .encrypt();

      await proposal.connect(user1).voteNonweighted(encryptedVote.handles[0], encryptedVote.inputProof);

      // Try to vote again
      await expect(
        proposal.connect(user1).voteNonweighted(encryptedVote.handles[0], encryptedVote.inputProof)
      ).to.be.revertedWithCustomError(proposal, "AlreadyVoted");
    });

    it("Should resolve proposal correctly after voting", async function () {
      // Cast votes: 2 Yes, 1 No
      const encryptedVote1 = await fhevm
        .createEncryptedInput(proposal.target.toString(), user1.address)
        .add8(0)
        .encrypt();
      await proposal.connect(user1).voteNonweighted(encryptedVote1.handles[0], encryptedVote1.inputProof);

      const encryptedVote2 = await fhevm
        .createEncryptedInput(proposal.target.toString(), user2.address)
        .add8(1)
        .encrypt();
      await proposal.connect(user2).voteNonweighted(encryptedVote2.handles[0], encryptedVote2.inputProof);

      const encryptedVote3 = await fhevm
        .createEncryptedInput(proposal.target.toString(), user3.address)
        .add8(0)
        .encrypt();
      await proposal.connect(user3).voteNonweighted(encryptedVote3.handles[0], encryptedVote3.inputProof);

      // Advance time past proposal end
      await time.increase(3700);

      // Perform upkeep to trigger reveal
      const [upkeepNeeded, performData] = await factory.checkUpkeep("0x");
      expect(upkeepNeeded).to.be.true;

      const tx = await factory.performUpkeep(performData);
      const receipt = await tx.wait();

      // Parse the TallyRevealRequested event from the proposal
      const tallyRevealEvent = receipt!.logs.find((log: any) => {
        try {
          const parsed = proposal.interface.parseLog(log);
          return parsed?.name === 'TallyRevealRequested';
        } catch {
          return false;
        }
      });

      expect(tallyRevealEvent).to.not.be.undefined;
      const parsedEvent = proposal.interface.parseLog(tallyRevealEvent!);
      const choiceVoteHandles: `0x${string}`[] = parsedEvent?.args[0];

      // Use fhevm.publicDecrypt to decrypt the final tallies
      const publicDecryptResults = await fhevm.publicDecrypt(choiceVoteHandles);

      // Extract the clear values
      const clearValue0 = publicDecryptResults.clearValues[choiceVoteHandles[0]];
      const clearValue1 = publicDecryptResults.clearValues[choiceVoteHandles[1]];

      // Verify the decrypted values match expected distribution
      expect(Number(clearValue0)).to.equal(2); // 2 votes for Yes
      expect(Number(clearValue1)).to.equal(1); // 1 vote for No

      // Use the ABI-encoded values and proof from publicDecrypt
      await proposal.resolveProposalCallback(
        proposal.target,
        publicDecryptResults.abiEncodedClearValues,
        publicDecryptResults.decryptionProof
      );

      // Verify results
      expect(await proposal.resultsRevealed()).to.be.true;
      expect(await proposal.proposalResolved()).to.be.true;
      expect(await proposal.proposalPassed()).to.be.true; // Plurality: Yes wins
      expect(await proposal.winningChoice()).to.equal(0); // Yes (choice 0)

      const choiceVotes0 = await proposal.choiceVotes(0);
      const choiceVotes1 = await proposal.choiceVotes(1);
      expect(choiceVotes0).to.equal(2);
      expect(choiceVotes1).to.equal(1);
    });
  });

  describe("Weighted Single Choice Voting", function () {
    let proposal: PrivateProposal;

    beforeEach(async function () {
      const spaceId = (global as any).testSpaceId;
      const currentTime = await time.latest();
      const startTime = currentTime + PROPOSAL_CONFIG.START_OFFSET;
      const endTime = startTime + PROPOSAL_CONFIG.DURATION;

      const params: CreateProposalParamsStruct = {
        spaceId: spaceId,
        title: "Weighted Single Choice Voting Test",
        bodyURI: PROPOSAL_CONFIG.BODY_URI,
        pType: 1, // WeightedSingleChoice
        choices: PROPOSAL_CONFIG.CHOICES,
        start: startTime,
        end: endTime,
        eligibilityType: 1, // TokenHolder
        eligibilityToken: mockToken.target,
        eligibilityThreshold: 1,
        includeAbstain: PROPOSAL_CONFIG.INCLUDE_ABSTAIN,
        passingThreshold: PROPOSAL_CONFIG.PASSING_THRESHOLD,
      };

      const tx = await factory.createProposal(params);
      const receipt = await tx.wait();
      const event = receipt!.logs.find(log => {
        try {
          return factory.interface.parseLog(log)?.name === "ProposalCreated";
        } catch {
          return false;
        }
      });
      const parsedEvent = factory.interface.parseLog(event!);
      const proposalAddress = parsedEvent!.args[2];

      proposal = await ethers.getContractAt("PrivateProposal", proposalAddress);

      // Advance time to start the proposal
      await time.increase(PROPOSAL_CONFIG.START_OFFSET + 10);
    });

    it("Should allow weighted voting based on token balance", async function () {
      // User1 (1000 tokens) votes for choice 0
      const encryptedVote1 = await fhevm
        .createEncryptedInput(proposal.target.toString(), user1.address)
        .add8(0)
        .encrypt();
      await proposal.connect(user1).voteWeightedSingle(encryptedVote1.handles[0], encryptedVote1.inputProof);

      // User2 (2000 tokens) votes for choice 1
      const encryptedVote2 = await fhevm
        .createEncryptedInput(proposal.target.toString(), user2.address)
        .add8(1)
        .encrypt();
      await proposal.connect(user2).voteWeightedSingle(encryptedVote2.handles[0], encryptedVote2.inputProof);

      // Check voting status
      expect(await proposal.hasVoted(user1.address)).to.be.true;
      expect(await proposal.hasVoted(user2.address)).to.be.true;
    });

    it("Should resolve weighted voting correctly", async function () {
      // User1 (1000 tokens) votes for choice 0
      const encryptedVote1 = await fhevm
        .createEncryptedInput(proposal.target.toString(), user1.address)
        .add8(0)
        .encrypt();
      await proposal.connect(user1).voteWeightedSingle(encryptedVote1.handles[0], encryptedVote1.inputProof);

      // User2 (2000 tokens) votes for choice 1
      const encryptedVote2 = await fhevm
        .createEncryptedInput(proposal.target.toString(), user2.address)
        .add8(1)
        .encrypt();
      await proposal.connect(user2).voteWeightedSingle(encryptedVote2.handles[0], encryptedVote2.inputProof);

      // Advance time past proposal end
      await time.increase(3700);

      // Perform upkeep
      const [upkeepNeeded, performData] = await factory.checkUpkeep("0x");
      expect(upkeepNeeded).to.be.true;

      const tx = await factory.performUpkeep(performData);
      const receipt = await tx.wait();

      // Parse the TallyRevealRequested event
      const tallyRevealEvent = receipt!.logs.find((log: any) => {
        try {
          const parsed = proposal.interface.parseLog(log);
          return parsed?.name === 'TallyRevealRequested';
        } catch {
          return false;
        }
      });

      expect(tallyRevealEvent).to.not.be.undefined;
      const parsedEvent = proposal.interface.parseLog(tallyRevealEvent!);
      const choiceVoteHandles: `0x${string}`[] = parsedEvent?.args[0];

      // Verify: User1's 1000 votes for choice 0, User2's 2000 votes for choice 1
      const publicDecryptResults = await fhevm.publicDecrypt(choiceVoteHandles);

      const clearValue0 = publicDecryptResults.clearValues[choiceVoteHandles[0]];
      const clearValue1 = publicDecryptResults.clearValues[choiceVoteHandles[1]];

      // Verify: User1's 1000 votes for choice 0, User2's 2000 votes for choice 1
      expect(Number(clearValue0)).to.equal(1000);
      expect(Number(clearValue1)).to.equal(2000);

      // Resolve the proposal
      await proposal.resolveProposalCallback(
        proposal.target,
        publicDecryptResults.abiEncodedClearValues,
        publicDecryptResults.decryptionProof
      );

      // Verify results - choice 1 should win (2000 > 1000)
      expect(await proposal.resultsRevealed()).to.be.true;
      expect(await proposal.proposalResolved()).to.be.true;
      expect(await proposal.proposalPassed()).to.be.true;
      expect(await proposal.winningChoice()).to.equal(1); // No (choice 1)

      expect(await proposal.choiceVotes(0)).to.equal(1000);
      expect(await proposal.choiceVotes(1)).to.equal(2000);
    });
  });

  describe("Weighted Fractional Voting", function () {
    let proposal: PrivateProposal;

    beforeEach(async function () {
      const spaceId = (global as any).testSpaceId;
      const currentTime = await time.latest();
      const startTime = currentTime + PROPOSAL_CONFIG.START_OFFSET;
      const endTime = startTime + PROPOSAL_CONFIG.DURATION;

      const params: CreateProposalParamsStruct = {
        spaceId: spaceId,
        title: "Weighted Fractional Voting Test",
        bodyURI: PROPOSAL_CONFIG.BODY_URI,
        pType: 2, // WeightedFractional
        choices: ["Option A", "Option B", "Option C"],
        start: startTime,
        end: endTime,
        eligibilityType: 1, // TokenHolder
        eligibilityToken: mockToken.target,
        eligibilityThreshold: 1,
        includeAbstain: PROPOSAL_CONFIG.INCLUDE_ABSTAIN,
        passingThreshold: PROPOSAL_CONFIG.PASSING_THRESHOLD,
      };

      const tx = await factory.createProposal(params);
      const receipt = await tx.wait();
      const event = receipt!.logs.find(log => {
        try {
          return factory.interface.parseLog(log)?.name === "ProposalCreated";
        } catch {
          return false;
        }
      });
      const parsedEvent = factory.interface.parseLog(event!);
      const proposalAddress = parsedEvent!.args[2];

      proposal = await ethers.getContractAt("PrivateProposal", proposalAddress);

      // Advance time to start the proposal
      await time.increase(PROPOSAL_CONFIG.START_OFFSET + 10);
    });

    it("Should allow fractional voting with percentage splits", async function () {
      // User1 (1000 tokens) splits: 60% Option A, 30% Option B, 10% Option C
      const percentages1 = [60, 30, 10];
      const encryptedInputs1 = await fhevm.createEncryptedInput(proposal.target.toString(), user1.address);
      percentages1.forEach(p => encryptedInputs1.add32(p));
      const encryptedVote1 = await encryptedInputs1.encrypt();

      await proposal.connect(user1).voteWeightedFractional(
        encryptedVote1.handles,
        encryptedVote1.inputProof
      );

      // User2 (2000 tokens) splits: 20% Option A, 50% Option B, 30% Option C
      const percentages2 = [20, 50, 30];
      const encryptedInputs2 = await fhevm.createEncryptedInput(proposal.target.toString(), user2.address);
      percentages2.forEach(p => encryptedInputs2.add32(p));
      const encryptedVote2 = await encryptedInputs2.encrypt();

      await proposal.connect(user2).voteWeightedFractional(
        encryptedVote2.handles,
        encryptedVote2.inputProof
      );

      // Check voting status
      expect(await proposal.hasVoted(user1.address)).to.be.true;
      expect(await proposal.hasVoted(user2.address)).to.be.true;
    });

    it("Should resolve fractional voting correctly", async function () {
      // User1 (1000 tokens): 60% A, 30% B, 10% C → 60000 A, 30000 B, 10000 C
      const percentages1 = [60, 30, 10];
      const encryptedInputs1 = await fhevm.createEncryptedInput(proposal.target.toString(), user1.address);
      percentages1.forEach(p => encryptedInputs1.add32(p));
      const encryptedVote1 = await encryptedInputs1.encrypt();

      await proposal.connect(user1).voteWeightedFractional(
        encryptedVote1.handles,
        encryptedVote1.inputProof
      );

      // User2 (2000 tokens): 20% A, 50% B, 30% C → 40000 A, 100000 B, 60000 C
      const percentages2 = [20, 50, 30];
      const encryptedInputs2 = await fhevm.createEncryptedInput(proposal.target.toString(), user2.address);
      percentages2.forEach(p => encryptedInputs2.add32(p));
      const encryptedVote2 = await encryptedInputs2.encrypt();

      await proposal.connect(user2).voteWeightedFractional(
        encryptedVote2.handles,
        encryptedVote2.inputProof
      );

      // Advance time past proposal end
      await time.increase(3700);

      // Perform upkeep
      const [upkeepNeeded, performData] = await factory.checkUpkeep("0x");
      expect(upkeepNeeded).to.be.true;

      const tx = await factory.performUpkeep(performData);
      const receipt = await tx.wait();

      // Parse the TallyRevealRequested event
      const tallyRevealEvent = receipt!.logs.find((log: any) => {
        try {
          const parsed = proposal.interface.parseLog(log);
          return parsed?.name === 'TallyRevealRequested';
        } catch {
          return false;
        }
      });

      expect(tallyRevealEvent).to.not.be.undefined;
      const parsedEvent = proposal.interface.parseLog(tallyRevealEvent!);
      const choiceVoteHandles: `0x${string}`[] = parsedEvent?.args[0];

      // After fractional scaling (/100): User1: 600 A, 300 B, 100 C; User2: 400 A, 1000 B, 600 C
      const publicDecryptResults = await fhevm.publicDecrypt(choiceVoteHandles);

      const clearValue0 = publicDecryptResults.clearValues[choiceVoteHandles[0]];
      const clearValue1 = publicDecryptResults.clearValues[choiceVoteHandles[1]];
      const clearValue2 = publicDecryptResults.clearValues[choiceVoteHandles[2]];

      // After fractional scaling (/100): User1: 600 A, 300 B, 100 C; User2: 400 A, 1000 B, 600 C
      // Total: 1000 A, 1300 B, 700 C
      expect(Number(clearValue0)).to.equal(100000);
      expect(Number(clearValue1)).to.equal(130000);
      expect(Number(clearValue2)).to.equal(70000);

      // Resolve the proposal
      await proposal.resolveProposalCallback(
        proposal.target,
        publicDecryptResults.abiEncodedClearValues,
        publicDecryptResults.decryptionProof
      );

      // Verify results - Option B should win (1300 votes > 1000, 700)
      expect(await proposal.resultsRevealed()).to.be.true;
      expect(await proposal.proposalResolved()).to.be.true;
      expect(await proposal.proposalPassed()).to.be.true;
      expect(await proposal.winningChoice()).to.equal(1); // Option B (choice 1)

      expect(await proposal.choiceVotes(0)).to.equal(1000); // Option A
      expect(await proposal.choiceVotes(1)).to.equal(1300); // Option B
      expect(await proposal.choiceVotes(2)).to.equal(700);  // Option C
    });
  });

  describe("Voting with Abstain Option", function () {
    let proposal: PrivateProposal;

    beforeEach(async function () {
      const spaceId = (global as any).testSpaceId;
      const currentTime = await time.latest();
      const startTime = currentTime + PROPOSAL_CONFIG.START_OFFSET;
      const endTime = startTime + PROPOSAL_CONFIG.DURATION;

      const params: CreateProposalParamsStruct = {
        spaceId: spaceId,
        title: "Voting with Abstain Test",
        bodyURI: PROPOSAL_CONFIG.BODY_URI,
        pType: 0, // NonWeightedSingleChoice
        choices: PROPOSAL_CONFIG.CHOICES,
        start: startTime,
        end: endTime,
        eligibilityType: PROPOSAL_CONFIG.ELIGIBILITY_TYPE,
        eligibilityToken: PROPOSAL_CONFIG.ELIGIBILITY_TOKEN,
        eligibilityThreshold: PROPOSAL_CONFIG.ELIGIBILITY_THRESHOLD,
        includeAbstain: true, // Include abstain
        passingThreshold: PROPOSAL_CONFIG.PASSING_THRESHOLD,
      };

      const tx = await factory.createProposal(params);
      const receipt = await tx.wait();
      const event = receipt!.logs.find(log => {
        try {
          return factory.interface.parseLog(log)?.name === "ProposalCreated";
        } catch {
          return false;
        }
      });
      const parsedEvent = factory.interface.parseLog(event!);
      const proposalAddress = parsedEvent!.args[2];

      proposal = await ethers.getContractAt("PrivateProposal", proposalAddress);

      // Advance time to start the proposal
      await time.increase(PROPOSAL_CONFIG.START_OFFSET + 10);
    });

    it("Should include abstain as the last choice", async function () {
      const choicesLength = await proposal.choicesLength();
      expect(choicesLength).to.equal(3); // Yes, No, Abstain

      expect(await proposal.choices(0)).to.equal("Yes");
      expect(await proposal.choices(1)).to.equal("No");
      expect(await proposal.choices(2)).to.equal("Abstain");
    });

    it("Should exclude abstain votes from winner calculation", async function () {
      // User1 votes for Yes (choice 0)
      const encryptedVote1 = await fhevm
        .createEncryptedInput(proposal.target.toString(), user1.address)
        .add8(0)
        .encrypt();
      await proposal.connect(user1).voteNonweighted(encryptedVote1.handles[0], encryptedVote1.inputProof);

      // User2 votes for Abstain (choice 2)
      const encryptedVote2 = await fhevm
        .createEncryptedInput(proposal.target.toString(), user2.address)
        .add8(2)
        .encrypt();
      await proposal.connect(user2).voteNonweighted(encryptedVote2.handles[0], encryptedVote2.inputProof);

      // Advance time past proposal end
      await time.increase(3700);

      // Perform upkeep
      const [upkeepNeeded, performData] = await factory.checkUpkeep("0x");
      expect(upkeepNeeded).to.be.true;

      const tx = await factory.performUpkeep(performData);
      const receipt = await tx.wait();

      // Parse the TallyRevealRequested event
      const tallyRevealEvent = receipt!.logs.find((log: any) => {
        try {
          const parsed = proposal.interface.parseLog(log);
          return parsed?.name === 'TallyRevealRequested';
        } catch {
          return false;
        }
      });

      expect(tallyRevealEvent).to.not.be.undefined;
      const parsedEvent = proposal.interface.parseLog(tallyRevealEvent!);
      const choiceVoteHandles: `0x${string}`[] = parsedEvent?.args[0];

      // Results: 1 Yes, 0 No, 1 Abstain
      const publicDecryptResults = await fhevm.publicDecrypt(choiceVoteHandles);

      const clearValue0 = publicDecryptResults.clearValues[choiceVoteHandles[0]];
      const clearValue1 = publicDecryptResults.clearValues[choiceVoteHandles[1]];
      const clearValue2 = publicDecryptResults.clearValues[choiceVoteHandles[2]];

      // Results: 1 Yes, 0 No, 1 Abstain
      expect(Number(clearValue0)).to.equal(1);
      expect(Number(clearValue1)).to.equal(0);
      expect(Number(clearValue2)).to.equal(1);

      // Resolve the proposal
      await proposal.resolveProposalCallback(
        proposal.target,
        publicDecryptResults.abiEncodedClearValues,
        publicDecryptResults.decryptionProof
      );

      // Yes should win (only non-abstain vote)
      expect(await proposal.winningChoice()).to.equal(0);
      expect(await proposal.proposalPassed()).to.be.true;
    });
  });

  describe("Passing Threshold Logic", function () {
    let proposal: PrivateProposal;

    beforeEach(async function () {
      const spaceId = (global as any).testSpaceId;
      const currentTime = await time.latest();
      const startTime = currentTime + PROPOSAL_CONFIG.START_OFFSET;
      const endTime = startTime + PROPOSAL_CONFIG.DURATION;

      const params: CreateProposalParamsStruct = {
        spaceId: spaceId,
        title: "Threshold Test",
        bodyURI: PROPOSAL_CONFIG.BODY_URI,
        pType: 0, // NonWeightedSingleChoice
        choices: PROPOSAL_CONFIG.CHOICES,
        start: startTime,
        end: endTime,
        eligibilityType: PROPOSAL_CONFIG.ELIGIBILITY_TYPE,
        eligibilityToken: PROPOSAL_CONFIG.ELIGIBILITY_TOKEN,
        eligibilityThreshold: PROPOSAL_CONFIG.ELIGIBILITY_THRESHOLD,
        includeAbstain: PROPOSAL_CONFIG.INCLUDE_ABSTAIN,
        passingThreshold: 5000, // 50% threshold
      };

      const tx = await factory.createProposal(params);
      const receipt = await tx.wait();
      const event = receipt!.logs.find(log => {
        try {
          return factory.interface.parseLog(log)?.name === "ProposalCreated";
        } catch {
          return false;
        }
      });
      const parsedEvent = factory.interface.parseLog(event!);
      const proposalAddress = parsedEvent!.args[2];

      proposal = await ethers.getContractAt("PrivateProposal", proposalAddress);

      // Advance time to start the proposal
      await time.increase(PROPOSAL_CONFIG.START_OFFSET + 10);
    });

    it("Should handle draw correctly", async function () {
      // 2 Yes, 2 No - neither has >50% of participating votes
      const encryptedVote1 = await fhevm
        .createEncryptedInput(proposal.target.toString(), user1.address)
        .add8(0)
        .encrypt();
      await proposal.connect(user1).voteNonweighted(encryptedVote1.handles[0], encryptedVote1.inputProof);

      const encryptedVote2 = await fhevm
        .createEncryptedInput(proposal.target.toString(), user2.address)
        .add8(0)
        .encrypt();
      await proposal.connect(user2).voteNonweighted(encryptedVote2.handles[0], encryptedVote2.inputProof);

      const encryptedVote3 = await fhevm
        .createEncryptedInput(proposal.target.toString(), user3.address)
        .add8(1)
        .encrypt();
      await proposal.connect(user3).voteNonweighted(encryptedVote3.handles[0], encryptedVote3.inputProof);

      // Need one more vote for the threshold test
      const user4 = (await ethers.getSigners())[4];
      await spaceRegistry.connect(user4).joinSpace((global as any).testSpaceId);

      const encryptedVote4 = await fhevm
        .createEncryptedInput(proposal.target.toString(), user4.address)
        .add8(1)
        .encrypt();
      await proposal.connect(user4).voteNonweighted(encryptedVote4.handles[0], encryptedVote4.inputProof);

      // Advance time past proposal end
      await time.increase(3700);

      // Perform upkeep
      const [upkeepNeeded, performData] = await factory.checkUpkeep("0x");
      expect(upkeepNeeded).to.be.true;

      const tx = await factory.performUpkeep(performData);
      const receipt = await tx.wait();

      // Parse the TallyRevealRequested event
      const tallyRevealEvent = receipt!.logs.find((log: any) => {
        try {
          const parsed = proposal.interface.parseLog(log);
          return parsed?.name === 'TallyRevealRequested';
        } catch {
          return false;
        }
      });

      expect(tallyRevealEvent).to.not.be.undefined;
      const parsedEvent = proposal.interface.parseLog(tallyRevealEvent!);
      const choiceVoteHandles: `0x${string}`[] = parsedEvent?.args[0];

      // Decrypt the results
      const publicDecryptResults = await fhevm.publicDecrypt(choiceVoteHandles);

      const clearValue0 = publicDecryptResults.clearValues[choiceVoteHandles[0]];
      const clearValue1 = publicDecryptResults.clearValues[choiceVoteHandles[1]];

      // Results: 2 Yes, 2 No
      expect(Number(clearValue0)).to.equal(2);
      expect(Number(clearValue1)).to.equal(2);

      // Resolve the proposal
      await proposal.resolveProposalCallback(
        proposal.target,
        publicDecryptResults.abiEncodedClearValues,
        publicDecryptResults.decryptionProof
      );

      // Should be a draw - neither has >50% of 4 total votes
      expect(await proposal.proposalPassed()).to.be.false;
      expect(await proposal.winningChoice()).to.equal(255); // Draw sentinel value
    });
  });
});