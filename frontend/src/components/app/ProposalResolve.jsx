'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { ethers } from 'ethers';
import { useReadContract } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PrivateProposalABI from '@/abis/PrivateProposal.json';
import { decryptMultipleHandles } from '@/lib/fhevm';

export default function ProposalResolve({ proposal, signer, fheInitialized, currentTime, pEnd, publicProvider }) {
  const [resolving, setResolving] = useState(false);
  const [resultsRevealed, setResultsRevealed] = useState(false);
  const [results, setResults] = useState(null);

  // ✅ Dépendances stables
  const proposalAddress = proposal?.proposal ?? null;

  // Get choices length from contract
  const { data: choicesLengthData } = useReadContract({
    address: proposalAddress,
    abi: PrivateProposalABI.abi,
    functionName: 'choicesLength',
    enabled: !!proposalAddress
  });

  const choicesLength = choicesLengthData ? Number(choicesLengthData) : 0;

  // ✅ garde-fous anti-rafale
  const inFlightRef = useRef(false);
  const lastFetchRef = useRef(0);
  const MIN_INTERVAL_MS = 5000; // 1 fetch max / 5s

  const fetchResults = useCallback(async () => {
    if (!publicProvider || !proposalAddress) return;

    const now = Date.now();
    if (now - lastFetchRef.current < MIN_INTERVAL_MS) return;
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    lastFetchRef.current = now;

    try {
      const proposalContract = new ethers.Contract(
        proposalAddress,
        PrivateProposalABI.abi,
        publicProvider
      );

      const revealed = await proposalContract.resultsRevealed();
      setResultsRevealed(revealed);

      if (revealed) {
        // ✅ parallélise pour réduire la latence (pas le nombre de calls, mais evite les overlaps)
        const [voteCounts, winningChoice, passed, resolved] = await Promise.all([
          proposalContract.getVotePercentages(),
          proposalContract.winningChoice(),
          proposalContract.proposalPassed(),
          proposalContract.proposalResolved(),
        ]);

        const voteCountsBig = voteCounts.map(c => BigInt(c.toString()));
        const totalVotes = voteCountsBig.reduce((sum, count) => sum + count, 0n);
        const percentages = voteCountsBig.map(count =>
          totalVotes > 0n ? Number((count * 100n) / totalVotes) : 0
        );

        setResults({
          percentages: percentages.map(p => p.toString()),
          winningChoice: winningChoice.toString(),
          passed,
          resolved,
        });
      }
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      inFlightRef.current = false;
    }
  }, [publicProvider, proposalAddress]); // ✅ plus de dépendance sur l’objet proposal entier

  // Handle TallyRevealRequested event
  const handleTallyRevealRequested = useCallback(async (handles, event) => {
    console.log('TallyRevealRequested event received:', handles?.length, 'handles for contract:', event?.args?.contractAddress);
    if (!signer || !proposal || !fheInitialized) return;

    try {
      const proposalAddress = proposal.proposal;
      // Decrypt the handles client-side
      const result = await decryptMultipleHandles(proposalAddress, signer, handles);
      const { cleartexts, decryptionProof } = result;

      // Submit to contract for on-chain verification
      const proposalContract = new ethers.Contract(proposalAddress, PrivateProposalABI.abi, signer);
      const tx = await proposalContract.resolveProposalCallback(proposalAddress, cleartexts, decryptionProof);
      await tx.wait();

      // Fetch the verified results from the contract
      await fetchResults();
    } catch (error) {
      console.error('Failed to decrypt and verify results:', error);
    }
  }, [signer, proposal, fheInitialized, fetchResults]);

  // Manual resolve proposal
  const handleResolveProposal = async () => {
    console.log('handleResolveProposal called');
    console.log('currentTime:', currentTime);
    console.log('pEnd:', pEnd);
    if (!signer || !proposal || !fheInitialized) {
      console.log('Missing signer, proposal, or FHE not initialized');
      return;
    }

    // Check if voting period has ended
    if (currentTime <= pEnd) {
      alert('Voting period has not ended yet. Cannot resolve proposal.');
      return;
    }

    setResolving(true);
    try {
      const proposalAddress = proposal.proposal;
      const proposalContract = new ethers.Contract(proposalAddress, PrivateProposalABI.abi, signer);

      // Get encrypted handles for each choice
      const handles = [];
      for (let i = 0; i < choicesLength; i++) {
        const handle = await proposalContract.getEncryptedChoiceVotes(i);
        handles.push(handle);
      }

      console.log('Encrypted handles:', handles);

      // Decrypt the handles client-side
      const result = await decryptMultipleHandles(proposalAddress, signer, handles);
      const { cleartexts, decryptionProof } = result;

      console.log('Decrypted cleartexts:', cleartexts);
      console.log('Decryption proof:', decryptionProof);

      // Submit to contract for on-chain verification
      console.log('Calling resolveProposalCallback with:', proposalAddress, cleartexts, decryptionProof);
      const tx = await proposalContract.resolveProposalCallback(proposalAddress, cleartexts, decryptionProof);
      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      console.log('Transaction confirmed');

      // Fetch the verified results from the contract
      await fetchResults();
    } catch (error) {
      console.error('Failed to resolve proposal:', error);
      alert('Failed to resolve proposal: ' + error.message);
    } finally {
      setResolving(false);
    }
  };

  // Listen for TallyRevealRequested event
  useEffect(() => {
    if (!publicProvider || !proposal) return;

    const proposalAddress = proposal.proposal;
    const proposalContract = new ethers.Contract(proposalAddress, PrivateProposalABI.abi, publicProvider);

    const setupListener = () => {
      try {
        proposalContract.on('TallyRevealRequested', handleTallyRevealRequested);
        console.log('Event listener set up for TallyRevealRequested');
      } catch (error) {
        if (error.message.includes('Too Many Requests')) {
          console.warn('Rate limited setting up event listener, skipping for now.');
        } else {
          console.error('Failed to set up event listener:', error);
        }
      }
    };
    setupListener();

    return () => {
      proposalContract.off('TallyRevealRequested', handleTallyRevealRequested);
    };
  }, [publicProvider, proposal, handleTallyRevealRequested]);

  // ✅ effet déclenché seulement quand l'adresse/provider change
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const isAfterVoting = currentTime >= pEnd;

  return (
    <Card className="bg-white/80 border-[#E8DCC4]/30">
      <CardHeader>
        <CardTitle className="text-black">Proposal Resolution</CardTitle>
        <CardDescription className="text-black">
          {resultsRevealed ? 'Results have been revealed' : isAfterVoting ? 'Voting has ended. Results can be decrypted and resolved.' : 'Voting is still active.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {resultsRevealed && results ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black">Results</h3>
            <div className="space-y-2">
              <p className="text-black"><strong>Winning Choice:</strong> {proposal.p_choices?.[parseInt(results.winningChoice)]} (Index: {results.winningChoice})</p>
              <p className="text-black"><strong>Proposal Passed:</strong> {results.passed ? 'Yes' : 'No'}</p>
              <p className="text-black"><strong>Proposal Resolved:</strong> {results.resolved ? 'Yes' : 'No'}</p>
              <div>
                <strong className="text-black">Vote Percentages:</strong>
                <ul className="list-disc list-inside mt-2">
                  {results.percentages.map((percentage, index) => (
                    <li key={index} className="text-black">
                      {proposal.p_choices?.[index]}: {percentage}%
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-black">
              {isAfterVoting 
                ? 'Results not yet revealed. Click "Resolve Proposal" to decrypt and reveal the voting results.' 
                : 'Voting is still active. Results will be available after the voting period ends.'
              }
            </p>
            {isAfterVoting && (
              <Button
                onClick={handleResolveProposal}
                disabled={resolving || !fheInitialized}
                variant="outline"
                className="w-full border-[#4D89B0] text-black hover:bg-[#4D89B0] hover:text-white"
              >
                {resolving ? 'Resolving Proposal...' : 'Resolve Proposal'}
              </Button>
            )}
            {!fheInitialized && (
              <div className="text-sm text-black">
                Initializing FHE encryption...
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}