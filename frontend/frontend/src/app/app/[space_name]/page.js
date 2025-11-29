"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Calendar, Settings, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { ProposalTable } from '@/components/dashboard/ProposalTable';
import { CreateProposalDialog } from '@/components/dashboard/CreateProposalDialog';
import Link from 'next/link';

// Import the SpaceRegistry ABI
import spaceRegistryAbi from '@/abis/SpaceRegistry.json';
import { useSpaceByEns, useAdminSpaceIds, useLatestDisplayNameUpdates, useProposalsBySpace, useMemberCounts, useMemberSpaceIds } from '@/hooks/useSubgraph';

// Contract addresses from environment
const SPACE_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_SPACE_REGISTRY_ADDRESS;  export default function SpacePage() {
    const params = useParams();
    const spaceName = params.space_name;
    const { address, isConnected } = useAccount();
    const [isOwner, setIsOwner] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isMember, setIsMember] = useState(false);
    const [manageMembersOpen, setManageMembersOpen] = useState(false);
    const [adminAddressInput, setAdminAddressInput] = useState('');
    const [newDisplayNameInput, setNewDisplayNameInput] = useState('');
    const [newOwnerAddressInput, setNewOwnerAddressInput] = useState('');
    const [showOverview, setShowOverview] = useState(true);
    const [showProposals, setShowProposals] = useState(true);
    const [showHeaderOverview, setShowHeaderOverview] = useState(false);
    // Local optimistic override to show the updated display name immediately
    const [displayNameOverride, setDisplayNameOverride] = useState('');

  // Contract interaction (write)
  const { writeContract: writeContract, data: txHash, isPending: isTxPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: txSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Use centralized hooks for subgraph queries
  const { data, isLoading: loading, error } = useSpaceByEns(spaceName);
  const { data: adminSpaceIdsData, isLoading: adminSpaceIdsLoading, error: adminSpaceIdsError } = useAdminSpaceIds(address, isConnected);
  const { data: memberSpaceIdsData, isLoading: memberSpaceIdsLoading, error: memberSpaceIdsError } = useMemberSpaceIds(address, isConnected);

  const spaceData = data?.spaces?.[0];

  const { data: proposalsData, isLoading: proposalsLoading, error: proposalsError } = useProposalsBySpace(spaceData?.spaceId, !!spaceData?.spaceId);

  // Query the latest display name update for this space
  const { data: displayNameUpdateData } = useLatestDisplayNameUpdates(spaceData?.spaceId ? [spaceData.spaceId] : []);

  // Query member count for this space
  const { data: memberCountsData } = useMemberCounts(spaceData?.spaceId ? [spaceData.spaceId] : [], !!spaceData?.spaceId);

  // Calculate member count from subgraph data
  const displayMemberCount = memberCountsData?.[spaceData?.spaceId] || 0;

  // Compute the current display name: prefer optimistic override, then latest event, then space data
  const currentDisplayName = displayNameOverride ||
    (displayNameUpdateData?.spaceDisplayNameUpdateds?.find(update => update.spaceId === spaceData?.spaceId)?.newDisplayName) ||
    spaceData?.displayName ||
    '';

  // Set isOwner and isAdmin when we have space data
  useEffect(() => {
    if (!spaceData) return;
    setIsOwner(spaceData.owner.toLowerCase() === address?.toLowerCase());
  }, [spaceData, address]);

  // Set isAdmin when we have both space data and admin event data
  useEffect(() => {
    if (!data?.spaces?.[0] || !adminSpaceIdsData?.adminAddeds) return;
    const spaceId = data.spaces[0].spaceId;
    const isAdminNow = adminSpaceIdsData.adminAddeds.some(a => a.spaceId === spaceId);
    setIsAdmin(isAdminNow);
  }, [data, adminSpaceIdsData]);

  // Set isMember when we have space data and member space IDs
  useEffect(() => {
    if (!data?.spaces?.[0] || !memberSpaceIdsData?.memberJoineds) return;
    const spaceId = data.spaces[0].spaceId;
    const isMemberNow = memberSpaceIdsData.memberJoineds.some(m => m.spaceId === spaceId);
    setIsMember(isMemberNow);
  }, [data, memberSpaceIdsData]);

  // Set initial display name input when space data loads
  useEffect(() => {
    if (spaceData?.displayName && !newDisplayNameInput) {
      setNewDisplayNameInput(spaceData.displayName);
    }
  }, [spaceData, newDisplayNameInput]);

  // Handle joining space
  const handleJoinSpace = () => {
    if (!spaceData?.spaceId || !address) return;

    writeContract({
      address: SPACE_REGISTRY_ADDRESS,
      abi: spaceRegistryAbi.abi,
      functionName: 'joinSpace',
      args: [spaceData.spaceId],
    });
  };

  // Nominate (add) an admin
  const handleNominateAdmin = async () => {
    if (!adminAddressInput || !spaceData?.spaceId) return;
    writeContract({
      address: SPACE_REGISTRY_ADDRESS,
      abi: spaceRegistryAbi.abi,
      functionName: 'addSpaceAdmin',
      args: [spaceData.spaceId, adminAddressInput],
    });
  };

  // Revoke (remove) an admin
  const handleRevokeAdmin = async () => {
    if (!adminAddressInput || !spaceData?.spaceId) return;
    writeContract({
      address: SPACE_REGISTRY_ADDRESS,
      abi: spaceRegistryAbi.abi,
      functionName: 'removeSpaceAdmin',
      args: [spaceData.spaceId, adminAddressInput],
    });
  };

  // Update display name (owner or admin)
  const handleUpdateDisplayName = async () => {
    if (!newDisplayNameInput || !spaceData?.spaceId) return;
    writeContract({
      address: SPACE_REGISTRY_ADDRESS,
      abi: spaceRegistryAbi.abi,
      functionName: 'updateSpaceDisplayName',
      args: [spaceData.spaceId, newDisplayNameInput],
    });
  };

  // Deactivate space (owner only)
  const handleDeactivateSpace = async () => {
    if (!spaceData?.spaceId) return;
    writeContract({
      address: SPACE_REGISTRY_ADDRESS,
      abi: spaceRegistryAbi.abi,
      functionName: 'deactivateSpace',
      args: [spaceData.spaceId],
    });
  };

  // Transfer ownership (owner only)
  const handleTransferOwnership = async () => {
    if (!newOwnerAddressInput || !spaceData?.spaceId) return;
    writeContract({
      address: SPACE_REGISTRY_ADDRESS,
      abi: spaceRegistryAbi.abi,
      functionName: 'transferOwnership',
      args: [spaceData.spaceId, newOwnerAddressInput],
    });
  };

  // Query client for invalidation
  const queryClient = useQueryClient();

  // Refresh data after successful transaction — invalidate the space query and apply an optimistic override
  useEffect(() => {
    if (txSuccess) {
      // Invalidate the space query so fresh data is fetched from the subgraph
      queryClient.invalidateQueries(['spaceByEns', spaceName]);
      // Also invalidate the display name update query
      queryClient.invalidateQueries(['latestDisplayNameUpdate', spaceData?.spaceId]);
      // Invalidate member count query to refresh after join/leave operations
      queryClient.invalidateQueries(['memberCounts']);

      // Optimistically update the UI with the new display name while the subgraph indexes the change
      if (newDisplayNameInput) {
        setDisplayNameOverride(newDisplayNameInput);
      }
    }
  }, [txSuccess, queryClient, spaceName, spaceData?.spaceId, newDisplayNameInput]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[#E8DCC4]/20 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#4D89B0]" />
      </div>
    );
  }

  if (error || !spaceData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[#E8DCC4]/20 to-white">
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive" className="bg-white/80 border-[#E8DCC4]/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-black">
              Space &quot;{spaceName}&quot; not found or does not exist.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#E8DCC4]/20 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Space Header */}
          <Card className="bg-white/80 border-[#E8DCC4]/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl text-black">{currentDisplayName}</CardTitle>
                  <CardDescription className="text-lg text-black">
                    {spaceData.ensName}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={spaceData.isActive ? "default" : "secondary"} className={spaceData.isActive ? "bg-[#4D89B0] text-white" : ""}>
                    {spaceData.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {(isOwner || isAdmin) ? (
                    <>
                      {isOwner ? (
                        <Badge variant="outline" className="border-[#4D89B0] text-[#4D89B0]">Owner</Badge>
                      ) : (
                        <Badge variant="outline" className="border-[#4D89B0] text-[#4D89B0]">Admin</Badge>
                      )}
                    </>
                  ) : isMember ? (
                    <Badge variant="outline" className="border-[#4D89B0] text-[#4D89B0]">Member</Badge>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHeaderOverview(!showHeaderOverview)}
                    className="text-[#4D89B0] hover:bg-transparent p-1 h-6 w-6 cursor-pointer"
                  >
                    {showHeaderOverview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showHeaderOverview && (
                <div className="mb-4">
                  <p className="text-black">
                    Learn about this governance space and its activities. Space functionality coming soon. This space was created through the SpaceRegistry contract with ENS verification.
                  </p>
                  {!isConnected && (
                    <p className="text-sm text-black mt-2">
                      Connect your wallet to interact with this space.
                    </p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#4D89B0]/60" />
                  <span className="text-sm text-black">{displayMemberCount.toString()} members</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#4D89B0]/60" />
                  <span className="text-sm text-black">
                    Created: {new Date(Number(spaceData.createdAt) * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Space Content */}
          <div className="space-y-6">
            {/* Proposals Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-black">All Proposals</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProposals(!showProposals)}
                  className="text-[#4D89B0] hover:bg-[#4D89B0]/10 cursor-pointer"
                >
                  {showProposals ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
              {showProposals && (
                <>
                  {(isMember || isAdmin || isOwner) ? (
                    <ProposalTable
                      proposals={proposalsData?.proposalCreateds || []}
                      loading={proposalsLoading}
                      error={proposalsError}
                      spaceName={spaceName}
                      title=""
                    />
                  ) : (
                    <Card className="bg-white/80 border-[#E8DCC4]/30">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Users className="h-12 w-12 text-[#4D89B0]/60 mb-4" />
                        <h3 className="text-lg font-semibold text-black mb-2">Join Space to View Proposals</h3>
                        <p className="text-sm text-black/70 text-center mb-4">
                          You need to be a member of this space to view and participate in proposals.
                        </p>
                        {isConnected ? (
                          <Button
                            onClick={handleJoinSpace}
                            disabled={isTxPending || isConfirming}
                            className="bg-[#4D89B0] hover:bg-[#4D89B0]/90 text-white cursor-pointer"
                          >
                            {isTxPending || isConfirming ? 'Joining...' : 'Join Space'}
                          </Button>
                        ) : (
                          <p className="text-sm text-black/70">Connect your wallet to join this space.</p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>

            {(isOwner || isAdmin) ? (
              /* Owner/Admin View */
              <>
                <Card className="bg-white/80 border-[#E8DCC4]/30">
                  <CardHeader>
                    <CardTitle className="text-black">Space Management</CardTitle>
                    <CardDescription className="text-black">
                      Manage your space settings and create governance proposals.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <CreateProposalDialog
                        spaceId={spaceData.spaceId}
                        spaceName={currentDisplayName}
                      />
                      <div className="flex items-center gap-2">
                        {isOwner && (
                          <Button variant="outline" className="flex items-center gap-2 border-[#4D89B0] text-black hover:bg-[#4D89B0] hover:text-white cursor-pointer" onClick={() => setManageMembersOpen(!manageMembersOpen)}>
                            <Users className="h-4 w-4" />
                            Manage Space
                          </Button>
                        )}
                      </div>
                    </div>
                    {manageMembersOpen && (
                      <div className="mt-6 space-y-4 border-t border-[#E8DCC4]/30 pt-4">
                        <div className="flex flex-col md:flex-row gap-2">
                          <input
                            type="text"
                            placeholder="0xAdminAddress"
                            value={adminAddressInput}
                            onChange={(e) => setAdminAddressInput(e.target.value)}
                            className="w-full md:w-2/3 border border-[#E8DCC4]/30 rounded px-3 py-2 bg-white/50"
                          />
                          <div className="flex gap-2">
                            <Button onClick={handleNominateAdmin} disabled={isTxPending || isConfirming} className="bg-[#4D89B0] hover:bg-[#4D89B0]/90 text-white cursor-pointer">Nominate Admin</Button>
                            <Button variant="ghost" onClick={handleRevokeAdmin} disabled={isTxPending || isConfirming} className="border-[#4D89B0] text-black hover:bg-[#4D89B0] hover:text-white cursor-pointer">Revoke Admin</Button>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-[#E8DCC4]/30">
                          <p className="text-sm text-black mb-2">Update space display name</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Enter new display name"
                              value={newDisplayNameInput}
                              onChange={(e) => setNewDisplayNameInput(e.target.value)}
                              className="flex-1 border border-[#E8DCC4]/30 rounded px-3 py-2 bg-white/50"
                            />
                            <Button onClick={handleUpdateDisplayName} disabled={isTxPending || isConfirming || !spaceData || newDisplayNameInput === spaceData.displayName} className="bg-[#4D89B0] hover:bg-[#4D89B0]/90 text-white cursor-pointer">Update</Button>
                          </div>
                        </div>

                        {isOwner && (
                          <>
                            <div className="pt-4 border-t border-[#E8DCC4]/30">
                              <p className="text-sm text-black mb-2">Transfer ownership</p>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="0xNewOwnerAddress"
                                  value={newOwnerAddressInput}
                                  onChange={(e) => setNewOwnerAddressInput(e.target.value)}
                                  className="flex-1 border border-[#E8DCC4]/30 rounded px-3 py-2 bg-white/50"
                                />
                                <Button onClick={handleTransferOwnership} disabled={isTxPending || isConfirming} className="bg-[#4D89B0] hover:bg-[#4D89B0]/90 text-white cursor-pointer">Transfer</Button>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-[#9e0e40]">
                              <p className="text-sm text-black mb-2">Deactivate space</p>
                              <Button onClick={handleDeactivateSpace} disabled={isTxPending || isConfirming} variant="destructive" className="bg-[#9e0e40] hover:bg-[#9e0e40]/90 text-white cursor-pointer">Deactivate Space</Button>
                            </div>
                          </>
                        )}

                        {writeError && (
                          <div className="text-sm text-red-600">{writeError.message}</div>
                        )}
                        {isTxPending && (
                          <div className="text-sm text-black">Transaction pending...</div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              /* Public View - No additional content */
              null
            )}
          </div>
        </div>
      </div>
    </div>
  );
}