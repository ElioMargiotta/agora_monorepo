'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAccount, useWalletClient, useReadContract, useContractReads } from 'wagmi';
import { ethers } from 'ethers';
import { initializeFheInstance, createEncryptedInput, decryptMultipleHandles, createEncryptedPercentages } from '@/lib/fhevm';
import { useProposalById } from '@/hooks/useSubgraph';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConnectWallet } from '@/components/wallet/ConnectWallet';
import PrivateProposalABI from '@/abis/PrivateProposal.json';
import ProposalResolve from '@/components/app/ProposalResolve';

// Helper function to format time
const formatTime = (seconds) => {
  if (seconds <= 0) return '0m';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${days > 0 ? days + 'd ' : ''}${hours > 0 ? hours + 'h ' : ''}${mins}m`;
};

export default function ProposalVotePage() {
  const params = useParams();
  const { space_name, proposal_id } = params;
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [signer, setSigner] = useState(null);
  const [fheInitialized, setFheInitialized] = useState(false);
  const [voting, setVoting] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [percentages, setPercentages] = useState({});
  const [hasVoted, setHasVoted] = useState(false);
  const [descriptionText, setDescriptionText] = useState('');
  const [descriptionLoading, setDescriptionLoading] = useState(false);

  // Function to fetch description from IPFS
  const fetchDescriptionFromIPFS = useCallback(async (ipfsUri) => {
    if (!ipfsUri) return;
    
    setDescriptionLoading(true);
    try {
      // Use Pinata gateway for fetching
      const hash = ipfsUri.replace('ipfs://', '');
      const gatewayUrl = `https://sapphire-impressive-salamander-839.mypinata.cloud/ipfs/${hash}`;
      const response = await fetch(gatewayUrl);
      if (response.ok) {
        const text = await response.text();
        setDescriptionText(text);
      } else {
        throw new Error(`Gateway response not ok: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching IPFS description:', error);
      setDescriptionText('Failed to load description from IPFS. Content may not be pinned globally.');
    } finally {
      setDescriptionLoading(false);
    }
  }, []);

  // Use proposal_id directly as bytes32 for subgraph
  const proposalIdBytes32 = proposal_id;

  const { data: proposalData, isLoading, error } = useProposalById(proposalIdBytes32);

  const proposal = proposalData?.proposalCreateds?.[0];
  const pType = proposal?.p_pType || 0;
  const eligibilityToken = proposal?.p_eligibilityToken;

  // Memoize proposal for stability
  const proposalStable = useMemo(() => proposal, [proposal]);

  // Get end time from contract
  const { data: contractEndData } = useReadContract({
    address: proposal?.proposal,
    abi: PrivateProposalABI.abi,
    functionName: 'end',
    enabled: !!proposal?.proposal
  });

  // Time calculations
  const currentTime = Math.floor(Date.now() / 1000);
  const pStart = proposal?.p_start ? Number(proposal.p_start) : 0;
  const contractEnd = contractEndData ? Number(contractEndData) : 0;
  const pEnd = contractEnd > 0 ? contractEnd : (proposal?.p_end ? Number(proposal.p_end) : 0);
  const isBeforeStart = currentTime < pStart;
  const isDuring = currentTime >= pStart && currentTime < pEnd;
  const isAfter = currentTime >= pEnd;
  const status = isBeforeStart ? 'Upcoming' : isDuring ? 'Active' : 'Ended';
  
  // Calculate timing strings
  const timeUntilStart = isBeforeStart ? formatTime(pStart - currentTime) : null;
  const timeUntilEnd = isDuring ? formatTime(pEnd - currentTime) : null;
  const timeSinceEnd = isAfter ? formatTime(currentTime - pEnd) : null;

  // Get voting power
  const { data: votingPowerData } = useReadContract({
    address: eligibilityToken,
    abi: [
      {
        "constant": true,
        "inputs": [{ "name": "account", "type": "address" }],
        "name": "getVotes",
        "outputs": [{ "name": "", "type": "uint256" }],
        "type": "function"
      }
    ],
    functionName: 'getVotes',
    args: [address],
    enabled: !!eligibilityToken && !!address && pType > 0
  });

  // Get choices length from contract
  const { data: choicesLengthData } = useReadContract({
    address: proposal?.proposal,
    abi: PrivateProposalABI.abi,
    functionName: 'choicesLength',
    enabled: !!proposal?.proposal
  });

  const choicesLength = choicesLengthData ? Number(choicesLengthData) : 0;

  // Get choices from contract
  const choicesQueries = useContractReads({
    contracts: Array.from({ length: choicesLength }, (_, index) => ({
      address: proposal?.proposal,
      abi: PrivateProposalABI.abi,
      functionName: 'choices',
      args: [index]
    })),
    enabled: !!proposal?.proposal && choicesLength > 0
  });

  const choices = choicesQueries.data ? choicesQueries.data.map((result, index) => result.result || `Choice ${index + 1}`) : [];

  // Get hasVoted status
  const { data: hasVotedData } = useReadContract({
    address: proposal?.proposal,
    abi: PrivateProposalABI.abi,
    functionName: 'hasVoted',
    args: [address],
    enabled: !!proposal?.proposal && !!address
  });

  const votingPower = pType === 0 ? 1 : (votingPowerData ? Number(votingPowerData) : 0);
  const isEligible = pType === 0 || votingPower > 0;
  const totalPercentage = Object.values(percentages).reduce((sum, val) => sum + (parseInt(val) || 0), 0);

  // Update hasVoted state
  useEffect(() => {
    if (hasVotedData !== undefined) {
      setHasVoted(hasVotedData);
    }
  }, [hasVotedData]);

  // Create signer from wallet client
  useEffect(() => {
    if (walletClient && address) {
      // Manually create an ethers provider and signer from the injected wallet (e.g., MetaMask)
      // Updated for ethers v6: use BrowserProvider instead of Web3Provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      provider.getSigner(address).then((ethersSigner) => {
        setSigner(ethersSigner);
      });
    } else {
      setSigner(null);
    }
  }, [walletClient, address]);

  // Create a public provider for read-only operations (using your Infura RPC)
  const publicProvider = useMemo(
    () => new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/73c573e5a8854465ad19e8e4e7e2e20c'),
    []
  );


  // Initialize FHE instance
  useEffect(() => {
    const initFHE = async () => {
      try {
        await initializeFheInstance();
        setFheInitialized(true);
      } catch (error) {
        console.error('FHE initialization failed:', error);
      }
    };
    initFHE();
  }, []);

  // Get proposal contract address from subgraph
  const getProposalAddress = () => {
    if (!proposal) return null;
    return proposal.proposal;
  };

  // Fetch description when proposal loads
  useEffect(() => {
    console.log('Proposal data:', proposal);
    console.log('p_bodyURI value:', proposal?.p_bodyURI);
    if (proposal?.p_bodyURI) {
      console.log('Fetching description from:', proposal.p_bodyURI);
      fetchDescriptionFromIPFS(proposal.p_bodyURI);
    } else {
      console.log('No p_bodyURI found for proposal');
    }
  }, [proposal?.p_bodyURI, fetchDescriptionFromIPFS, proposal]);

  // Vote function
  const handleVote = async (choiceIndex) => {
    console.log('handleVote called with:', { choiceIndex, pType, signer: !!signer, proposal: !!proposal });

    if (!signer || !proposal) {
      console.log('Early return - missing requirements:', { signer: !!signer, proposal: !!proposal });
      return;
    }

    setVoting(true);
    try {
      const proposalAddress = getProposalAddress();
      console.log('Proposal address:', proposalAddress);

      if (!proposalAddress) {
        throw new Error('Could not get proposal address');
      }

      let tx;
      if (pType === 0) {
        console.log('Non-weighted vote for choice:', choiceIndex);
        // Non-weighted vote - encrypt via API
        const response = await fetch('/api/encrypt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proposalAddress,
            userAddress: address,
            voteType: pType,
            choiceIndex
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Encryption failed');
        }

        const encryptedInput = await response.json();
        console.log('Encrypted input from API:', encryptedInput);
        const proposalContract = new ethers.Contract(proposalAddress, PrivateProposalABI.abi, signer);
        console.log('Calling voteNonweighted...');
        tx = await proposalContract.voteNonweighted(encryptedInput.encryptedData, encryptedInput.proof);
        console.log('Transaction sent:', tx.hash);
      } else if (pType === 1) {
        console.log('Single weighted vote for choice:', choiceIndex);
        // Single weighted vote - encrypt via API
        const response = await fetch('/api/encrypt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proposalAddress,
            userAddress: address,
            voteType: pType,
            choiceIndex
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Encryption failed');
        }

        const encryptedInput = await response.json();
        console.log('Encrypted input from API:', encryptedInput);
        const proposalContract = new ethers.Contract(proposalAddress, PrivateProposalABI.abi, signer);
        console.log('Calling voteWeightedSingle...');
        tx = await proposalContract.voteWeightedSingle(encryptedInput.encryptedData, encryptedInput.proof);
        console.log('Transaction sent:', tx.hash);
      } else if (pType === 2) {
        console.log('Fractional voting with percentages:', percentages);
        // Fractional voting - encrypt via API
        // Send percentageInputs with length exactly equal to choicesLength() from contract
        // Include percentages for all choices including abstain, ensuring they sum to 100
        const percentageArray = Array.from({ length: choicesLength }, (_, index) => percentages[index] || 0);
        console.log('Percentage array:', percentageArray, 'length:', percentageArray.length, 'expected length:', choicesLength);

        const response = await fetch('/api/encrypt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proposalAddress,
            userAddress: address,
            voteType: pType,
            percentages: percentageArray
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Encryption failed');
        }

        const encryptedPercentages = await response.json();
        console.log('Encrypted percentages from API:', encryptedPercentages);
        console.log('encryptedInputs:', encryptedPercentages.encryptedInputs);
        console.log('proof:', encryptedPercentages.proof);
        const proposalContract = new ethers.Contract(proposalAddress, PrivateProposalABI.abi, signer);
        console.log('Calling voteWeightedFractional with params:');
        console.log('  percentageInputs (bytes32[]):', encryptedPercentages.encryptedInputs);
        console.log('  inputProof (bytes):', encryptedPercentages.proof);
        tx = await proposalContract.voteWeightedFractional(encryptedPercentages.encryptedInputs, encryptedPercentages.proof);
        console.log('Transaction sent:', tx.hash);
      } else {
        throw new Error('Unsupported proposal type');
      }
      await tx.wait();

      console.log('Vote submitted successfully');
      alert('Vote submitted successfully!');
    } catch (error) {
      console.error('Voting failed:', error);
      alert('Voting failed: ' + error.message);
    } finally {
      setVoting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[#E8DCC4]/20 to-white">
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-white/80 border-[#E8DCC4]/30">
            <CardHeader>
              <CardTitle className="text-black">Connect Wallet</CardTitle>
              <CardDescription className="text-black">Please connect your wallet to vote on proposals</CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectWallet />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[#E8DCC4]/20 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-black">Loading proposal...</div>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[#E8DCC4]/20 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-black">Error loading proposal</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#E8DCC4]/20 to-white">
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-white/80 border-[#E8DCC4]/30">
          <CardHeader>
            <CardTitle className="text-black">{proposal.p_title}</CardTitle>
            <CardDescription className="text-black">
              Proposal ID: {proposal.proposalId}
            </CardDescription>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={isBeforeStart ? "secondary" : isDuring ? "default" : "secondary"} className="bg-[#4D89B0] text-white">
                {status}
              </Badge>
              <span className="text-sm text-black">
                {isBeforeStart ? `Starts in ${timeUntilStart}` : isDuring ? `Ends in ${timeUntilEnd}` : `Ended ${timeSinceEnd} ago`}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Description Section - Always visible at the top */}
              <div className="p-4 bg-[#E8DCC4]/20 rounded-lg border-l-4 border-[#4D89B0]">
                <h3 className="text-lg font-semibold mb-2 text-black">Proposal Description</h3>
                {descriptionLoading ? (
                  <p className="text-black">Loading description...</p>
                ) : descriptionText ? (
                  <div>
                    <p className="text-black whitespace-pre-wrap">{descriptionText}</p>
                    <a href={`https://sapphire-impressive-salamander-839.mypinata.cloud/ipfs/${proposal.p_bodyURI.replace('ipfs://', '')}`} target="_blank" rel="noopener noreferrer" className="text-[#4D89B0] underline text-sm mt-2 inline-block">
                      View on IPFS
                    </a>
                  </div>
                ) : proposal.p_bodyURI ? (
                  <div>
                    <p className="text-black">Description stored on IPFS:</p>
                    <a href={`https://sapphire-impressive-salamander-839.mypinata.cloud/ipfs/${proposal.p_bodyURI.replace('ipfs://', '')}`} target="_blank" rel="noopener noreferrer" className="text-[#4D89B0] underline text-sm">{proposal.p_bodyURI}</a>
                  </div>
                ) : (
                  <p className="text-black italic">No description provided for this proposal.</p>
                )}
              </div>

              <div className="p-4 bg-[#4D89B0]/10 rounded-lg">
                <p className="text-sm text-black">
                  <strong>Your Voting Power:</strong> {pType === 0 ? '1 vote' : `${votingPower} tokens`}
                </p>
              </div>            <div>
              <h3 className="text-lg font-semibold mb-2 text-black">Choices:</h3>
              <div className="space-y-4">
                {Array.from({ length: choicesLength }, (_, index) => {
                  const choiceText = choices[index] || `Choice ${index + 1}`;
                  return (
                    <div key={index}>
                      {isDuring && !hasVoted && isEligible ? (
                        pType === 2 ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="font-medium text-black">{choiceText}</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={percentages[index] || ''}
                                  onChange={(e) => {
                                    const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                    setPercentages({...percentages, [index]: val});
                                  }}
                                  className="w-16 px-2 py-1 border rounded text-center text-sm"
                                  min="0"
                                  max="100"
                                />
                                <span className="text-sm text-black">%</span>
                              </div>
                            </div>
                            <div className="relative">
                              <div 
                                className="w-full bg-[#E8DCC4]/30 rounded-full h-6 cursor-pointer relative overflow-hidden"
                                onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const clickX = e.clientX - rect.left;
                                  const percentage = Math.round((clickX / rect.width) * 100);
                                  const val = Math.max(0, Math.min(100, percentage));
                                  setPercentages({...percentages, [index]: val});
                                }}
                              >
                                <div 
                                  className="bg-[#4D89B0] h-6 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                                  style={{ width: `${percentages[index] || 0}%` }}
                                >
                                  <span className="text-white text-xs font-medium">
                                    {percentages[index] || 0}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`choice-${index}`}
                              name="vote-choice"
                              value={index}
                              onChange={() => setSelectedChoice(index)}
                              checked={selectedChoice === index}
                            />
                            <label htmlFor={`choice-${index}`}>{choiceText}</label>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center justify-between">
                          <span>{choiceText}</span>
                          {pType === 2 && percentages[index] && (
                            <span className="text-sm text-black">{percentages[index]}%</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {pType === 2 && isDuring && !hasVoted && isEligible && (
                <div className="mt-4 p-3 bg-[#E8DCC4]/10 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-black">Total Allocation:</span>
                    <span className={`font-bold ${totalPercentage === 100 ? 'text-[#4D89B0]' : 'text-red-600'}`}>
                      {totalPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-[#E8DCC4]/30 rounded-full h-3 mt-2">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        totalPercentage === 100 ? 'bg-[#4D89B0]' : totalPercentage > 100 ? 'bg-red-600' : 'bg-[#4D89B0]'
                      }`}
                      style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                    ></div>
                  </div>
                  {totalPercentage !== 100 && (
                    <p className="text-sm text-red-600 mt-1">
                      Percentages must sum to exactly 100%
                    </p>
                  )}
                </div>
              )}
            </div>

            {isBeforeStart ? (
              <div className="p-4 bg-[#E8DCC4]/20 rounded-lg">
                <p className="text-black">Voting has not started yet. You can see the options above.</p>
              </div>
            ) : isDuring ? (
              hasVoted ? (
                <div className="p-4 bg-[#4D89B0]/10 rounded-lg">
                  <p className="text-black">You have already voted.</p>
                </div>
              ) : isEligible ? (
                <Button
                  onClick={() => handleVote(pType === 2 ? null : selectedChoice)}
                  disabled={(pType !== 2 && selectedChoice === null) || (pType === 2 && totalPercentage !== 100) || voting}
                  className="w-full bg-[#4D89B0] hover:bg-[#4D89B0]/90 text-white"
                >
                  {voting ? 'Submitting Vote...' : 'Vote'}
                </Button>
              ) : (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-red-700">You are not eligible to vote.</p>
                </div>
              )
            ) : (
              <div className="mt-6">
                <ProposalResolve
                  proposal={proposalStable}
                  signer={signer}
                  fheInitialized={fheInitialized}
                  currentTime={currentTime}
                  pEnd={pEnd}
                  publicProvider={publicProvider}
                />
              </div>
            )}

            {!fheInitialized && (
              <div className="text-sm text-black">
                Preparing encryption system...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
  );
}
