'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAccount, useWalletClient, useReadContract, useContractReads } from 'wagmi';
import { ethers } from 'ethers';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { initializeFheInstance, createEncryptedInput, decryptMultipleHandles, createEncryptedPercentages } from '@/lib/fhevm';
import { useProposalById, useAdminSpaceIds, useMemberSpaceIds, useSpaceByEns } from '@/hooks/useSubgraph';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConnectWallet } from '@/components/wallet/ConnectWallet';
import PrivateProposalABI from '@/abis/PrivateProposal.json';
import ProposalResolve from '@/components/app/ProposalResolve';
import { CheckCircle, Loader2 } from 'lucide-react';
import { SepoliaNetworkGuard } from '@/components/ui/SepoliaNetworkGuard';

// Helper function to format time
const formatTime = (seconds) => {
  if (seconds <= 0) return '00:00';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  } else if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  } else {
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
};

// Reusable markdown component with consistent styling
const MarkdownContent = ({ content }) => (
  <div className="prose prose-sm max-w-none">
    <ReactMarkdown
      rehypePlugins={[rehypeRaw]}
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({node, ...props}) => <h1 className="text-3xl font-bold mb-4 mt-6" {...props} />,
        h2: ({node, ...props}) => <h2 className="text-2xl font-bold mb-3 mt-5" {...props} />,
        h3: ({node, ...props}) => <h3 className="text-xl font-semibold mb-2 mt-4" {...props} />,
        h4: ({node, ...props}) => <h4 className="text-lg font-semibold mb-2 mt-3" {...props} />,
        p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
        a: ({node, ...props}) => <a className="text-[#4D89B0] underline hover:text-[#4D89B0]/80" target="_blank" rel="noopener noreferrer" {...props} />,
        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1" {...props} />,
        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />,
        li: ({node, ...props}) => <li className="ml-4" {...props} />,
        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[#4D89B0] pl-4 italic my-4" {...props} />,
        code: ({node, inline, ...props}) => 
          inline 
            ? <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props} />
            : <code className="block bg-gray-100 p-3 rounded text-sm font-mono overflow-x-auto my-3" {...props} />,
        img: ({node, src, alt, ...props}) => {
          // Don't render if no src
          if (!src) return null;
          
          // Convert IPFS URLs to gateway URLs
          let imageUrl = src;
          if (src.startsWith('ipfs://')) {
            imageUrl = `https://sapphire-impressive-salamander-839.mypinata.cloud/ipfs/${src.replace('ipfs://', '')}`;
          } else if (src.startsWith('data:')) {
            // Use regular img tag for data URLs (legacy support)
            return (
              <span className="inline-block my-2 max-w-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={src} 
                  alt={alt || 'Uploaded image'} 
                  className="max-w-full h-auto rounded shadow-sm border border-gray-200" 
                  onError={(e) => {
                    console.error('Image load error:', src?.substring(0, 50));
                    e.target.style.display = 'none';
                  }}
                />
              </span>
            );
          }
          
          return (
            <span className="inline-block my-2 max-w-md">
              <Image 
                src={imageUrl} 
                alt={alt || 'Image'} 
                width={400} 
                height={300} 
                className="rounded w-full h-auto shadow-sm border border-gray-200" 
                unoptimized 
                onError={(e) => {
                  console.error('Image load error:', imageUrl);
                }}
              />
            </span>
          );
        },
        table: ({node, ...props}) => <table className="border-collapse border border-gray-300 my-4" {...props} />,
        th: ({node, ...props}) => <th className="border border-gray-300 px-4 py-2 bg-gray-100" {...props} />,
        td: ({node, ...props}) => <td className="border border-gray-300 px-4 py-2" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
);

