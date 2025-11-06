import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  const { ethers } = hre;

  console.log("Deploying contracts with account:", deployer);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer)).toString());

  // ============================================
  // 1. Deploy MockUSDC (6 decimals for USDC)
  // ============================================
  const deployedMockUSDC = await deploy("MockUSDC", {
    from: deployer,
    log: true,
  });
  console.log(`✅ MockUSDC deployed at: ${deployedMockUSDC.address}`);

  // ============================================
  // 2. Deploy WheelPool (needs USDC address)
  // ============================================
  const deployedWheelPool = await deploy("WheelPool", {
    from: deployer,
    args: [deployedMockUSDC.address],
    log: true,
  });
  console.log(`✅ WheelPool deployed at: ${deployedWheelPool.address}`);

  // ============================================
  // 3. Deploy VotingFactory (Central Hub)
  // ============================================
  // Note: Oracle address is no longer needed - handled by Zama Gateway via SepoliaConfig
  const treasuryAddress = deployer; // Protocol treasury = deployer for testing
  
  const deployedFactory = await deploy("VotingFactory", {
    from: deployer,
    args: [
      treasuryAddress,              // Protocol treasury
      deployedWheelPool.address,    // WheelPool address
      deployedMockUSDC.address      // USDC token address
    ],
    log: true,
  });
  console.log(`✅ VotingFactory deployed at: ${deployedFactory.address}`);

  // ============================================
  // 5. Setup Factory (Add Initial Whitelisted Users)
  // ============================================
  const factory = await ethers.getContractAt("VotingFactory", deployedFactory.address);
  
  // Deployer is already whitelisted in constructor
  console.log(`✅ Deployer ${deployer} is whitelisted by default`);

  // Optional: Add additional whitelisted addresses for testing
  const ADDITIONAL_WHITELISTED = process.env.WHITELIST_ADDRESSES?.split(",").filter(Boolean) || [];
  if (ADDITIONAL_WHITELISTED.length > 0) {
    console.log(`Adding ${ADDITIONAL_WHITELISTED.length} additional whitelisted addresses...`);
    const whitelistTx = await factory.batchUpdateWhitelist(ADDITIONAL_WHITELISTED, true);
    await whitelistTx.wait();
    console.log(`✅ Whitelisted addresses: ${ADDITIONAL_WHITELISTED.join(", ")}`);
  }

  // ============================================
  // 6. Create Initial Test Voting (Optional)
  // ============================================
  const CREATE_TEST_VOTING = process.env.CREATE_TEST_VOTING === "true";
  
  if (CREATE_TEST_VOTING) {
    console.log("\n📝 Creating test voting...");
    
    const VOTE_DEPOSIT_AMOUNT = 10 * 10**6; // 10 USDC (6 decimals)
    const VOTING_START_TIME = Math.floor(Date.now() / 1000) + 300; // Start in 5 minutes
    const VOTING_DURATION = 20 * 60; // 20 minutes for testing
    
    const createVotingTx = await factory.createVoting(
      "Test Vote: Which option wins?",
      VOTE_DEPOSIT_AMOUNT,
      VOTING_START_TIME,
      VOTING_DURATION
    );
    const receipt = await createVotingTx.wait();
    
    // Extract voting address from VotingCreated event
    const votingCreatedEvent = receipt?.logs?.find(
      (log: any) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === "VotingCreated";
        } catch {
          return false;
        }
      }
    );
    const parsedEvent = votingCreatedEvent ? factory.interface.parseLog(votingCreatedEvent) : null;
    const testVotingAddress = parsedEvent?.args?.votingAddress;
    
    console.log(`✅ Test voting created at: ${testVotingAddress}`);
    console.log(`   Deposit Amount: ${VOTE_DEPOSIT_AMOUNT / 10**6} USDC`);
    console.log(`   Starts at: ${new Date(VOTING_START_TIME * 1000).toISOString()}`);
    console.log(`   Duration: ${VOTING_DURATION / 60} minutes`);
  }

  // ============================================
  // 7. Mint Test USDC to Deployer (Optional)
  // ============================================
  const MINT_TEST_USDC = process.env.MINT_TEST_USDC === "true";
  
  if (MINT_TEST_USDC) {
    console.log("\n💰 Minting test USDC...");
    const mockUSDC = await ethers.getContractAt("MockUSDC", deployedMockUSDC.address);
    const mintAmount = ethers.parseUnits("1000", 6); // 1000 USDC
    const mintTx = await mockUSDC.mint(deployer, mintAmount);
    await mintTx.wait();
    console.log(`✅ Minted ${ethers.formatUnits(mintAmount, 6)} USDC to ${deployer}`);
    
    const balance = await mockUSDC.balanceOf(deployer);
    console.log(`   Current balance: ${ethers.formatUnits(balance, 6)} USDC`);
  }

  // ============================================
  // 8. Deployment Summary
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log(`MockUSDC:          ${deployedMockUSDC.address}`);
  console.log(`WheelPool:         ${deployedWheelPool.address}`);
  console.log(`VotingFactory:     ${deployedFactory.address}`);
  console.log(`Protocol Treasury: ${treasuryAddress}`);
  console.log(`Deployer (Owner):  ${deployer}`);
  console.log(`Decryption:        Handled by Zama Gateway (SepoliaConfig)`);
  console.log("=".repeat(60));
  
  // ============================================
  // 9. Next Steps Instructions
  // ============================================
  console.log("\n📋 NEXT STEPS:");
  console.log("=".repeat(60));
  console.log("1. Register Chainlink Upkeep for VotingFactory:");
  console.log(`   Contract Address: ${deployedFactory.address}`);
  console.log(`   Check: factory.checkUpkeep()`);
  console.log(`   Perform: factory.performUpkeep()`);
  console.log("");
  console.log("2. Create a voting instance:");
  console.log(`   factory.createVoting(name, depositAmount, startTime, duration)`);
  console.log(`   Example: createVoting("Vote Question", 10000000, 0, 604800)`);
  console.log("");
  console.log("3. Users approve USDC spending:");
  console.log(`   usdc.approve(votingAddress, depositAmount)`);
  console.log("");
  console.log("4. Users vote (encrypted):");
  console.log(`   voting.depositVote(encryptedVote, proof)`);
  console.log(`   Options: 0=A, 1=B, 2=C`);
  console.log("");
  console.log("5. Chainlink auto-resolves after voting ends:");
  console.log(`   - Factory calls voting.performUpkeep()`);
  console.log(`   - Voting requests decryption from oracle`);
  console.log(`   - Oracle calls resolveVotingCallback()`);
  console.log(`   - Voting auto-distributes to WheelPool`);
  console.log("");
  console.log("6. Users claim rewards:");
  console.log(`   voting.claimReward()`);
  console.log("=".repeat(60));

  // ============================================
  // 10. Save Deployment Addresses to File
  // ============================================
  const fs = require("fs");
  const path = require("path");
  
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const network = await ethers.provider.getNetwork();
  
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    chainId: Number(network.chainId),
    contracts: {
      mockUSDC: deployedMockUSDC.address,
      wheelPool: deployedWheelPool.address,
      votingFactory: deployedFactory.address,
      decryptionOracle: "Handled by Zama Gateway (SepoliaConfig)",
    },
    config: {
      protocolTreasury: treasuryAddress,
      deployer: deployer,
      voteDepositAmount: "10 USDC (10000000)",
      feePercentage: "2%",
      wheelPoolPercentage: "5%",
    },
    chainlinkAutomation: {
      upkeepContract: deployedFactory.address,
      checkUpkeepFunction: "checkUpkeep(bytes)",
      performUpkeepFunction: "performUpkeep(bytes)",
    },
  };

  const outputPath = path.join(deploymentsDir, `${hre.network.name}_addresses.json`);
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to ${outputPath}`);
  
  console.log("\n✨ Deployment complete!\n");
};

export default func;
func.id = "deploy_voting_factory";
func.tags = ["VotingFactory", "MockUSDC", "WheelPool", "Complete"];