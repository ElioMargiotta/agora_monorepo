"use client";

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { gql, request } from 'graphql-request';
import { ethers } from 'ethers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, DollarSign, Users, Trophy, X } from 'lucide-react';
import { ConnectWallet } from '@/components/wallet/ConnectWallet';
import { SepoliaNetworkGuard } from '@/components/ui/SepoliaNetworkGuard';
import { initializeFheInstance, createEncryptedInput } from '@/lib/fhevm';
import PrivateProposalABI from '@/abis/PrivateProposal.json';
import MockUSDCABI from '@/abis/MockUSDC.json';

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;
const MOCK_USDC_ADDRESS = process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS;

// GraphQL query to get all proposals with prediction markets enabled
const GET_PREDICTION_MARKETS = gql`
  query GetPredictionMarkets {
    proposalCreateds(
      where: { p_predictionMarketEnabled: true }
      orderBy: p_creationTimestamp
      orderDirection: desc
    ) {
      id
      proposalAddress
      p_spaceId
      p_title
      p_description
      p_proposalType
      p_status
      p_predictionMarketEnabled
      p_predictionToken
      p_creationTimestamp
      p_votingDeadline
    }
    predictionMades {
      id
      proposalAddress
      predictor
      encryptedChoice
      stakeAmount
      blockTimestamp
    }
    predictionCancelleds {
      id
      proposalAddress
      predictor
      refundAmount
      blockTimestamp
    }
    winningsClaimeds {
      id
      proposalAddress
      winner
      amount
      blockTimestamp
    }
  }
`;

