"use client";
import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';

// Import the PrivateProposalFactory ABI
import privateProposalFactoryAbi from '@/abis/PrivateProposalFactory.json';

export function CreateProposalDialog({ spaceId, spaceName }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    bodyURI: '',
    discussionURI: '',
    app: 'zama-hub',
    pType: 0, // Default to single choice
    choices: ['For', 'Against', 'Abstain'],
    start: '',
    end: '',
    execTargets: [],
    execValues: [],
    execCalldatas: [],
    execStrategy: '0x0000000000000000000000000000000000000000', // Default no execution
    eligibilityType: 0, // Basic eligibility
    eligibilityToken: process.env.NEXT_PUBLIC_MOCK_GOVERNANCE_TOKEN || '0x0000000000000000000000000000000000000000',
    eligibilityThreshold: '1'
  });

  const { address } = useAccount();
  const { writeContract, data: txHash, isPending: isTxPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: txSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.bodyURI.trim() || !address) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate dates
    const startTimestamp = formData.start ? new Date(formData.start).getTime() : Date.now();
    const endTimestamp = formData.end ? new Date(formData.end).getTime() : Date.now() + 604800000; // Default 1 week

    if (endTimestamp <= startTimestamp) {
      alert('End date must be after start date');
      return;
    }

    if (endTimestamp <= Date.now()) {
      alert('End date must be in the future');
      return;
    }

    // Validate eligibility threshold
    if (isNaN(formData.eligibilityThreshold) || parseFloat(formData.eligibilityThreshold) < 0) {
      alert('Eligibility threshold must be a positive number');
      return;
    }

    const params = {
      spaceId: spaceId,
      title: formData.title,
      bodyURI: formData.bodyURI,
      discussionURI: formData.discussionURI || '',
      app: formData.app,
      pType: formData.pType,
      choices: formData.choices,
      start: Math.floor(startTimestamp / 1000),
      end: Math.floor(endTimestamp / 1000),
      execTargets: formData.execTargets,
      execValues: formData.execValues.map(v => BigInt(v || '0')),
      execCalldatas: formData.execCalldatas,
      execStrategy: formData.execStrategy,
      eligibilityType: formData.eligibilityType,
      eligibilityToken: formData.eligibilityToken,
      eligibilityThreshold: BigInt(formData.eligibilityThreshold),
      creator: address
    };

    writeContract({
      address: process.env.NEXT_PUBLIC_PRIVATE_PROPOSAL_FACTORY,
      abi: privateProposalFactoryAbi.abi,
      functionName: 'createProposal',
      args: [params],
    });
  };

  // Reset form and close dialog on success
  React.useEffect(() => {
    if (txSuccess) {
      setFormData({
        title: '',
        bodyURI: '',
        discussionURI: '',
        app: 'zama-hub',
        pType: 0,
        choices: ['For', 'Against', 'Abstain'],
        start: '',
        end: '',
        execTargets: [],
        execValues: [],
        execCalldatas: [],
        execStrategy: '0x0000000000000000000000000000000000000000',
        eligibilityType: 0,
        eligibilityToken: process.env.NEXT_PUBLIC_MOCK_GOVERNANCE_TOKEN || '0x0000000000000000000000000000000000000000',
        eligibilityThreshold: '1'
      });
      setOpen(false);
      alert('Proposal created successfully!');
    }
  }, [txSuccess]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="flex-1" style={{ backgroundColor: '#4D89B0', color: 'white' }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Proposal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Create New Proposal</DialogTitle>
          <DialogDescription>
            Create a governance proposal for {spaceName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Proposal Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter proposal title"
              required
            />
          </div>

          <div>
            <Label htmlFor="bodyURI">Description/Content URI *</Label>
            <Textarea
              id="bodyURI"
              value={formData.bodyURI}
              onChange={(e) => handleInputChange('bodyURI', e.target.value)}
              placeholder="IPFS URI or detailed description..."
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="discussionURI">Discussion URI</Label>
            <Input
              id="discussionURI"
              value={formData.discussionURI}
              onChange={(e) => handleInputChange('discussionURI', e.target.value)}
              placeholder="Forum link or discussion URL"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start">Start Date</Label>
              <Input
                id="start"
                type="datetime-local"
                value={formData.start}
                onChange={(e) => handleInputChange('start', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end">End Date *</Label>
              <Input
                id="end"
                type="datetime-local"
                value={formData.end}
                onChange={(e) => handleInputChange('end', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="pType">Proposal Type</Label>
            <Select value={formData.pType.toString()} onValueChange={(value) => handleInputChange('pType', parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select proposal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Single Choice</SelectItem>
                <SelectItem value="1">Approval</SelectItem>
                <SelectItem value="2">Quadratic</SelectItem>
                <SelectItem value="3">Ranked Choice</SelectItem>
                <SelectItem value="4">Weighted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="choices">Choices (comma-separated)</Label>
            <Input
              id="choices"
              value={formData.choices.join(', ')}
              onChange={(e) => handleInputChange('choices', e.target.value.split(',').map(c => c.trim()))}
              placeholder="For, Against, Abstain"
            />
          </div>

          <div>
            <Label htmlFor="eligibilityType">Eligibility Type</Label>
            <Select value={formData.eligibilityType.toString()} onValueChange={(value) => handleInputChange('eligibilityType', parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select eligibility type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Basic</SelectItem>
                <SelectItem value="1">ERC20 Balance</SelectItem>
                <SelectItem value="2">ERC721 Balance</SelectItem>
                <SelectItem value="3">ERC1155 Balance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="eligibilityToken">Eligibility Token Address</Label>
            <Input
              id="eligibilityToken"
              value={formData.eligibilityToken}
              onChange={(e) => handleInputChange('eligibilityToken', e.target.value)}
              placeholder="Token contract address"
            />
          </div>

          <div>
            <Label htmlFor="eligibilityThreshold">Eligibility Threshold</Label>
            <Input
              id="eligibilityThreshold"
              type="number"
              value={formData.eligibilityThreshold}
              onChange={(e) => handleInputChange('eligibilityThreshold', e.target.value)}
              placeholder="Minimum token balance"
            />
          </div>

          {writeError && (
            <div className="text-sm text-red-600 p-2 bg-red-50 rounded">
              Error: {writeError.message}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isTxPending || isConfirming || !formData.title.trim() || !formData.bodyURI.trim() || !formData.end}
              className="flex-1"
            >
              {isTxPending || isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Proposal'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}