export default function ProposalVotePage() {
  const params = useParams();
  const { space_name, proposal_id } = params;
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [signer, setSigner] = useState(null);
  const [fheInitialized, setFheInitialized] = useState(false);
  const [voting, setVoting] = useState(false);
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [percentages, setPercentages] = useState({});
  const [hasVoted, setHasVoted] = useState(false);
  const [descriptionText, setDescriptionText] = useState('');
  const [descriptionLoading, setDescriptionLoading] = useState(false);
  const [voteMessage, setVoteMessage] = useState('');
  const [voteMessageType, setVoteMessageType] = useState(''); // 'success' or 'error'
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Update current time every second for live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
        // Try to parse as JSON to extract description field
        try {
          const json = JSON.parse(text);
          if (json.description) {
            setDescriptionText(json.description);
          } else {
            setDescriptionText(text);
          }
        } catch (parseError) {
          // If not JSON, use the text as is
          setDescriptionText(text);
        }
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
  const { data: adminSpaceIdsData, isLoading: adminSpaceIdsLoading, error: adminSpaceIdsError } = useAdminSpaceIds(address, isConnected);
  const { data: memberSpaceIdsData, isLoading: memberSpaceIdsLoading, error: memberSpaceIdsError } = useMemberSpaceIds(address, isConnected);
  const { data: spaceData, isLoading: spaceLoading, error: spaceError } = useSpaceByEns(space_name);

  const proposal = proposalData?.proposalCreateds?.[0];
  const pType = proposal?.p_pType || 0;
  const eligibilityToken = proposal?.p_eligibilityToken;

  // Set isOwner when we have space data
  useEffect(() => {
    if (!spaceData?.spaces?.[0]) return;
    setIsOwner(spaceData.spaces[0].owner.toLowerCase() === address?.toLowerCase());
  }, [spaceData, address]);

  // Set isAdmin when we have space data and admin event data
  useEffect(() => {
    if (!spaceData?.spaces?.[0] || !adminSpaceIdsData?.adminAddeds) return;
    const spaceId = spaceData.spaces[0].spaceId;
    const isAdminNow = adminSpaceIdsData.adminAddeds.some(a => a.spaceId === spaceId);
    setIsAdmin(isAdminNow);
  }, [spaceData, adminSpaceIdsData]);

  // Set isMember when we have space data and member space IDs
  useEffect(() => {
    if (!spaceData?.spaces?.[0] || !memberSpaceIdsData?.memberJoineds) return;
    const spaceId = spaceData.spaces[0].spaceId;
    const isMemberNow = memberSpaceIdsData.memberJoineds.some(m => m.spaceId === spaceId);
    setIsMember(isMemberNow);
  }, [spaceData, memberSpaceIdsData]);

  // Memoize proposal for stability
  const proposalStable = useMemo(() => proposal, [proposal]);

  // Get end time from contract
  const { data: contractEndData } = useReadContract({
    address: proposal?.proposal,
    abi: PrivateProposalABI.abi,
    functionName: 'end',
    enabled: !!proposal?.proposal
  });

  // Get passing threshold from contract
  const { data: thresholdData } = useReadContract({
    address: proposal?.proposal,
    abi: PrivateProposalABI.abi,
    functionName: 'passingThreshold',
    enabled: !!proposal?.proposal
  });

  // Time calculations
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

  // Determine current state
  const getCurrentState = () => {
    if (isLoading || spaceLoading || !proposal) return 'loading';
    if (isBeforeStart) return 'upcoming';
    if (isDuring) return 'voting';
    return 'ended';
  };

  const currentState = getCurrentState();

  // Check tally reveal status periodically
  const { data: tallyRevealedData } = useReadContract({
    address: proposal?.proposal,
    abi: PrivateProposalABI.abi,
    functionName: 'resultsRevealed',
    enabled: !!proposal?.proposal && currentState === 'ended'
  });

  const { data: proposalResolvedData } = useReadContract({
    address: proposal?.proposal,
    abi: PrivateProposalABI.abi,
    functionName: 'proposalResolved',
    enabled: !!proposal?.proposal && currentState === 'ended'
  });

  // State for tally reveal status
  const [tallyRevealed, setTallyRevealed] = useState(false);
  const [proposalResolved, setProposalResolved] = useState(false);
  const [tallyRevealRequested, setTallyRevealRequested] = useState(false);
  const [resolvedResults, setResolvedResults] = useState(null);

  // Update tally reveal state
  useEffect(() => {
    if (tallyRevealedData !== undefined) {
      setTallyRevealed(tallyRevealedData);
    }
  }, [tallyRevealedData]);

  // For debugging - check if proposal should be resolved
  const secondsSinceEnd = currentState === 'ended' ? currentTime - pEnd : 0;
  const shouldBeResolvable = currentState === 'ended' && secondsSinceEnd > 300; // 5 minutes after end

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

  const choices = choicesQueries.data ? choicesQueries.data.map((result, index) => {
    if (proposal?.p_abstain && index === choicesLength - 1) {
      return "Abstain";
    }
    return result.result || `Choice ${index + 1}`;
  }) : [];

  // Get hasVoted status
  const { data: hasVotedData } = useReadContract({
    address: proposal?.proposal,
    abi: PrivateProposalABI.abi,
    functionName: 'hasVoted',
    args: [address],
    enabled: !!proposal?.proposal && !!address
  });

  const votingPower = pType === 0 ? 1 : (votingPowerData ? Number(votingPowerData) : 0);
  const isEligible = (pType === 0 || votingPower > 0) && (isMember || isAdmin || isOwner);
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
    () => new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL),
    []
  );

  // Fetch resolved results when proposal is resolved
  const fetchResolvedResults = useCallback(async () => {
    if (!proposal?.proposal || !publicProvider) return;

    try {
      const proposalContract = new ethers.Contract(proposal.proposal, PrivateProposalABI.abi, publicProvider);
      
      const [voteCounts, winningChoice, passed, threshold] = await Promise.all([
        proposalContract.getVotePercentages(),
        proposalContract.winningChoice(),
        proposalContract.proposalPassed(),
        proposalContract.passingThreshold(),
      ]);

      const voteCountsBig = voteCounts.map(c => BigInt(c.toString()));
      const totalVotes = voteCountsBig.reduce((sum, count) => sum + count, 0n);
      const percentages = voteCountsBig.map(count =>
        totalVotes > 0n ? Number((count * 100n) / totalVotes) : 0
      );

      setResolvedResults({
        percentages: percentages.map(p => p.toString()),
        winningChoice: winningChoice.toString(),
        passed,
        threshold: threshold.toString(),
      });
    } catch (error) {
      console.error('Failed to fetch resolved results:', error);
    }
  }, [proposal?.proposal, publicProvider]);

  // Update proposal resolved state
  useEffect(() => {
    if (proposalResolvedData !== undefined) {
      setProposalResolved(proposalResolvedData);
    }
  }, [proposalResolvedData]);

  // Fetch resolved results when proposal is resolved and results not yet fetched
  useEffect(() => {
    if (proposalResolved && !resolvedResults) {
      fetchResolvedResults();
    }
  }, [proposalResolved, resolvedResults, fetchResolvedResults]);

  // Poll for tally reveal status every 30 seconds when ended
  useEffect(() => {
    if (currentState !== 'ended') return;

    const checkTallyRevealEvent = async () => {
      if (!proposal?.proposal || !publicProvider) return;
      
      try {
        const contract = new ethers.Contract(proposal.proposal, PrivateProposalABI.abi, publicProvider);
        const filter = contract.filters.TallyRevealRequested();
        const events = await contract.queryFilter(filter);
        
        if (events.length > 0) {
          setTallyRevealRequested(true);
        }
      } catch (error) {
        console.error('Error checking tally reveal event:', error);
      }
    };

    // Check immediately
    checkTallyRevealEvent();

    const interval = setInterval(() => {
      checkTallyRevealEvent();
      // The useReadContract hooks will automatically refetch when enabled
      // We just need to trigger re-renders by updating a dummy state
      setCurrentTime(prev => prev + 1);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [currentState, proposal?.proposal, publicProvider]);


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
    if (proposal?.p_bodyURI) {
      fetchDescriptionFromIPFS(proposal.p_bodyURI);
    }
  }, [proposal?.p_bodyURI, fetchDescriptionFromIPFS, proposal]);

  // Vote function
  const handleVote = async (choiceIndex) => {
    if (!signer || !proposal) {
      return;
    }

    setVoting(true);
    setVoteMessage('');
    setVoteMessageType('');

    try {
      const proposalAddress = getProposalAddress();

      if (!proposalAddress) {
        throw new Error('Could not get proposal address');
      }

      let tx;
      if (pType === 0) {
        // Non-weighted vote - encrypt client-side
        const encryptedInput = await createEncryptedInput(proposalAddress, address, choiceIndex);
        const proposalContract = new ethers.Contract(proposalAddress, PrivateProposalABI.abi, signer);
        tx = await proposalContract.voteNonweighted(encryptedInput.encryptedData, encryptedInput.proof);
      } else if (pType === 1) {
        // Single weighted vote - encrypt client-side
        const encryptedInput = await createEncryptedInput(proposalAddress, address, choiceIndex);
        const proposalContract = new ethers.Contract(proposalAddress, PrivateProposalABI.abi, signer);
        tx = await proposalContract.voteWeightedSingle(encryptedInput.encryptedData, encryptedInput.proof);
      } else if (pType === 2) {
        // Fractional voting - encrypt client-side
        // Send percentageInputs with length exactly equal to choicesLength() from contract
        // Include percentages for all choices including abstain, ensuring they sum to 100
        const percentageArray = Array.from({ length: choicesLength }, (_, index) => percentages[index] || 0);

        const encryptedPercentages = await createEncryptedPercentages(proposalAddress, address, percentageArray);
        const proposalContract = new ethers.Contract(proposalAddress, PrivateProposalABI.abi, signer);
        tx = await proposalContract.voteWeightedFractional(encryptedPercentages.encryptedInputs, encryptedPercentages.proof);
      } else {
        throw new Error('Unsupported proposal type');
      }
      await tx.wait();

      setVoteMessage('Vote submitted successfully!');
      setVoteMessageType('success');
      
      // Refresh the page after successful vote
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setVoteMessage('Voting failed: ' + error.message);
      setVoteMessageType('error');
    } finally {
      setVoting(false);
    }
  };

  if (!isConnected) {
    return (
      <SepoliaNetworkGuard>
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
      </SepoliaNetworkGuard>
    );
  }

  if (currentState === 'loading') {
    return (
      <SepoliaNetworkGuard>
        <div className="min-h-screen bg-gradient-to-br from-white via-[#E8DCC4]/20 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4D89B0] mx-auto mb-4"></div>
            <p className="text-black text-lg">Loading proposal...</p>
          </div>
        </div>
      </SepoliaNetworkGuard>
    );
  }

  if (error || spaceError || !proposal) {
    return (
      <SepoliaNetworkGuard>
        <div className="min-h-screen bg-gradient-to-br from-white via-[#E8DCC4]/20 to-white">
          <div className="container mx-auto px-4 py-8">
            <Card className="bg-white/80 border-[#E8DCC4]/30">
              <CardHeader>
                <CardTitle className="text-black">Error</CardTitle>
                <CardDescription className="text-black">
                  {error ? 'Failed to load proposal' : 'Proposal not found'}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </SepoliaNetworkGuard>
    );
  }

  return (
    <SepoliaNetworkGuard>
      <div className="min-h-screen bg-gradient-to-br from-white via-[#E8DCC4]/20 to-white">
        <div className="container mx-auto px-4 py-8">
          {currentState === 'upcoming' && (
            <div className="flex items-center justify-center min-h-[60vh]">
              <Card className="bg-white/80 border-[#E8DCC4]/30 max-w-2xl w-full">
                <CardHeader className="text-center">
                  <CardTitle className="text-black text-2xl">Voting Starts Soon</CardTitle>
                  <CardDescription className="text-black">
                    This proposal is not yet open for voting
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <div className="text-6xl font-bold text-[#4D89B0] mb-4">
                    {timeUntilStart}
                  </div>
                  <p className="text-black text-lg mb-4">
                    Voting begins on {new Date(pStart * 1000).toLocaleString()}
                  </p>
                  
                  {/* Proposal Title */}
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-black mb-6">{proposal.p_title}</h2>
                  </div>
                  
                  {/* Proposal Description */}
                  <div className="p-4 bg-[#E8DCC4]/20 rounded-lg border-l-4 border-[#4D89B0] text-left">
                    <h3 className="text-lg font-semibold mb-2 text-black">Proposal Description</h3>
                    {descriptionLoading ? (
                      <p className="text-black">Loading description...</p>
                    ) : descriptionText ? (
                      <div>
                        <div className="text-black">
                          <MarkdownContent content={descriptionText} />
                        </div>
                        <a href={`https://sapphire-impressive-salamander-839.mypinata.cloud/ipfs/${proposal.p_bodyURI.replace('ipfs://', '')}`} target="_blank" rel="noopener noreferrer" className="text-[#4D89B0] underline text-sm cursor-pointer">
                          View on IPFS
                        </a>
                      </div>
                    ) : proposal.p_bodyURI ? (
                      <div>
                        <p className="text-black">Description stored on IPFS:</p>
                        <a href={`https://sapphire-impressive-salamander-839.mypinata.cloud/ipfs/${proposal.p_bodyURI.replace('ipfs://', '')}`} target="_blank" rel="noopener noreferrer" className="text-[#4D89B0] underline text-sm cursor-pointer">{proposal.p_bodyURI}</a>
                      </div>
                    ) : (
                      <p className="text-black italic">No description provided for this proposal.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {(currentState === 'voting' || currentState === 'ended') && (
            currentState === 'ended' ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="bg-white/80 border-[#E8DCC4]/30 max-w-2xl w-full">
                  <CardHeader className="text-center">
                    <CardTitle className="text-black text-2xl">
                      {proposalResolved ? proposal.p_title : 'Voting Period Ended'}
                    </CardTitle>
                    <CardDescription className="text-black">
                      {proposalResolved 
                        ? 'This proposal has been resolved and results are available'
                        : 'The voting period has ended. Results will be available once tally is revealed.'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-6">
                    {proposalResolved ? null : (
                      <div className="text-4xl font-bold text-[#4D89B0] mb-4 flex items-center justify-center gap-3">
                        {(tallyRevealRequested || shouldBeResolvable) ? (
                          <>
                            <CheckCircle className="w-10 h-10 text-[#4D89B0]" />
                            Ready to Resolve
                          </>
                        ) : (
                          <>
                            <Loader2 className="w-10 h-10 text-[#4D89B0] animate-spin" />
                            Waiting for Tally Reveal
                          </>
                        )}
                      </div>
                    )}
                    <p className="text-black text-lg mb-4">
                      Voting ended on {new Date(pEnd * 1000).toLocaleString()}
                    </p>
                    
                    {/* Proposal Description */}
                    <div className="p-4 bg-[#E8DCC4]/20 rounded-lg border-l-4 border-[#4D89B0] text-left">
                      <h3 className="text-lg font-semibold mb-2 text-black">Proposal Description</h3>
                      {descriptionLoading ? (
                        <p className="text-black">Loading description...</p>
                      ) : descriptionText ? (
                        <div>
                          <div className="text-black">
                            <MarkdownContent content={descriptionText} />
                          </div>
                          <a href={`https://sapphire-impressive-salamander-839.mypinata.cloud/ipfs/${proposal.p_bodyURI.replace('ipfs://', '')}`} target="_blank" rel="noopener noreferrer" className="text-[#4D89B0] underline text-sm cursor-pointer">
                            View on IPFS
                          </a>
                          <div className="mt-4 p-3 bg-[#4D89B0]/10 rounded-lg border border-[#4D89B0]/20">
                            <p className="text-sm text-black">
                              <strong>Passing Threshold:</strong> {thresholdData ? `${(parseInt(thresholdData.toString()) / 100).toFixed(1)}%` : 'Loading...'}
                            </p>
                          </div>
                        </div>
                      ) : proposal.p_bodyURI ? (
                        <div>
                          <p className="text-black">Description stored on IPFS:</p>
                          <div className="mt-2 p-3 bg-[#4D89B0]/10 rounded-lg border border-[#4D89B0]/20">
                            <p className="text-sm text-black">
                              <strong>Passing Threshold:</strong> {thresholdData ? `${(parseInt(thresholdData.toString()) / 100).toFixed(1)}%` : 'Loading...'}
                            </p>
                          </div>
                          <a href={`https://sapphire-impressive-salamander-839.mypinata.cloud/ipfs/${proposal.p_bodyURI.replace('ipfs://', '')}`} target="_blank" rel="noopener noreferrer" className="text-[#4D89B0] underline text-sm cursor-pointer">{proposal.p_bodyURI}</a>
                        </div>
                      ) : (
                        <div>
                          <p className="text-black italic">No description provided for this proposal.</p>
                          <div className="mt-2 p-3 bg-[#4D89B0]/10 rounded-lg border border-[#4D89B0]/20">
                            <p className="text-sm text-black">
                              <strong>Passing Threshold:</strong> {thresholdData ? `${(parseInt(thresholdData.toString()) / 100).toFixed(1)}%` : 'Loading...'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status and Resolve Section */}
                    <div className="p-4 bg-[#4D89B0]/10 rounded-lg">
                      <div className="space-y-4">
                        {!proposalResolved && (
                          <div className="text-center">
                            {!tallyRevealRequested && !shouldBeResolvable && (
                              <p className="text-xs text-black">
                                Checking for tally reveal event every 30 seconds...
                              </p>
                            )}
                            {shouldBeResolvable && !tallyRevealRequested && (
                              <p className="text-xs text-orange-600">
                                Proposal ended {Math.floor(secondsSinceEnd / 60)} minutes ago - should be resolvable
                              </p>
                            )}
                          </div>
                        )}
                        
                        {(tallyRevealRequested || shouldBeResolvable) && !proposalResolved && (
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
                        
                        {proposalResolved && (
                          <div className="text-center p-6 bg-[#E8DCC4]/20 rounded-lg border border-[#E8DCC4]/30">
                            <div className="space-y-4">
                              {resolvedResults ? (
                                <>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div className="bg-white p-4 rounded-lg border border-[#E8DCC4]/30">
                                      <h4 className="font-semibold text-black mb-2">Winning Choice</h4>
                                      <p className="text-[#4D89B0] font-medium">
                                        {choices[parseInt(resolvedResults.winningChoice)]}
                                      </p>
                                    </div>
                                    
                                    <div className="bg-white p-4 rounded-lg border border-[#E8DCC4]/30">
                                      <h4 className="font-semibold text-black mb-2">Proposal Status</h4>
                                      <p className={`font-medium ${resolvedResults.passed ? 'text-[#4D89B0]' : 'text-red-600'}`}>
                                        {resolvedResults.passed ? `PASSED (met ${(parseInt(resolvedResults.threshold) / 100).toFixed(1)}% threshold)` : `FAILED (did not meet ${(parseInt(resolvedResults.threshold) / 100).toFixed(1)}% threshold)`}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-white p-4 rounded-lg border border-[#E8DCC4]/30 mt-4">
                                    <h4 className="font-semibold text-black mb-3">Vote Distribution</h4>
                                    <div className="space-y-2">
                                      {choices.map((choice, index) => (
                                        <div key={index} className="flex justify-between items-center">
                                          <span className="text-black text-sm">
                                            {choice}
                                          </span>
                                          <div className="flex items-center gap-2">
                                            <div className="w-24 bg-[#E8DCC4]/30 rounded-full h-2">
                                              <div 
                                                className="bg-[#4D89B0] h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${resolvedResults.percentages[index]}%` }}
                                              ></div>
                                            </div>
                                            <span className="text-black font-medium text-sm w-12 text-right">
                                              {resolvedResults.percentages[index]}%
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="mt-4">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4D89B0] mx-auto mb-2"></div>
                                  <p className="text-[#4D89B0]">Loading results...</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-white/80 border-[#E8DCC4]/30">
                <CardHeader className="text-center">
                  <CardTitle className="text-black text-3xl font-bold mb-2">{proposal.p_title}</CardTitle>
                  <CardDescription className="text-black mb-4">
                    Proposal ID: {proposal.proposalId}
                  </CardDescription>
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="default" className="bg-[#4D89B0] text-white px-4 py-1">
                      {status}
                    </Badge>
                    <span className="text-sm text-black font-medium">
                      Ends in {timeUntilEnd}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-6">
                    {/* Description Section - Always visible at the top */}
                    <div className="p-4 bg-[#E8DCC4]/20 rounded-lg border-l-4 border-[#4D89B0]">
                      <h3 className="text-lg font-semibold mb-2 text-black">Proposal Description</h3>
                      {descriptionLoading ? (
                        <p className="text-black">Loading description...</p>
                      ) : descriptionText ? (
                        <div>
                          <div className="text-black">
                            <MarkdownContent content={descriptionText} />
                          </div>
                          <a href={`https://sapphire-impressive-salamander-839.mypinata.cloud/ipfs/${proposal.p_bodyURI.replace('ipfs://', '')}`} target="_blank" rel="noopener noreferrer" className="text-[#4D89B0] underline text-sm cursor-pointer">
                            View on IPFS
                          </a>
                          <div className="mt-4 p-3 bg-[#4D89B0]/10 rounded-lg border border-[#4D89B0]/20">
                            <p className="text-sm text-black">
                              <strong>Passing Threshold:</strong> {thresholdData ? `${(parseInt(thresholdData.toString()) / 100).toFixed(1)}%` : 'Loading...'}
                            </p>
                          </div>
                        </div>
                      ) : proposal.p_bodyURI ? (
                        <div>
                          <p className="text-black">Description stored on IPFS:</p>
                          <div className="mt-2 p-3 bg-[#4D89B0]/10 rounded-lg border border-[#4D89B0]/20">
                            <p className="text-sm text-black">
                              <strong>Passing Threshold:</strong> {thresholdData ? `${(parseInt(thresholdData.toString()) / 100).toFixed(1)}%` : 'Loading...'}
                            </p>
                          </div>
                          <a href={`https://sapphire-impressive-salamander-839.mypinata.cloud/ipfs/${proposal.p_bodyURI.replace('ipfs://', '')}`} target="_blank" rel="noopener noreferrer" className="text-[#4D89B0] underline text-sm cursor-pointer">{proposal.p_bodyURI}</a>
                        </div>
                      ) : (
                        <div>
                          <p className="text-black italic">No description provided for this proposal.</p>
                          <div className="mt-2 p-3 bg-[#4D89B0]/10 rounded-lg border border-[#4D89B0]/20">
                            <p className="text-sm text-black">
                              <strong>Passing Threshold:</strong> {thresholdData ? `${(parseInt(thresholdData.toString()) / 100).toFixed(1)}%` : 'Loading...'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-[#4D89B0]/10 rounded-lg border border-[#4D89B0]/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-black">Your Voting Power:</span>
                        <span className="text-lg font-bold text-[#4D89B0]">
                          {pType === 0 ? '1 vote' : `${votingPower} tokens`}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-black">Cast Your Vote</h3>
                      {currentState === 'voting' && !hasVoted && isEligible ? (
                        pType === 2 ? (
                          <div className="space-y-4">
                            {Array.from({ length: choicesLength }, (_, index) => {
                              const choiceText = choices[index] || `Choice ${index + 1}`;
                              return (
                                <div key={index} className="space-y-2">
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
                                        className="w-16 px-2 py-1 border rounded text-center text-sm cursor-pointer"
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
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {Array.from({ length: choicesLength }, (_, choiceIndex) => {
                              const choiceText = choices[choiceIndex] || `Choice ${choiceIndex + 1}`;
                              const isSelected = selectedChoice === choiceIndex;
                              return (
                                <div
                                  key={choiceIndex}
                                  onClick={() => setSelectedChoice(choiceIndex)}
                                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                    isSelected
                                      ? 'border-[#4D89B0] bg-[#4D89B0]/10 shadow-md'
                                      : 'border-[#E8DCC4]/30 bg-white hover:border-[#4D89B0]/50 hover:bg-[#4D89B0]/5'
                                  }`}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                      isSelected
                                        ? 'border-[#4D89B0] bg-[#4D89B0]'
                                        : 'border-gray-300'
                                    }`}>
                                      {isSelected && (
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                      )}
                                    </div>
                                    <label
                                      htmlFor={`choice-${choiceIndex}`}
                                      className={`text-lg font-medium cursor-pointer ${
                                        isSelected ? 'text-[#4D89B0]' : 'text-black'
                                      }`}
                                    >
                                      {choiceText}
                                    </label>
                                  </div>
                                  <input
                                    type="radio"
                                    id={`choice-${choiceIndex}`}
                                    name="vote-choice"
                                    value={choiceIndex}
                                    onChange={() => setSelectedChoice(choiceIndex)}
                                    checked={isSelected}
                                    className="sr-only"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )
                      ) : (
                        <div className="space-y-2">
                          {Array.from({ length: choicesLength }, (_, index) => {
                            const choiceText = choices[index] || `Choice ${index + 1}`;
                            return (
                              <div key={index} className="flex items-center justify-between">
                                <span className="text-black">{choiceText}</span>
                                {pType === 2 && percentages[index] && (
                                  <span className="text-sm text-black">{percentages[index]}%</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {pType === 2 && currentState === 'voting' && !hasVoted && isEligible && (
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

                    {currentState === 'voting' ? (
                      hasVoted ? (
                        <div className="p-4 bg-[#4D89B0]/10 rounded-lg">
                          <p className="text-black">You have already voted.</p>
                        </div>
                      ) : isEligible ? (
                        <div className="mt-8 p-6 bg-[#E8DCC4]/10 rounded-lg border-2 border-[#4D89B0]/20">
                          <Button
                            onClick={() => handleVote(pType === 2 ? null : selectedChoice)}
                            disabled={(pType !== 2 && selectedChoice === null) || (pType === 2 && totalPercentage !== 100) || voting}
                            className="w-full bg-[#4D89B0] hover:bg-[#4D89B0]/90 text-white cursor-pointer py-3 text-lg font-semibold"
                          >
                            {voting ? 'Submitting Vote...' : 'Submit Vote'}
                          </Button>
                          {voteMessage && (
                            <div className={`mt-4 p-4 rounded-lg ${
                              voteMessageType === 'success' 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-red-50 border border-red-200'
                            }`}>
                              <p className={`text-sm ${
                                voteMessageType === 'success' ? 'text-green-800' : 'text-red-800'
                              }`}>
                                {voteMessage}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 bg-red-50 rounded-lg">
                          <p className="text-red-700">
                            {!isMember && !isAdmin && !isOwner 
                              ? "You must be a member of this space to vote." 
                              : "You are not eligible to vote."
                            }
                          </p>
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
            )
          )}
        </div>
      </div>
    </SepoliaNetworkGuard>
  );
}
