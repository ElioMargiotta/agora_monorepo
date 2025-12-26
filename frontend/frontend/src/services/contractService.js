// Smart contract interaction utilities
import { writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { config } from '@/lib/wagmi';
import privateProposalFactoryAbi from '@/abis/PrivateProposalFactory.json';
import { pinJSONToIPFS } from '@/lib/ipfs';

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_PRIVATE_PROPOSAL_FACTORY_ADDRESS || '0x2E04e1BaC41D3c56b7174aC83f17753d3cEB56F4';

/**
 * Upload proposal metadata to IPFS and create proposal on blockchain
 * @param {string} spaceId - Space ID
 * @param {string} title - Proposal title
 * @param {string} ipfsHash - IPFS hash of the proposal description
 * @param {Array<string>} choices - Voting choices
 * @param {Object} options - Additional proposal options
 * @returns {Promise<Object>} - Result with success flag and proposalId
 */
export async function uploadAndCreateProposal(spaceId, title, ipfsHash, choices, options = {}) {
  try {
    const {
      startDate,
      endDate,
      proposalType = 0,
      eligibilityType = 0,
      eligibilityToken = '0x0000000000000000000000000000000000000000',
      eligibilityThreshold = '0',
      passingThreshold = '50',
      includeAbstain = true
    } = options;

    // Calculate timestamps from dates
    const startTime = startDate ? Math.floor(new Date(startDate).getTime() / 1000) : Math.floor(Date.now() / 1000);
    const endTime = endDate ? Math.floor(new Date(endDate).getTime() / 1000) : Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // Default 7 days

    const proposalParams = {
      spaceId,
      start: BigInt(startTime),
      end: BigInt(endTime),
      eligibilityToken,
      eligibilityThreshold: BigInt(eligibilityThreshold || 0),
      passingThreshold: BigInt(Math.floor(parseFloat(passingThreshold) * 100)), // Convert to basis points
      pType: proposalType,
      eligibilityType,
      includeAbstain,
      title,
      bodyURI: ipfsHash,
      choices
    };

    // Call the smart contract
    const hash = await writeContract(config, {
      address: FACTORY_ADDRESS,
      abi: privateProposalFactoryAbi.abi,
      functionName: 'createProposal',
      args: [proposalParams]
    });

    // Wait for transaction confirmation
    const receipt = await waitForTransactionReceipt(config, {
      hash
    });

    return {
      success: true,
      txHash: receipt.transactionHash,
      proposalId: receipt.logs?.[0]?.topics?.[2] || 'unknown' // Extract proposalId from event logs
    };
  } catch (error) {
    console.error('Error creating proposal:', error);
    return {
      success: false,
      error: error.message || 'Failed to create proposal'
    };
  }
}
