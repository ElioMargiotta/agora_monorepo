"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useReadContract } from 'wagmi';
import { ethers } from 'ethers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Vote } from 'lucide-react';
import { useSpaceByEns, useProposalById } from '@/hooks/useSubgraph';
import PrivateProposalAbi from '@/abis/PrivateProposal.json';
import SpaceRegistryAbi from '@/abis/SpaceRegistry.json';
import { initializeFheInstance, createEncryptedInput } from '@/lib/fhe';

export default function ProposalPage() {
  const params = useParams();
  const spaceName = params.space_name;
  const proposalId = params.proposal_id;
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [selectedOption, setSelectedOption] = useState(null);
  const [votingLoading, setVotingLoading] = useState(false);

  // Wagmi hooks for voting
  const { writeContract, data: voteTxHash, isPending: votePending, error: voteError } = useWriteContract();
  const { isLoading: voteConfirming, isSuccess: voteSuccess } = useWaitForTransactionReceipt({
    hash: voteTxHash,
  });

  // Zama SDK state
  const [status, setStatus] = useState("Initializing...");
  const [instance, setInstance] = useState(null);

  // Fetch space
  const { data: spaceData, isLoading: spaceLoading, error: spaceError } = useSpaceByEns(spaceName);
  const space = spaceData?.spaces?.[0];

  // Fetch proposal
  const { data: proposalData, isLoading: proposalLoading, error: proposalError } = useProposalById(proposalId);
  const proposal = proposalData?.proposalCreateds?.[0];

  // Check if user has already voted
  const { data: hasVoted } = useReadContract({
    address: proposal?.proposal,
    abi: PrivateProposalAbi.abi,
    functionName: 'hasVoted',
    args: [address],
  });

  // Check eligibility
  const { data: balance } = useReadContract({
    address: proposal?.p_eligibilityToken,
    abi: [
      {
        inputs: [{ internalType: "address", name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "balanceOf",
    args: [address],
  });

  // Space registry address (hardcode or fetch)
  const spaceRegistryAddress = '0xb8c859bC79E04cA5E729fF1B371627710682f3bC'; // Replace with actual address

  // Check space membership
  const { data: isSpaceMember } = useReadContract({
    address: spaceRegistryAddress,
    abi: SpaceRegistryAbi.abi,
    functionName: 'spaceMembers',
    args: [space?.spaceId, address],
    enabled: !!space?.spaceId && !!address,
  });

  // Check NFT balance if eligibility is 'nft'
  const { data: nftBalance } = useReadContract({
    address: proposal?.p_eligibilityToken,
    abi: [
      {
        inputs: [{ internalType: "address", name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "balanceOf",
    args: [address],
    enabled: proposal?.p_eligibilityType === 'nft',
  });

  // Check whitelist if eligibility is 'whitelist'
  const { data: isWhitelisted } = useReadContract({
    address: proposal?.proposal,
    abi: PrivateProposalAbi.abi,
    functionName: 'whitelistedVoters',
    args: [address],
    enabled: proposal?.p_eligibilityType === 'whitelist',
  });

  // === Initialize the Zama SDK ===
    useEffect(() => {
    const initZama = async () => {
      try {
        setStatus("🔄 Loading Zama FHE SDK...");
        
        // Load the UMD script
        const script = document.createElement('script');
        script.src = 'https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs';
        script.onload = async () => {
          try {
            setStatus("🔄 Initializing FHE instance...");
            const instance = await initializeFheInstance();
            setInstance(instance);
            setStatus("✅ SDK initialized successfully");
          } catch (err) {
            console.error("❌ Zama Init Error:", err);
            setStatus(`❌ ${err.message}`);
          }
        };
        script.onerror = () => {
          setStatus("❌ Failed to load SDK");
        };
        document.head.appendChild(script);
      } catch (err) {
        console.error("❌ Zama Init Error:", err);
        setStatus(`❌ ${err.message}`);
      }
    };

    initZama();
  }, []);

  // Handle vote transaction states
  useEffect(() => {
    if (voteSuccess) {
      setStatus("✅ Vote submitted successfully!");
      alert("Your encrypted vote has been submitted successfully!");
      setSelectedOption(null);
      setVotingLoading(false);
    }
    if (voteError) {
      setStatus(`❌ Vote failed: ${voteError.message}`);
      alert("Voting failed: " + voteError.message);
      setVotingLoading(false);
    }
  }, [voteSuccess, voteError]);

  const handleVote = async () => {
    if (chainId !== 11155111) {
      alert("Please switch to Sepolia network to vote.");
      return;
    }
    if (!instance) {
      alert("Zama SDK not ready yet. Please wait for initialization.");
      return;
    }
    if (selectedOption === null || selectedOption === undefined || !proposal) return;

    if (proposal.p_pType !== 0) { // 0 for NonWeightedSingleChoice
      alert('This proposal type is not supported for voting yet.');
      return;
    }

    setVotingLoading(true);
    try {
      setStatus("Encrypting your vote...");

      // Get the proposal contract address from subgraph data
      const proposalContractAddress = proposal.proposal;

      // Create encrypted input for the vote
      const ciphertexts = await createEncryptedInput(proposalContractAddress, address, selectedOption);
      console.log('Ciphertexts:', ciphertexts); // For debugging

      setStatus("Submitting encrypted vote...");

      // Submit the encrypted vote using wagmi
      const encryptedBytes = ethers.getBytes(ciphertexts.encryptedData);
      console.log('Encrypted bytes:', encryptedBytes);
      console.log('Proof:', ciphertexts.proof);
      writeContract({
        address: proposalContractAddress,
        abi: PrivateProposalAbi.abi,
        functionName: 'vote',
        args: [encryptedBytes, ciphertexts.proof],
        chainId: 11155111,
      });

      setStatus("Vote transaction submitted. Waiting for confirmation...");
      setVotingLoading(false);
    } catch (error) {
      console.error("Voting failed:", error);
      setStatus(`❌ Vote failed: ${error.message}`);
      alert("Voting failed: " + error.message);
      setVotingLoading(false);
    }
  };

  const isLoading = spaceLoading || proposalLoading;
  const hasError = spaceError || proposalError || !space || !proposal;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (hasError) {
    let errorMessage = "An error occurred.";
    if (!space) {
      errorMessage = "Space not found.";
    } else if (!proposal) {
      errorMessage = "Proposal not found.";
    } else if (spaceError) {
      errorMessage = "Error loading space: " + spaceError.message;
    } else if (proposalError) {
      errorMessage = "Error loading proposal: " + proposalError.message;
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const now = Date.now() / 1000;
  const isActive = now >= Number(proposal.p_start) && now <= Number(proposal.p_end);
  const isEligible = (() => {
    if (proposal?.p_eligibilityType === 'token') {
      return balance && ethers.BigNumber.from(balance).gte(ethers.BigNumber.from(proposal.p_eligibilityThreshold));
    } else if (proposal?.p_eligibilityType === 'nft') {
      return nftBalance && ethers.BigNumber.from(nftBalance).gte(ethers.BigNumber.from(proposal.p_eligibilityThreshold));
    } else if (proposal?.p_eligibilityType === 'whitelist') {
      return isWhitelisted;
    }
    return true; // Open eligibility
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Proposal Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl">{proposal.p_title}</CardTitle>
                  <CardDescription className="text-lg">
                    In space: {space.displayName} ({space.ensName})
                  </CardDescription>
                </div>
                <Badge variant={isActive ? "default" : "secondary"}>
                  {isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Timing</h4>
                  <p className="text-sm">
                    Start: {new Date(Number(proposal.p_start) * 1000).toLocaleString()}
                  </p>
                  <p className="text-sm">
                    End: {new Date(Number(proposal.p_end) * 1000).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Eligibility</h4>
                  <p className="text-sm">
                    Type: {proposal.p_eligibilityType}
                  </p>
                  <p className="text-sm">
                    Token: {proposal.p_eligibilityToken}
                  </p>
                  <p className="text-sm">
                    Threshold: {proposal.p_eligibilityThreshold.toString()}
                  </p>
                  <p className="text-sm">
                    Proposal Type: {proposal.p_pType}
                  </p>
                </div>
              </div>
              {proposal.p_bodyURI && (
                <div className="mt-4">
                  <h4 className="font-semibold">Body URI</h4>
                  <a href={proposal.p_bodyURI} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    {proposal.p_bodyURI}
                  </a>
                </div>
              )}
              {proposal.p_discussionURI && (
                <div className="mt-4">
                  <h4 className="font-semibold">Discussion URI</h4>
                  <a href={proposal.p_discussionURI} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    {proposal.p_discussionURI}
                  </a>
                </div>
              )}
              <div className="mt-4">
                <h4 className="font-semibold">Creator</h4>
                <p className="text-sm font-mono">{proposal.p_creator}</p>
              </div>
            </CardContent>
          </Card>

          {/* Voting Section */}
          <Card>
            <CardHeader>
              <CardTitle>Vote on this Proposal</CardTitle>
              <CardDescription>
                Select an option and submit your encrypted vote.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Zama SDK Status */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${instance ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <p className="text-sm font-medium">{status}</p>
                </div>
              </div>

              {!isConnected ? (
                <Alert>
                  <AlertDescription>Please connect your wallet to vote.</AlertDescription>
                </Alert>
              ) : chainId !== 11155111 ? (
                <Alert>
                  <AlertDescription>Please switch to Sepolia network to vote on this proposal.</AlertDescription>
                </Alert>
              ) : !instance ? (
                <Alert variant="secondary">
                  <AlertDescription>Initializing secure voting system...</AlertDescription>
                </Alert>
              ) : hasVoted ? (
                <Alert variant="secondary">
                  <AlertDescription>You have already voted on this proposal.</AlertDescription>
                </Alert>
              ) : !isSpaceMember ? (
                <Alert variant="destructive">
                  <AlertDescription>You are not a member of this space and cannot vote.</AlertDescription>
                </Alert>
              ) : proposal.p_pType !== 0 ? (
                <Alert variant="destructive">
                  <AlertDescription>This proposal type is not supported for voting.</AlertDescription>
                </Alert>
              ) : !isEligible ? (
                <Alert variant="secondary">
                  <AlertDescription>You are not eligible to vote on this proposal.</AlertDescription>
                </Alert>
              ) : !isActive ? (
                <Alert variant="secondary">
                  <AlertDescription>This proposal is not currently active for voting.</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Options ({proposal.p_choices.length})</h4>
                    {proposal.p_choices.map((choice, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2">
                        <input
                          type="radio"
                          name="option"
                          value={index}
                          checked={selectedOption === index}
                          onChange={() => setSelectedOption(index)}
                          className="w-4 h-4"
                        />
                        <label className="text-sm">{choice}</label>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleVote}
                      disabled={selectedOption === null || selectedOption === undefined || votingLoading || votePending || !instance || hasVoted || !isEligible || !isSpaceMember || proposal.p_pType !== 0}
                      className="flex items-center gap-2"
                    >
                      <Vote className="h-4 w-4" />
                      {votePending ? 'Confirming Vote...' : votingLoading ? 'Encrypting Vote...' : 'Submit Encrypted Vote'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
