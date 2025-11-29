"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Globe, Coins, Image as ImageIcon, Shield, ChevronDown } from 'lucide-react';

// Import the SpaceRegistry ABI
import spaceRegistryAbi from '@/abis/SpaceRegistry.json';

// Contract addresses
const SPACE_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_SPACE_REGISTRY_ADDRESS;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export function SpaceCreation() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [ensName, setEnsName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [membershipType, setMembershipType] = useState('0'); // Default to public (0)
  const [criteriaContract, setCriteriaContract] = useState('');
  const [criteriaAmount, setCriteriaAmount] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [hideTimeout, setHideTimeout] = useState(null);

  const membershipOptions = [
    {
      value: '0',
      name: 'Public',
      description: 'Anyone can join',
      icon: Globe
    },
    {
      value: '1',
      name: 'Token Holder',
      description: 'Requires holding specific tokens',
      icon: Coins
    },
    {
      value: '2',
      name: 'NFT Holder',
      description: 'Requires holding specific NFTs',
      icon: ImageIcon
    },
    {
      value: '3',
      name: 'Whitelist',
      description: 'Only whitelisted addresses',
      icon: Shield
    }
  ];

  const selectedOption = membershipOptions.find(option => option.value === membershipType);

  const handleDropdownToggle = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!ensName.trim()) {
      newErrors.ensName = 'ENS name is required';
    } else if (!ensName.endsWith('.agora')) {
      newErrors.ensName = 'ENS name must end with .agora';
    }

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (displayName.length > 30) {
      newErrors.displayName = 'Display name must be 30 characters or less';
    }

    // Validate criteria contract and amount for token/NFT membership
    if (membershipType === '1' || membershipType === '2') { // token or nft
      if (!criteriaContract.trim()) {
        newErrors.criteriaContract = 'Contract address is required for token/NFT membership';
      } else if (!/^0x[a-fA-F0-9]{40}$/.test(criteriaContract)) {
        newErrors.criteriaContract = 'Please enter a valid Ethereum address';
      }

      if (!criteriaAmount.trim()) {
        newErrors.criteriaAmount = 'Amount is required for token/NFT membership';
      } else if (isNaN(criteriaAmount) || parseInt(criteriaAmount) <= 0) {
        newErrors.criteriaAmount = 'Please enter a valid positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('Form submitted');
    console.log('isConnected:', isConnected);
    console.log('ensName:', ensName);
    console.log('displayName:', displayName);

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    if (!isConnected) {
      console.log('Wallet not connected');
      setErrors({ general: 'Please connect your wallet first' });
      return;
    }

    console.log('Calling writeContract...');
    writeContract({
      address: SPACE_REGISTRY_ADDRESS,
      abi: spaceRegistryAbi.abi,
      functionName: 'createSpace',
      args: [
        ensName,
        displayName,
        parseInt(membershipType),
        membershipType === '0' ? ZERO_ADDRESS : criteriaContract,
        membershipType === '0' ? 0 : parseInt(criteriaAmount)
      ],
    });
  };

  // Handle successful transaction
  useEffect(() => {
    console.log('Transaction status - hash:', hash, 'isSuccess:', isSuccess, 'isConfirming:', isConfirming);
    if (isSuccess && hash) {
      console.log('Space creation successful! Transaction hash:', hash);
      setSuccess(true);
      setErrors({});
      // Redirect to the newly created space page
      const spaceName = ensName.replace('.agora', '');
      setTimeout(() => {
        router.push(`/app/${spaceName}`);
      }, 2000); // Small delay to show success message
    }
  }, [isSuccess, hash, isConfirming, ensName, router]);

  // Reset success state when transaction completes
  if (isSuccess && !success) {
    setSuccess(true);
  }

  if (!mounted || !isConnected) {
    return (
      <Card className="w-full max-w-2xl bg-white/80 border-[#E8DCC4]/30">
        <CardHeader>
          <CardTitle className="text-black">Create New Governance Space</CardTitle>
          <CardDescription className="text-black">
            Create a decentralized governance space backed by .agora domain ownership.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to create a space.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl bg-white/80 border-[#E8DCC4]/30">
      <CardHeader>
        <CardTitle className="text-black">Create New Governance Space</CardTitle>
        <CardDescription className="text-black">
          Create a decentralized governance space backed by .agora domain ownership.
          You must own the .agora domain to create a space.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Space created successfully!
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message || 'An error occurred while creating the space.'}
            </AlertDescription>
          </Alert>
        )}

        {errors.general && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.general}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ensName">.agora Domain *</Label>
            <Input
              id="ensName"
              type="text"
              placeholder="e.g., myspace.agora"
              value={ensName}
              onChange={(e) => setEnsName(e.target.value)}
              className={`bg-white/50 border-[#E8DCC4]/30 ${errors.ensName ? 'border-red-500' : ''}`}
            />
            {errors.ensName && (
              <p className="text-sm text-red-600">{errors.ensName}</p>
            )}
            <p className="text-sm text-black">
              You must own this .agora domain to create a space.{' '}
              <a
                href="/app/spaces/ens"
                className="text-[#4D89B0] hover:text-[#4D89B0]/80 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Register a new .agora name →
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="e.g., My Governance Space"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={`bg-white/50 border-[#E8DCC4]/30 ${errors.displayName ? 'border-red-500' : ''}`}
            />
            {errors.displayName && (
              <p className="text-sm text-red-600">{errors.displayName}</p>
            )}
            <p className="text-sm text-black">
              Maximum 30 characters. This will be displayed in the UI.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="membershipType">Membership Type</Label>
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 w-full px-3 py-2 rounded-md transition-colors duration-200 font-medium text-sm border border-[#E8DCC4]/30 bg-white/50 cursor-pointer"
                onClick={handleDropdownToggle}
              >
                {selectedOption && (
                  <>
                    <selectedOption.icon className="h-4 w-4 text-[#4D89B0]" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-black">{selectedOption.name}</div>
                      <div className="text-xs text-[#4D89B0]/70">{selectedOption.description}</div>
                    </div>
                  </>
                )}
                <ChevronDown className="h-4 w-4 text-[#4D89B0]/60" />
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div
                  className="absolute top-full left-0 mt-1 w-full rounded-md shadow-lg z-50 animate-in fade-in-0 zoom-in-95"
                  style={{ backgroundColor: '#ffffff', border: `1px solid #4D89B020` }}
                >
                  <div className="py-1">
                    {membershipOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors duration-150 w-full text-left cursor-pointer"
                        onClick={() => {
                          setMembershipType(option.value);
                          setDropdownOpen(false);
                        }}
                      >
                        <option.icon className="h-4 w-4 text-[#4D89B0]" />
                        <div>
                          <div className="font-medium text-black">{option.name}</div>
                          <div className="text-xs text-[#4D89B0]/70">{option.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="text-sm text-black">
              Choose how members can join your space.
            </p>
          </div>

          {(membershipType === '1' || membershipType === '2') && (
            <>
              <div className="space-y-2">
                <Label htmlFor="criteriaContract">
                  {membershipType === '1' ? 'Token Contract Address' : 'NFT Contract Address'} *
                </Label>
                <Input
                  id="criteriaContract"
                  type="text"
                  placeholder="0x..."
                  value={criteriaContract}
                  onChange={(e) => setCriteriaContract(e.target.value)}
                  className={`bg-white/50 border-[#E8DCC4]/30 ${errors.criteriaContract ? 'border-red-500' : ''}`}
                />
                {errors.criteriaContract && (
                  <p className="text-sm text-red-600">{errors.criteriaContract}</p>
                )}
                <p className="text-sm text-black">
                  The contract address for the {membershipType === '1' ? 'ERC-20 token' : 'ERC-721/ERC-1155 NFT'} required for membership.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="criteriaAmount">
                  Minimum {membershipType === '1' ? 'Token Amount' : 'NFT Count'} *
                </Label>
                <Input
                  id="criteriaAmount"
                  type="number"
                  placeholder="1"
                  min="1"
                  value={criteriaAmount}
                  onChange={(e) => setCriteriaAmount(e.target.value)}
                  className={`bg-white/50 border-[#E8DCC4]/30 ${errors.criteriaAmount ? 'border-red-500' : ''}`}
                />
                {errors.criteriaAmount && (
                  <p className="text-sm text-red-600">{errors.criteriaAmount}</p>
                )}
                <p className="text-sm text-black">
                  Minimum amount of {membershipType === '1' ? 'tokens' : 'NFTs'} required to join the space.
                </p>
              </div>
            </>
          )}

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isPending || isConfirming}
              className="flex-1 bg-[#4D89B0] hover:bg-[#4D89B0]/90 text-white"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isPending ? 'Creating Space...' : 'Confirming...'}
                </>
              ) : (
                'Create Space'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}