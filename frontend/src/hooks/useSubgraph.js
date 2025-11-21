"use client";
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { gql, request } from 'graphql-request';

// Subgraph endpoint
const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/1715807/agora-sub/0.0.4';

// GraphQL queries
const GET_SPACES_BY_OWNER = gql`
  query GetSpacesByOwner($owner: Bytes!) {
    spaces(where: { owner: $owner }) {
      id
      spaceId
      ensName
      displayName
      owner
      createdAt
      isActive
      memberCount
      adminCount
    }
  }
`;

const GET_MEMBER_SPACES = gql`
  query GetMemberSpaces($member: Bytes!) {
    memberJoineds(where: { member: $member }) {
      spaceId
    }
  }
`;

const GET_MEMBER_SPACES_DETAILS = gql`
  query GetMemberSpacesDetails($spaceIds: [Bytes!]!) {
    spaces(where: { spaceId_in: $spaceIds }) {
      id
      spaceId
      ensName
      displayName
      owner
      createdAt
      isActive
      memberCount
      adminCount
    }
  }
`;

const GET_ADMIN_SPACES = gql`
  query GetAdminSpaces($admin: Bytes!) {
    adminAddeds(where: { admin: $admin }) {
      spaceId
    }
  }
`;

const GET_ADMIN_SPACES_DETAILS = gql`
  query GetAdminSpacesDetails($spaceIds: [Bytes!]!) {
    spaces(where: { spaceId_in: $spaceIds }) {
      id
      spaceId
      ensName
      displayName
      owner
      createdAt
      isActive
      memberCount
      adminCount
    }
  }
`;

const GET_SPACE_BY_ENS = gql`
  query GetSpaceByEns($ensName: String!) {
    spaces(where: { ensName: $ensName }) {
      id
      spaceId
      ensName
      displayName
      owner
      createdAt
      isActive
      memberCount
      adminCount
    }
  }
`;

const GET_LATEST_DISPLAY_NAME_UPDATES = gql`
  query GetLatestDisplayNameUpdates($spaceIds: [Bytes!]!) {
    spaceDisplayNameUpdateds(where: { spaceId_in: $spaceIds }, orderBy: blockTimestamp, orderDirection: desc) {
      spaceId
      newDisplayName
      blockTimestamp
    }
  }
`;