export default function PredictionMarketPage() {
  const { address, isConnected } = useAccount();
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [predictionChoice, setPredictionChoice] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [fheInstance, setFheInstance] = useState(null);

  // Fetch prediction markets from subgraph
  const { data: marketsData, isLoading: marketsLoading, refetch } = useQuery({
    queryKey: ['predictionMarkets'],
    queryFn: async () => {
      const data = await request(SUBGRAPH_URL, GET_PREDICTION_MARKETS);
      return data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Contract write hooks
  const { writeContract, data: txHash, isPending: isTxPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: txSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Initialize FHE when component mounts
  useEffect(() => {
    const initFhe = async () => {
      try {
        const instance = await initializeFheInstance();
        setFheInstance(instance);
      } catch (error) {
        console.error('Failed to initialize FHE:', error);
      }
    };
    initFhe();
  }, []);

  // Refetch after successful transaction
  useEffect(() => {
    if (txSuccess) {
      refetch();
      setPredictionChoice('');
      setStakeAmount('');
    }
  }, [txSuccess, refetch]);

  // Get prediction market info for selected proposal
  const { data: marketInfo } = useReadContract({
    address: selectedProposal?.proposalAddress,
    abi: PrivateProposalABI.abi,
    functionName: 'getPredictionMarketInfo',
    query: {
      enabled: !!selectedProposal?.proposalAddress,
      refetchInterval: 5000,
    },
  });

  // Get user's prediction info for selected proposal
  const { data: userPredictionInfo } = useReadContract({
    address: selectedProposal?.proposalAddress,
    abi: PrivateProposalABI.abi,
    functionName: 'getUserPredictionInfo',
    args: [address],
    query: {
      enabled: !!selectedProposal?.proposalAddress && !!address,
      refetchInterval: 5000,
    },
  });

  // Get user's USDC balance
  const { data: usdcBalance } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MockUSDCABI.abi,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  });

  // Get USDC allowance for selected proposal
  const { data: usdcAllowance } = useReadContract({
    address: MOCK_USDC_ADDRESS,
    abi: MockUSDCABI.abi,
    functionName: 'allowance',
    args: [address, selectedProposal?.proposalAddress],
    query: {
      enabled: !!address && !!selectedProposal?.proposalAddress,
      refetchInterval: 5000,
    },
  });

  const handleApprove = async () => {
    if (!stakeAmount || !selectedProposal) return;
    
    try {
      const amount = ethers.parseUnits(stakeAmount, 6); // USDC has 6 decimals
      
      writeContract({
        address: MOCK_USDC_ADDRESS,
        abi: MockUSDCABI.abi,
        functionName: 'approve',
        args: [selectedProposal.proposalAddress, amount],
      });
    } catch (error) {
      console.error('Approve error:', error);
    }
  };

  const handleMakePrediction = async () => {
    if (!predictionChoice || !stakeAmount || !selectedProposal || !fheInstance) return;
    
    try {
      const choice = parseInt(predictionChoice);
      if (choice < 0 || choice > 255) {
        alert('Choice must be between 0 and 255');
        return;
      }

      const amount = ethers.parseUnits(stakeAmount, 6);

      // Create encrypted input for the choice
      const encryptedInput = await createEncryptedInput(
        selectedProposal.proposalAddress,
        address,
        fheInstance
      );
      encryptedInput.add8(choice);
      const { handles, inputProof } = encryptedInput.encrypt();

      writeContract({
        address: selectedProposal.proposalAddress,
        abi: PrivateProposalABI.abi,
        functionName: 'makePrediction',
        args: [handles[0], inputProof, amount],
      });
    } catch (error) {
      console.error('Make prediction error:', error);
    }
  };

  const handleCancelPrediction = async () => {
    if (!selectedProposal) return;
    
    try {
      writeContract({
        address: selectedProposal.proposalAddress,
        abi: PrivateProposalABI.abi,
        functionName: 'cancelPrediction',
      });
    } catch (error) {
      console.error('Cancel prediction error:', error);
    }
  };

  const handleClaimWinnings = async () => {
    if (!selectedProposal) return;
    
    try {
      writeContract({
        address: selectedProposal.proposalAddress,
        abi: PrivateProposalABI.abi,
        functionName: 'claimWinnings',
      });
    } catch (error) {
      console.error('Claim winnings error:', error);
    }
  };

  // Group predictions by proposal
  const proposalPredictions = {};
  marketsData?.predictionMades?.forEach(pred => {
    if (!proposalPredictions[pred.proposalAddress]) {
      proposalPredictions[pred.proposalAddress] = [];
    }
    proposalPredictions[pred.proposalAddress].push(pred);
  });

  // Calculate total stakes per proposal
  const proposalTotalStakes = {};
  Object.entries(proposalPredictions).forEach(([address, predictions]) => {
    const total = predictions.reduce((sum, pred) => sum + BigInt(pred.stakeAmount), 0n);
    proposalTotalStakes[address] = total;
  });

  const formatAmount = (amount, decimals = 6) => {
    return ethers.formatUnits(amount || 0, decimals);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleString();
  };

  const isDeadlinePassed = (deadline) => {
    return Date.now() / 1000 > parseInt(deadline);
  };

  const needsApproval = () => {
    if (!stakeAmount || !usdcAllowance) return true;
    const amount = ethers.parseUnits(stakeAmount, 6);
    return BigInt(usdcAllowance) < BigInt(amount);
  };

  return (
    <SepoliaNetworkGuard>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Prediction Markets</h1>
          <p className="text-muted-foreground">
            Stake USDC on encrypted predictions. Winners split the pool proportionally.
          </p>
        </div>

        {!isConnected ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg mb-4">Connect your wallet to participate in prediction markets</p>
              <ConnectWallet />
            </CardContent>
          </Card>
        ) : marketsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Proposal List */}
            <div className="lg:col-span-2 space-y-4">
              {marketsData?.proposalCreateds?.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No prediction markets available yet</p>
                  </CardContent>
                </Card>
              ) : (
                marketsData?.proposalCreateds?.map((proposal) => {
                  const predictions = proposalPredictions[proposal.proposalAddress] || [];
                  const totalStake = proposalTotalStakes[proposal.proposalAddress] || 0n;
                  const isSelected = selectedProposal?.proposalAddress === proposal.proposalAddress;
                  const isPast = isDeadlinePassed(proposal.p_votingDeadline);

                  return (
                    <Card
                      key={proposal.id}
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-[#4D89B0]' : ''
                      }`}
                      onClick={() => setSelectedProposal(proposal)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2">{proposal.p_title}</CardTitle>
                            <CardDescription className="line-clamp-2">
                              {proposal.p_description}
                            </CardDescription>
                          </div>
                          {isPast && (
                            <Badge variant="secondary" className="ml-2">
                              Ended
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Total Pool</p>
                              <p className="font-semibold">{formatAmount(totalStake)} USDC</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Predictions</p>
                              <p className="font-semibold">{predictions.length}</p>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground">Deadline</p>
                            <p className="text-sm">{formatTimestamp(proposal.p_votingDeadline)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Right Column - Prediction Interface */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                {selectedProposal ? (
                  <>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Make Prediction</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedProposal(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {selectedProposal.p_title}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Market Info */}
                      {marketInfo && (
                        <div className="space-y-2 p-3 bg-muted rounded-lg">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Pool:</span>
                            <span className="font-semibold">{formatAmount(marketInfo[0])} USDC</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Accumulated Fees:</span>
                            <span className="font-semibold">{formatAmount(marketInfo[1])} USDC</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Revealed:</span>
                            <span className="font-semibold">{marketInfo[2] ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                      )}

                      {/* User's Position */}
                      {userPredictionInfo && userPredictionInfo[0] > 0n && (
                        <Alert>
                          <Trophy className="w-4 h-4" />
                          <AlertDescription>
                            <div className="space-y-1">
                              <p className="font-semibold">Your Position</p>
                              <p className="text-sm">Stake: {formatAmount(userPredictionInfo[0])} USDC</p>
                              <p className="text-sm">Can Claim: {userPredictionInfo[1] ? 'Yes' : 'No'}</p>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Balance Display */}
                      <div className="text-sm text-muted-foreground">
                        Your USDC Balance: {formatAmount(usdcBalance || 0)} USDC
                      </div>

                      {/* Prediction Form */}
                      {!isDeadlinePassed(selectedProposal.p_votingDeadline) && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium mb-1 block">
                              Prediction Choice (0-255)
                            </label>
                            <Input
                              type="number"
                              min="0"
                              max="255"
                              placeholder="Enter your prediction"
                              value={predictionChoice}
                              onChange={(e) => setPredictionChoice(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">
                              Stake Amount (USDC)
                            </label>
                            <Input
                              type="number"
                              min="0"
                              step="0.000001"
                              placeholder="Amount to stake"
                              value={stakeAmount}
                              onChange={(e) => setStakeAmount(e.target.value)}
                            />
                          </div>

                          {needsApproval() ? (
                            <Button
                              className="w-full"
                              onClick={handleApprove}
                              disabled={!stakeAmount || isTxPending || isConfirming}
                            >
                              {isTxPending || isConfirming ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Approving...
                                </>
                              ) : (
                                'Approve USDC'
                              )}
                            </Button>
                          ) : (
                            <Button
                              className="w-full"
                              onClick={handleMakePrediction}
                              disabled={!predictionChoice || !stakeAmount || !fheInstance || isTxPending || isConfirming}
                            >
                              {isTxPending || isConfirming ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                'Make Prediction'
                              )}
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      {userPredictionInfo && userPredictionInfo[0] > 0n && (
                        <div className="space-y-2 pt-2 border-t">
                          {!isDeadlinePassed(selectedProposal.p_votingDeadline) && (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={handleCancelPrediction}
                              disabled={isTxPending || isConfirming}
                            >
                              Cancel Prediction (1% fee)
                            </Button>
                          )}
                          {userPredictionInfo[1] && (
                            <Button
                              variant="default"
                              className="w-full"
                              onClick={handleClaimWinnings}
                              disabled={isTxPending || isConfirming}
                            >
                              <Trophy className="w-4 h-4 mr-2" />
                              Claim Winnings
                            </Button>
                          )}
                        </div>
                      )}

                      {txSuccess && (
                        <Alert>
                          <AlertDescription className="text-green-600">
                            Transaction successful!
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="py-12 text-center">
                    <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Select a proposal to make predictions
                    </p>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </SepoliaNetworkGuard>
  );
}
