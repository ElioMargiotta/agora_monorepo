import { task } from "hardhat/config";
import { ethers } from "ethers";

task("proposal", "Deploy a proposal on Sepolia testxnet", async (_taskArgs, hre) => {
  const { deployer } = await hre.getNamedAccounts();
  const { ethers: hreEthers } = hre;
  const { fhevm } = hre;

  await fhevm.initializeCLIApi();

  console.log("Deploying proposal with account:", deployer);

  // Hardcoded contract addresses
  const mockENSAddress = "0x4a8BbdC602E18759E1961a886F6e3D7aA2a75Bb4";
  const spaceRegistryAddress = "0x96eEFbc1452F9324a7422399c5149b8a7f011fb1";
  const privateProposalFactoryAddress = "0x2AA5bd99fBa98c765060D7A4A2E4896860B72c37";

  const mockENS = await hreEthers.getContractAt("MockENS", mockENSAddress);
  const spaceRegistry = await hreEthers.getContractAt("SpaceRegistry", spaceRegistryAddress);
  const privateProposalFactory = await hreEthers.getContractAt("PrivateProposalFactory", privateProposalFactoryAddress);

  // ============================================
  // 1. Register ENS: testx.agora
  // ============================================
  console.log("Registering ENS: testx.agora");

  // Set deployer as owner of testx.agora node
  const testxAgoraNode = ethers.namehash("testx.agora");
  const ensTx = await mockENS.setNodeOwner(testxAgoraNode, deployer);
  await ensTx.wait();
  console.log("✅ Registered 'testx.agora' domain");

  // ============================================
  // 2. Register a space
  // ============================================
  console.log("Creating space for testx.agora");

  const spaceTx = await spaceRegistry.createSpace(
    "testx.agora", // ensName
    "testx Agora Space", // displayName
    0, // MembershipType.Public
    ethers.ZeroAddress, // criteriaContract
    0 // criteriaAmount
  );
  await spaceTx.wait();
  console.log("✅ Space created");

  // Get spaceId
  const spaceId = ethers.keccak256(ethers.toUtf8Bytes("testx.agora"));
  console.log("Space ID:", spaceId);

  // ============================================
  // 3. Create a proposal
  // ============================================
  console.log("Creating proposal in the space");

  const now = Math.floor(Date.now() / 1000);
  const start = now + 60; // Start in 1 minute
  const end = start + 3600; // End in 1 hour

  const proposalParams = {
    spaceId: spaceId,
    start: start,
    end: end,
    eligibilityToken: ethers.ZeroAddress, // Public
    eligibilityThreshold: 0,
    passingThreshold: 5000, // 50%
    pType: 0, // NonWeightedSingleChoice
    eligibilityType: 0, // Public
    includeAbstain: true,
    predictionMarketEnabled: false, // Set to true to enable prediction market
    predictionToken: ethers.ZeroAddress, // Set to MockUSDC address if prediction market enabled
    title: "testx Proposal",
    bodyURI: "https://example.com/proposal",
    choices: ["Yes", "No"]
  };

  const createTx = await privateProposalFactory.createProposal(proposalParams);
  const receipt = await createTx.wait(5); // Wait for 5 confirmations
  console.log("✅ Proposal created");

  // Extract proposal address from event
  const proposalCreatedEvent = receipt.logs.find(log => log.eventName === "ProposalCreated");
  const proposalAddress = proposalCreatedEvent.args.proposal;
  const proposalId = proposalCreatedEvent.args.proposalId;

  console.log("Proposal Address:", proposalAddress);
  console.log("Proposal ID:", proposalId);

  // ============================================
  // 4. Verify the proposal contract (if possible)
  // ============================================
  console.log("⏳ Waiting 30 seconds for bytecode propagation...");
  await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds for Etherscan to index

  try {
    await hre.run("verify:verify", {
      address: proposalAddress,
      constructorArguments: [proposalParams, spaceRegistryAddress],
    });
    console.log("✅ Proposal verified");
  } catch (error) {
    console.log(`❌ Proposal verification failed: ${error}`);
  }

  console.log("\n🎉 Proposal deployment complete!");
  console.log(`ENS: testx.agora`);
  console.log(`Space ID: ${spaceId}`);
  console.log(`Proposal Address: ${proposalAddress}`);
  console.log(`Proposal ID: ${proposalId}`);
});