const GET_PROPOSALS_BY_SPACE = gql`
  query GetProposalsBySpace($spaceId: Bytes!) {
    proposalCreateds(where: { spaceId: $spaceId }, orderBy: blockTimestamp, orderDirection: desc) {
      id
      proposalId
      proposal
      p_title
      p_bodyURI
      p_discussionURI
      p_app
      p_pType
      p_choices
      p_start
      p_end
      p_execTargets
      p_execValues
      p_execCalldatas
      p_execStrategy
      p_eligibilityType
      p_eligibilityToken
      p_eligibilityThreshold
      p_creator
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

const GET_PROPOSAL_BY_ID = gql`
  query GetProposalById($proposalId: Bytes!) {
    proposalCreateds(where: { proposalId: $proposalId }) {
      id
      proposalId
      proposal
      p_title
      p_bodyURI
      p_discussionURI
      p_app
      p_pType
      p_choices
      p_start
      p_end
      p_execTargets
      p_execValues
      p_execCalldatas
      p_execStrategy
      p_eligibilityType
      p_eligibilityToken
      p_eligibilityThreshold
      p_creator
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

// Hook for spaces owned by an address
export function useSpacesByOwner(ownerAddress, enabled = true) {
  return useQuery({
    queryKey: ['spacesByOwner', ownerAddress],
    queryFn: async () => {
      if (!ownerAddress) return null;
      return await request(SUBGRAPH_URL, GET_SPACES_BY_OWNER, { owner: ownerAddress });
    },
    enabled: enabled && !!ownerAddress,
  });
}

// Hook for member space IDs
export function useMemberSpaceIds(memberAddress, enabled = true) {
  return useQuery({
    queryKey: ['memberSpaceIds', memberAddress],
    queryFn: async () => {
      if (!memberAddress) return null;
      return await request(SUBGRAPH_URL, GET_MEMBER_SPACES, { member: memberAddress });
    },
    enabled: enabled && !!memberAddress,
  });
}

// Hook for member spaces details
export function useMemberSpaces(spaceIds, enabled = true) {
  return useQuery({
    queryKey: ['memberSpacesDetails', spaceIds],
    queryFn: async () => {
      if (!spaceIds?.length) return null;
      return await request(SUBGRAPH_URL, GET_MEMBER_SPACES_DETAILS, { spaceIds });
    },
    enabled: enabled && !!spaceIds?.length,
  });
}

// Hook for admin space IDs
export function useAdminSpaceIds(adminAddress, enabled = true) {
  return useQuery({
    queryKey: ['adminSpaceIds', adminAddress],
    queryFn: async () => {
      if (!adminAddress) return null;
      return await request(SUBGRAPH_URL, GET_ADMIN_SPACES, { admin: adminAddress });
    },
    enabled: enabled && !!adminAddress,
  });
}

// Hook for admin spaces details
export function useAdminSpaces(spaceIds, enabled = true) {
  return useQuery({
    queryKey: ['adminSpacesDetails', spaceIds],
    queryFn: async () => {
      if (!spaceIds?.length) return null;
      return await request(SUBGRAPH_URL, GET_ADMIN_SPACES_DETAILS, { spaceIds });
    },
    enabled: enabled && !!spaceIds?.length,
  });
}

// Hook for single space by ENS name
export function useSpaceByEns(ensName, enabled = true) {
  return useQuery({
    queryKey: ['spaceByEns', ensName],
    queryFn: async () => {
      if (!ensName) return null;
      const normalizedEns = ensName.endsWith('.eth') ? ensName : `${ensName}.eth`;
      return await request(SUBGRAPH_URL, GET_SPACE_BY_ENS, { ensName: normalizedEns });
    },
    enabled: enabled && !!ensName,
  });
}

// Hook for latest display name updates for multiple spaces
export function useLatestDisplayNameUpdates(spaceIds, enabled = true) {
  return useQuery({
    queryKey: ['latestDisplayNameUpdates', spaceIds],
    queryFn: async () => {
      if (!spaceIds?.length) return null;
      return await request(SUBGRAPH_URL, GET_LATEST_DISPLAY_NAME_UPDATES, { spaceIds });
    },
    enabled: enabled && !!spaceIds?.length,
  });
}

// Hook for proposals in a space
export function useProposalsBySpace(spaceId, enabled = true) {
  return useQuery({
    queryKey: ['proposalsBySpace', spaceId],
    queryFn: async () => {
      if (!spaceId) return null;
      return await request(SUBGRAPH_URL, GET_PROPOSALS_BY_SPACE, { spaceId });
    },
    enabled: enabled && !!spaceId,
  });
}

// Hook for single proposal by ID
export function useProposalById(proposalId, enabled = true) {
  return useQuery({
    queryKey: ['proposalById', proposalId],
    queryFn: async () => {
      if (!proposalId) return null;
      return await request(SUBGRAPH_URL, GET_PROPOSAL_BY_ID, { proposalId });
    },
    enabled: enabled && !!proposalId,
  });
}

// Combined hook for all user spaces categorized by role
export function useCategorizedSpaces(userAddress, enabled = true) {
  const { data: ownerData, isLoading: ownerLoading, error: ownerError } = useSpacesByOwner(userAddress, enabled);
  const { data: memberSpaceIdsData, isLoading: memberIdsLoading, error: memberIdsError } = useMemberSpaceIds(userAddress, enabled);
  const { data: adminSpaceIdsData, isLoading: adminIdsLoading, error: adminIdsError } = useAdminSpaceIds(userAddress, enabled);

  const memberSpaceIds = memberSpaceIdsData?.memberJoineds?.map(item => item.spaceId) || [];
  const { data: memberSpacesData, isLoading: memberSpacesLoading, error: memberSpacesError } = useMemberSpaces(memberSpaceIds, enabled && memberSpaceIds.length > 0);

  const adminSpaceIds = adminSpaceIdsData?.adminAddeds?.map(item => item.spaceId) || [];
  const { data: adminSpacesData, isLoading: adminSpacesLoading, error: adminSpacesError } = useAdminSpaces(adminSpaceIds, enabled && adminSpaceIds.length > 0);

  // Collect all space IDs to query display name updates
  const allSpaceIds = React.useMemo(() => {
    const ids = new Set();
    
    // Add owned space IDs
    ownerData?.spaces?.forEach(space => ids.add(space.spaceId));
    
    // Add member space IDs
    memberSpacesData?.spaces?.forEach(space => ids.add(space.spaceId));
    
    // Add admin space IDs
    adminSpacesData?.spaces?.forEach(space => ids.add(space.spaceId));
    
    return Array.from(ids);
  }, [ownerData, memberSpacesData, adminSpacesData]);

  // Query latest display name updates for all spaces
  const { data: displayNameUpdatesData } = useLatestDisplayNameUpdates(allSpaceIds, enabled && allSpaceIds.length > 0);

  // Create a map of spaceId -> latest display name
  const displayNameMap = React.useMemo(() => {
    const map = new Map();
    if (displayNameUpdatesData?.spaceDisplayNameUpdateds) {
      // Group by spaceId and take the most recent update for each
      const updatesBySpaceId = {};
      displayNameUpdatesData.spaceDisplayNameUpdateds.forEach(update => {
        if (!updatesBySpaceId[update.spaceId] || 
            update.blockTimestamp > updatesBySpaceId[update.spaceId].blockTimestamp) {
          updatesBySpaceId[update.spaceId] = update;
        }
      });
      
      Object.values(updatesBySpaceId).forEach(update => {
        map.set(update.spaceId, update.newDisplayName);
      });
    }
    return map;
  }, [displayNameUpdatesData]);

  const categorizedSpaces = React.useMemo(() => {
    const spaces = {
      owned: [],
      admin: [],
      member: []
    };

    // Add owned spaces
    if (ownerData?.spaces) {
      spaces.owned = ownerData.spaces.map(space => ({
        ...space,
        displayName: displayNameMap.get(space.spaceId) || space.displayName,
        role: 'owner'
      }));
    }

    // Add admin spaces (exclude if already owned)
    if (adminSpacesData?.spaces) {
      const ownedIds = new Set(spaces.owned.map(s => s.id));
      spaces.admin = adminSpacesData.spaces
        .filter(space => !ownedIds.has(space.id))
        .map(space => ({
          ...space,
          displayName: displayNameMap.get(space.spaceId) || space.displayName,
          role: 'admin'
        }));
    }

    // Add member spaces (exclude if already owned or admin)
    if (memberSpacesData?.spaces) {
      const ownedIds = new Set(spaces.owned.map(s => s.id));
      const adminIds = new Set(spaces.admin.map(s => s.id));
      spaces.member = memberSpacesData.spaces
        .filter(space => !ownedIds.has(space.id) && !adminIds.has(space.id))
        .map(space => ({
          ...space,
          displayName: displayNameMap.get(space.spaceId) || space.displayName,
          role: 'member'
        }));
    }

    return spaces;
  }, [ownerData, memberSpacesData, adminSpacesData, displayNameMap]);

  const loading = ownerLoading || memberIdsLoading || memberSpacesLoading || adminIdsLoading || adminSpacesLoading;
  const error = ownerError || memberIdsError || memberSpacesError || adminIdsError || adminSpacesError;

  return {
    categorizedSpaces,
    loading,
    error,
    // Individual data for more granular control if needed
    ownerData,
    memberSpacesData,
    adminSpacesData
  };
}