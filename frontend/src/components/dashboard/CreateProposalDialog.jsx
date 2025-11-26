"use client";
import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Loader2, ChevronDown, Calendar, CheckCircle, Minus } from 'lucide-react';

// Import IPFS libraries
import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { createClient } from '@storacha/client';

// Import the PrivateProposalFactory ABI
import privateProposalFactoryAbi from '@/abis/PrivateProposalFactory.json';

export function CreateProposalDialog({ spaceId, spaceName }) {
  const [open, setOpen] = useState(false);
  const [hoveredFilter, setHoveredFilter] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pType: 0, // Default to NonWeightedSingleChoice
    choices: ['Yes', 'No'], // Start with 2 basic options
    start: '',
    end: '',
    eligibilityType: 0, // Default to Public
    eligibilityToken: process.env.NEXT_PUBLIC_MOCK_GOVERNANCE_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000',
    eligibilityThreshold: '1',
    passingThreshold: '50', // Default 50% for passing threshold
    includeAbstain: true // Default to include abstain option
  });

  const { address } = useAccount();
  const { writeContract, data: txHash, isPending: isTxPending, isSuccess: txSuccess, error: writeError } = useWriteContract();

  // Define colors for consistency
  const colors = {
    primary: '#4D89B0', // Zama blue
    white: '#ffffff',
    black: '#000000',
    hoverBg: 'rgba(77, 137, 176, 0.1)',
  };

  const eligibilityOptions = [
    { value: 0, label: 'Public' },
    { value: 1, label: 'Token Holder' },
  ];

  const proposalTypeOptions = [
    { value: 0, label: 'Non-Weighted Single Choice' },
    { value: 1, label: 'Weighted Single Choice' },
    { value: 2, label: 'Weighted Fractional' },
  ];

  const [uploading, setUploading] = useState(false);

  // Function to upload description to IPFS
  const uploadToIPFS = async (description) => {
    try {
      setUploading(true);
      
      // Use Pinata for pinning if JWT is available
      const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT;
      if (pinataJwt) {
        const formData = new FormData();
        formData.append('file', new Blob([description], { type: 'text/plain' }), 'description.txt');
        
        const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${pinataJwt}`,
          },
          body: formData,
        });
        
        console.log('Pinata response status:', response.status);
        const responseText = await response.text();
        console.log('Pinata response:', responseText);
        
        if (response.ok) {
          const result = JSON.parse(responseText);
          return `ipfs://${result.IpfsHash}`;
        } else {
          throw new Error(`Pinata upload failed: ${response.status} ${responseText}`);
        }
      }
      
      // Use Infura IPFS if credentials are available
      const infuraProjectId = process.env.NEXT_PUBLIC_INFURA_PROJECT_ID;
      const infuraProjectSecret = process.env.NEXT_PUBLIC_INFURA_PROJECT_SECRET;
      if (infuraProjectId && infuraProjectSecret) {
        const formData = new FormData();
        formData.append('file', new Blob([description], { type: 'text/plain' }), 'description.txt');
        
        const response = await fetch(`https://ipfs.infura.io:5001/api/v0/add`, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(infuraProjectId + ':' + infuraProjectSecret),
          },
          body: formData,
        });
        
        console.log('Infura response status:', response.status);
        const responseText = await response.text();
        console.log('Infura response:', responseText);
        
        if (response.ok) {
          const result = JSON.parse(responseText);
          return `ipfs://${result.Hash}`;
        } else {
          throw new Error(`Infura upload failed: ${response.status} ${responseText}`);
        }
      }
      
      // Fallback to local Helia (content won't be pinned globally)
      console.warn('No Infura credentials found, using local Helia (content may not be accessible to others)');
      const helia = await createHelia();
      const fs = unixfs(helia);
      const textEncoder = new TextEncoder();
      const data = textEncoder.encode(description);
      const cid = await fs.addBytes(data);
      return `ipfs://${cid.toString()}`;
    } catch (error) {
      console.error('Failed to upload to IPFS:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'eligibilityType') {
        if (value === 0) {
          // Public: no restriction, only non-weighted, set token to zero, threshold to 0
          newData.pType = 0;
          newData.eligibilityToken = '0x0000000000000000000000000000000000000000';
          newData.eligibilityThreshold = '0';
        } else if (value === 1) {
          // Token Holder: allow weighted types, set default threshold to 1
          newData.eligibilityThreshold = '1';
        }
      } else if (field === 'includeAbstain') {
        // Adjust choices count when abstain option changes
        const maxChoices = value ? 9 : 10;
        if (newData.choices.length > maxChoices) {
          newData.choices = newData.choices.slice(0, maxChoices);
        }
      }
      return newData;
    });
  };

  const handleChoiceChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      choices: prev.choices.map((choice, i) => i === index ? value : choice)
    }));
  };

  const addChoice = () => {
    const maxChoices = formData.includeAbstain ? 9 : 10; // Leave room for abstain if included
    if (formData.choices.length < maxChoices) {
      setFormData(prev => ({
        ...prev,
        choices: [...prev.choices, `Option ${prev.choices.length + 1}`]
      }));
    }
  };

  const removeChoice = (index) => {
    if (formData.choices.length > 2) { // Keep at least 2 options
      setFormData(prev => ({
        ...prev,
        choices: prev.choices.filter((_, i) => i !== index)
      }));
    }
  };

  // Get the final choices array (contract handles abstain if includeAbstain is true)
  const getFinalChoices = () => {
    return [...formData.choices];
  };

  // Get choices for display (including abstain preview)
  const getDisplayChoices = () => {
    const choices = [...formData.choices];
    if (formData.includeAbstain) {
      choices.push('Abstain');
    }
    return choices;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim() || !address) {
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
    if (formData.eligibilityType === 1 && (isNaN(formData.eligibilityThreshold) || parseFloat(formData.eligibilityThreshold) < 0)) {
      alert('Eligibility threshold must be a positive number for Token Holder eligibility');
      return;
    }

    // Validate passing threshold
    if (isNaN(formData.passingThreshold) || parseFloat(formData.passingThreshold) < 1 || parseFloat(formData.passingThreshold) > 100) {
      alert('Passing threshold must be a percentage between 1 and 100');
      return;
    }

    // Upload description to IPFS
    let bodyURI;
    try {
      bodyURI = await uploadToIPFS(formData.description);
    } catch (error) {
      alert('Failed to upload description to IPFS: ' + error.message);
      return;
    }

    const params = {
      spaceId: spaceId,
      start: Math.floor(startTimestamp / 1000),
      end: Math.floor(endTimestamp / 1000),
      eligibilityToken: formData.eligibilityToken,
      eligibilityThreshold: BigInt(formData.eligibilityThreshold),
      passingThreshold: BigInt(formData.passingThreshold),
      pType: formData.pType,
      eligibilityType: formData.eligibilityType,
      includeAbstain: formData.includeAbstain,
      title: formData.title,
      bodyURI: bodyURI,
      choices: getFinalChoices(),
    };

    writeContract({
      address: process.env.NEXT_PUBLIC_PRIVATE_PROPOSAL_FACTORY_ADDRESS,
      abi: privateProposalFactoryAbi.abi,
      functionName: 'createProposal',
      args: [params],
    });
  };

  // Reset form and close dialog on success
  useEffect(() => {
    if (txSuccess) {
      setFormData({
        title: '',
        description: '',
        pType: 0,
        choices: ['Yes', 'No'],
        start: '',
        end: '',
        eligibilityType: 0,
        eligibilityToken: process.env.NEXT_PUBLIC_MOCK_GOVERNANCE_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000',
        eligibilityThreshold: '1',
        passingThreshold: '50',
        includeAbstain: true
      });
      setShowSuccess(true);
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        setOpen(false);
      }, 3000);
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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto bg-gradient-to-br from-[#E8DCC4] via-white to-white ">
        <DialogHeader>
          <DialogTitle className="text-black">Create New Proposal</DialogTitle>
          <DialogDescription className="text-black">
            Create a governance proposal for {spaceName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-black">Proposal Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter proposal title"
              required
              className="bg-white/50 border-[#E8DCC4]/30"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-black">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter proposal description..."
              rows={3}
              required
              className="bg-white/50 border-[#E8DCC4]/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start" className="text-black">Start Date</Label>
              <div className="relative">
                <Input
                  id="start"
                  type="datetime-local"
                  value={formData.start}
                  onChange={(e) => handleInputChange('start', e.target.value)}
                  className="bg-white/50 border-[#E8DCC4]/30 pr-10"
                  ref={(el) => {
                    if (el) window.startInputRef = el;
                  }}
                />
                <Calendar 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 cursor-pointer hover:text-gray-700" 
                  onClick={() => {
                    const input = document.getElementById('start');
                    if (input) input.showPicker ? input.showPicker() : input.click();
                  }}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="end" className="text-black">End Date *</Label>
              <div className="relative">
                <Input
                  id="end"
                  type="datetime-local"
                  value={formData.end}
                  onChange={(e) => handleInputChange('end', e.target.value)}
                  required
                  className="bg-white/50 border-[#E8DCC4]/30 pr-10"
                  ref={(el) => {
                    if (el) window.endInputRef = el;
                  }}
                />
                <Calendar 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 cursor-pointer hover:text-gray-700" 
                  onClick={() => {
                    const input = document.getElementById('end');
                    if (input) input.showPicker ? input.showPicker() : input.click();
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="eligibilityType" className="text-black">Eligibility Type</Label>
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 w-full px-3 py-2 rounded-md transition-colors duration-200 font-medium text-sm border border-[#E8DCC4]/30 bg-white/50 cursor-pointer"
                style={{
                  color: colors.black,
                  backgroundColor: hoveredFilter === 'eligibility' ? colors.hoverBg : 'rgba(255, 255, 255, 0.5)'
                }}
                onClick={() => {
                  if (hoveredFilter === 'eligibility') {
                    setHoveredFilter(null);
                  } else {
                    setHoveredFilter('eligibility');
                  }
                }}
              >
                {eligibilityOptions.find(opt => opt.value === formData.eligibilityType)?.label || 'Select eligibility type'}
                <ChevronDown className="h-4 w-4 ml-auto" />
              </button>

              {/* Dropdown */}
              {hoveredFilter === 'eligibility' && (
                <div
                  className="absolute top-full left-0 mt-1 w-full rounded-md shadow-lg z-50 animate-in fade-in-0 zoom-in-95"
                  style={{ backgroundColor: colors.white, border: `1px solid ${colors.primary}20` }}
                >
                  <div className="py-1">
                    {eligibilityOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          handleInputChange('eligibilityType', option.value);
                          setHoveredFilter(null);
                        }}
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors duration-150 w-full text-left cursor-pointer"
                        style={{ color: colors.black }}
                      >
                        {option.label}
                        {formData.eligibilityType === option.value && (
                          <div className="w-2 h-2 rounded-full ml-auto" style={{ backgroundColor: colors.primary }}></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="pType" className="text-black">Proposal Type</Label>
            <div className="relative">
              <button
                type="button"
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-md transition-colors duration-200 font-medium text-sm border border-[#E8DCC4]/30 ${formData.eligibilityType === 0 ? 'bg-gray-100 cursor-not-allowed opacity-50' : 'bg-white/50 cursor-pointer'}`}
                style={{
                  color: formData.eligibilityType === 0 ? '#9CA3AF' : colors.black,
                  backgroundColor: formData.eligibilityType === 0 ? '#F3F4F6' : (hoveredFilter === 'proposalType' ? colors.hoverBg : 'rgba(255, 255, 255, 0.5)')
                }}
                disabled={formData.eligibilityType === 0}
                onClick={() => {
                  if (formData.eligibilityType !== 0) {
                    if (hoveredFilter === 'proposalType') {
                      setHoveredFilter(null);
                    } else {
                      setHoveredFilter('proposalType');
                    }
                  }
                }}
              >
                {proposalTypeOptions.find(opt => opt.value === formData.pType)?.label || 'Select proposal type'}
                <ChevronDown className="h-4 w-4 ml-auto" />
              </button>

              {/* Dropdown */}
              {hoveredFilter === 'proposalType' && formData.eligibilityType !== 0 && (
                <div
                  className="absolute top-full left-0 mt-1 w-full rounded-md shadow-lg z-50 animate-in fade-in-0 zoom-in-95"
                  style={{ backgroundColor: colors.white, border: `1px solid ${colors.primary}20` }}
                >
                  <div className="py-1">
                    {proposalTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          handleInputChange('pType', option.value);
                          setHoveredFilter(null);
                        }}
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors duration-150 w-full text-left cursor-pointer"
                        style={{ color: colors.black }}
                      >
                        {option.label}
                        {formData.pType === option.value && (
                          <div className="w-2 h-2 rounded-full ml-auto" style={{ backgroundColor: colors.primary }}></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {formData.eligibilityType === 1 && (
            <>
              <div>
                <Label htmlFor="eligibilityToken" className="text-black">Eligibility Token Address</Label>
                <Input
                  id="eligibilityToken"
                  value={formData.eligibilityToken}
                  onChange={(e) => handleInputChange('eligibilityToken', e.target.value)}
                  placeholder="Token contract address"
                  className="bg-white/50 border-[#E8DCC4]/30"
                />
              </div>

              <div>
                <Label htmlFor="eligibilityThreshold" className="text-black">Eligibility Threshold</Label>
                <Input
                  id="eligibilityThreshold"
                  type="number"
                  value={formData.eligibilityThreshold}
                  onChange={(e) => handleInputChange('eligibilityThreshold', e.target.value)}
                  placeholder="Minimum token balance"
                  className="bg-white/50 border-[#E8DCC4]/30"
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="passingThreshold" className="text-black">Passing Threshold (%)</Label>
            <Input
              id="passingThreshold"
              type="number"
              value={formData.passingThreshold}
              onChange={(e) => handleInputChange('passingThreshold', e.target.value)}
              placeholder="50"
              min="1"
              max="100"
              className="bg-white/50 border-[#E8DCC4]/30"
            />
            <p className="text-xs text-gray-600 mt-1">Percentage of votes required for proposal to pass</p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="includeAbstain"
              checked={formData.includeAbstain}
              onChange={(e) => handleInputChange('includeAbstain', e.target.checked)}
              className="rounded border-[#E8DCC4]/30"
            />
            <Label htmlFor="includeAbstain" className="text-black">Include Abstain option</Label>
          </div>

          <div>
            <Label className="text-black">Proposal Choices</Label>
            <div className="space-y-2 mt-2">
              {getDisplayChoices().map((choice, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index < formData.choices.length ? (
                    <>
                      <Input
                        value={choice}
                        onChange={(e) => handleChoiceChange(index, e.target.value)}
                        placeholder={`Choice ${index + 1}`}
                        className="bg-white/50 border-[#E8DCC4]/30 flex-1"
                      />
                      {formData.choices.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeChoice(index)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={choice}
                        readOnly
                        className="bg-gray-100 border-[#E8DCC4]/30 flex-1"
                      />
                      <span className="text-sm text-gray-500">(Abstain option)</span>
                    </div>
                  )}
                </div>
              ))}
              {(formData.includeAbstain ? getDisplayChoices().length < 9 : getDisplayChoices().length < 10) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addChoice}
                  className="border-[#4D89B0] text-[#4D89B0] hover:bg-[#4D89B0] hover:text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Choice
                </Button>
              )}
              <p className="text-xs text-gray-600">
                {getDisplayChoices().length}/10 choices {formData.includeAbstain && '(including abstain)'}
              </p>
            </div>
          </div>

          {writeError && (
            <div className="text-sm text-red-600 p-2 bg-red-50 rounded border border-red-200">
              Error: {writeError.message}
            </div>
          )}

          {showSuccess && (
            <div className="text-sm text-green-600 p-2 bg-green-50 rounded border border-green-200 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Proposal created successfully! The dialog will close automatically.
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isTxPending || uploading || !formData.title.trim() || !formData.description.trim() || !formData.end}
              className="flex-1 bg-[#4D89B0] hover:bg-[#4D89B0]/90 text-white"
            >
              {isTxPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading to IPFS...
                </>
              ) : (
                'Create Proposal'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-[#4D89B0] text-black hover:bg-[#4D89B0] hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}