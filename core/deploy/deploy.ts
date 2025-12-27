import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  const { ethers } = hre;

  console.log("Deploying contracts with account:", deployer);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer)).toString());

  // ============================================
  // 1. Deploy MockENS
  // ============================================
  const deployedMockENS = await deploy("MockENS", {
    from: deployer,
    log: true,
  });
  console.log(`✅ MockENS deployed at: ${deployedMockENS.address}`);

  // Wait for confirmations before verifying (use delay since waitForTransaction not available in Hardhat)
  console.log("⏳ Waiting 10 seconds for confirmations...");
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Verify MockENS
  try {
    await hre.run("verify:verify", {
      address: deployedMockENS.address,
      constructorArguments: [],
    });
    console.log(`✅ MockENS verified`);
  } catch (error) {
    console.log(`❌ MockENS verification failed: ${error}`);
  }

  // ============================================
  // 2. Deploy SpaceRegistry (needs MockENS address)
  // ============================================
  const deployedSpaceRegistry = await deploy("SpaceRegistry", {
    from: deployer,
    args: [deployedMockENS.address],
    log: true,
  });
  console.log(`✅ SpaceRegistry deployed at: ${deployedSpaceRegistry.address}`);

  // Wait for confirmations
  console.log("⏳ Waiting 10 seconds for confirmations...");
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Verify SpaceRegistry
  try {
    await hre.run("verify:verify", {
      address: deployedSpaceRegistry.address,
      constructorArguments: [deployedMockENS.address],
    });
    console.log(`✅ SpaceRegistry verified`);
  } catch (error) {
    console.log(`❌ SpaceRegistry verification failed: ${error}`);
  }

  // ============================================
  // 3. Deploy ProposalAutomation Library
  // ============================================
  const deployedProposalAutomation = await deploy("ProposalAutomation", {
    from: deployer,
    log: true,
  });
  console.log(`✅ ProposalAutomation deployed at: ${deployedProposalAutomation.address}`);

  // Libraries don't need verification typically

  // ============================================
  // 4. Deploy PrivateProposalFactory (needs SpaceRegistry)
  // ============================================
  const deployedPrivateProposalFactory = await deploy("PrivateProposalFactory", {
    from: deployer,
    args: [deployedSpaceRegistry.address],
    libraries: {
      ProposalAutomation: deployedProposalAutomation.address,
    },
    log: true,
  });
  console.log(`✅ PrivateProposalFactory deployed at: ${deployedPrivateProposalFactory.address}`);

  // Wait for confirmations
  console.log("⏳ Waiting 10 seconds for confirmations...");
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Verify PrivateProposalFactory
  try {
    await hre.run("verify:verify", {
      address: deployedPrivateProposalFactory.address,
      constructorArguments: [deployedSpaceRegistry.address],
      libraries: {
        ProposalAutomation: deployedProposalAutomation.address,
      },
    });
    console.log(`✅ PrivateProposalFactory verified`);
  } catch (error) {
    console.log(`❌ PrivateProposalFactory verification failed: ${error}`);
  }

  // ============================================
  // 5. Deploy MockGovernanceToken
  // ============================================
  const deployedMockGovernanceToken = await deploy("MockGovernanceToken", {
    from: deployer,
    log: true,
  });
  console.log(`✅ MockGovernanceToken deployed at: ${deployedMockGovernanceToken.address}`);

  // Wait for confirmations
  console.log("⏳ Waiting 10 seconds for confirmations...");
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Verify MockGovernanceToken
  try {
    await hre.run("verify:verify", {
      address: deployedMockGovernanceToken.address,
      constructorArguments: [],
    });
    console.log(`✅ MockGovernanceToken verified`);
  } catch (error) {
    console.log(`❌ MockGovernanceToken verification failed: ${error}`);
  }

  // ============================================
  // 6. Deploy MockUSDC (for Prediction Markets)
  // ============================================
  const deployedMockUSDC = await deploy("MockUSDC", {
    from: deployer,
    log: true,
  });
  console.log(`✅ MockUSDC deployed at: ${deployedMockUSDC.address}`);

  // Wait for confirmations
  console.log("⏳ Waiting 10 seconds for confirmations...");
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Verify MockUSDC
  try {
    await hre.run("verify:verify", {
      address: deployedMockUSDC.address,
      constructorArguments: [],
    });
    console.log(`✅ MockUSDC verified`);
  } catch (error) {
    console.log(`❌ MockUSDC verification failed: ${error}`);
  }

  // ============================================
  // Deployment Complete
  // ============================================
  console.log("\n🎉 All contracts deployed successfully!");
  console.log(`MockENS: ${deployedMockENS.address}`);
  console.log(`SpaceRegistry: ${deployedSpaceRegistry.address}`);
  console.log(`ProposalAutomation: ${deployedProposalAutomation.address}`);
  console.log(`PrivateProposalFactory: ${deployedPrivateProposalFactory.address}`);
  console.log(`MockGovernanceToken: ${deployedMockGovernanceToken.address}`);
  console.log(`MockUSDC: ${deployedMockUSDC.address}`);
};

export default func;
func.id = "deploy_Agora_Contracts";
func.tags = ["MockENS", "SpaceRegistry", "ProposalAutomation", "PrivateProposalFactory", "MockGovernanceToken", "MockUSDC", "Complete"];