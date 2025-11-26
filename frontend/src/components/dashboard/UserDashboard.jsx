"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import {
  Users,
  Vote,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Calendar,
  BarChart3,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCategorizedSpaces, useUserVotes, useProposalsBySpaces } from '@/hooks/useSubgraph';

export function UserDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const { address } = useAccount();
  const router = useRouter();

  const { categorizedSpaces, loading: spacesLoading } = useCategorizedSpaces(address);
  const allSpaces = React.useMemo(() => {
    if (!categorizedSpaces) return [];
    return [
      ...categorizedSpaces.owned,
      ...categorizedSpaces.admin,
      ...categorizedSpaces.member
    ];
  }, [categorizedSpaces]);
  const spaceIds = allSpaces?.map(space => space.spaceId) || [];
  
  // Limit proposals query to recent/active ones only
  const { data: proposalsData, isLoading: proposalsLoading } = useProposalsBySpaces(
    spaceIds.slice(0, 10), // Limit to first 10 spaces for performance
    !!address && spaceIds.length > 0
  );
  
  // Limit votes to recent ones
  const { data: votesData, isLoading: votesLoading } = useUserVotes(address);

  // Compute user stats (show available data)
  const userStats = {
    joinedSpaces: allSpaces?.length || 0,
    activeProposals: proposalsLoading ? '...' : (proposalsData?.proposalCreateds?.filter(p => {
      const now = Math.floor(Date.now() / 1000);
      return p.p_start <= now && p.p_end > now;
    }).length || 0),
    votesCast: votesLoading ? '...' : (votesData?.votes?.length || 0),
    spacesCreated: categorizedSpaces?.owned?.length || 0
  };

  // Joined spaces
  const joinedSpaces = allSpaces?.slice(0, 5).map(space => {
    // Prioritize ENS name with .agora for navigation
    const spaceName = space.ensName ? 
      (space.ensName.endsWith('.agora') ? space.ensName : `${space.ensName}.agora`) : 
      (space.displayName || `Space ${space.spaceId.slice(0, 8)}`);
    
    return {
      id: space.spaceId,
      name: spaceName,
      displayName: space.displayName || space.ensName || `Space ${space.spaceId.slice(0, 8)}`,
      role: space.role === 'owner' ? 'Owner' : space.role === 'admin' ? 'Admin' : 'Member',
      activeProposals: proposalsLoading ? '...' : (proposalsData?.proposalCreateds?.filter(p => 
        p.spaceId === space.spaceId && 
        p.p_start <= Math.floor(Date.now() / 1000) && 
        p.p_end > Math.floor(Date.now() / 1000)
      ).length || 0),
      lastActivity: 'Recent'
    };
  }) || [];

  // Active proposals
  const activeProposals = proposalsLoading ? [] : (proposalsData?.proposalCreateds?.filter(p => {
    const now = Math.floor(Date.now() / 1000);
    return p.p_start <= now && p.p_end > now;
  }).slice(0, 10).map(p => {  // Limit to 10 active proposals
    const space = allSpaces?.find(s => s.spaceId === p.spaceId);
    return {
      id: p.proposalId,
      spaceName: space?.displayName || space?.ensName || `Space ${p.spaceId.slice(0, 8)}`,
      title: p.p_title,
      status: 'active',
      timeLeft: `${Math.ceil((p.p_end - Math.floor(Date.now() / 1000)) / 86400)} days`,
      userVote: null,
      totalVotes: 0
    };
  }) || []);

  // Recent activity from votes
  const recentActivity = votesLoading ? [] : (votesData?.votes?.slice(0, 5).map(vote => {
    return {
      id: vote.id,
      type: "vote",
      spaceName: "Unknown Space",
      description: `Voted at ${new Date(vote.timestamp * 1000).toLocaleString()}`,
      time: new Date(vote.blockTimestamp * 1000).toLocaleString()
    };
  }) || []);

  const activityLoading = votesLoading;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'proposals', label: 'Active Proposals' },
    { id: 'activity', label: 'Recent Activity' }
  ];

  if (spacesLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        <div className="bg-white/80 rounded-lg border border-[#E8DCC4]/30 p-6">
          <h1 className="text-2xl font-bold text-black mb-2">Welcome back!</h1>
          <p className="text-black">Loading your governance activity...</p>
        </div>
      </motion.div>
    );
  }

  // Show partial data even if proposals/votes are still loading
  const showPartialData = !spacesLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Welcome Header */}
      <div className="bg-white/80 rounded-lg border border-[#E8DCC4]/30 p-6">
        <h1 className="text-2xl font-bold text-black mb-2">Welcome back!</h1>
        <p className="text-black">Here's your governance activity overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white/80 rounded-lg border border-[#E8DCC4]/30 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#4D89B0]/10 rounded-lg">
              <Users className="h-5 w-5 text-[#4D89B0]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-black">{userStats.joinedSpaces}</p>
              <p className="text-sm text-black">Joined Spaces</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white/80 rounded-lg border border-[#E8DCC4]/30 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#4D89B0]/10 rounded-lg">
              <Vote className="h-5 w-5 text-[#4D89B0]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-black">{userStats.activeProposals}</p>
              <p className="text-sm text-black">Active Proposals</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white/80 rounded-lg border border-[#E8DCC4]/30 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#4D89B0]/10 rounded-lg">
              <CheckCircle className="h-5 w-5 text-[#4D89B0]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-black">{userStats.votesCast}</p>
              <p className="text-sm text-black">Votes Cast</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-white/80 rounded-lg border border-[#E8DCC4]/30 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#4D89B0]/10 rounded-lg">
              <BarChart3 className="h-5 w-5 text-[#4D89B0]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-black">{userStats.spacesCreated}</p>
              <p className="text-sm text-black">Spaces Created</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-[#E8DCC4]/20 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white shadow-sm text-black'
                : 'text-black hover:text-[#4D89B0]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Spaces */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white/80 rounded-lg border border-[#E8DCC4]/30 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black">My Spaces</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-black hover:text-white border border-[#4D89B0] hover:bg-[#4D89B0]"
                onClick={() => router.push('/app/spaces/my')}
              >
                View All
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {joinedSpaces.map((space) => (
                <div key={space.id} className="flex items-center justify-between p-3 bg-[#E8DCC4]/10 rounded-lg">
                  <div>
                    <p className="font-medium text-black">{space.displayName}</p>
                    <p className="text-sm text-black">{space.role} • {space.activeProposals} active proposals</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-[#4D89B0] text-black hover:bg-[#4D89B0] hover:text-white"
                    onClick={() => router.push(`/app/${encodeURIComponent(space.name)}`)}
                  >
                    Enter
                  </Button>
                </div>
              ))}
              {proposalsLoading && joinedSpaces.length > 0 && (
                <div className="text-center py-2 text-black text-sm">
                  Loading proposal counts...
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white/80 rounded-lg border border-[#E8DCC4]/30 p-6"
          >
            <h2 className="text-lg font-semibold text-black mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.slice(0, 4).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="p-1 bg-[#4D89B0]/10 rounded">
                    {activity.type === 'vote' && <Vote className="h-3 w-3 text-[#4D89B0]" />}
                    {activity.type === 'proposal' && <MessageSquare className="h-3 w-3 text-[#4D89B0]" />}
                    {activity.type === 'join' && <Users className="h-3 w-3 text-[#4D89B0]" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-black">{activity.description}</p>
                    <p className="text-xs text-black">{activity.spaceName} • {activity.time}</p>
                  </div>
                </div>
              ))}
              {votesLoading && (
                <div className="text-center py-2 text-black text-sm">
                  Loading recent activity...
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'proposals' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-4"
        >
          {activeProposals.map((proposal, index) => (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white/80 rounded-lg border border-[#E8DCC4]/30 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-sm text-black mb-1">{proposal.spaceName}</p>
                  <h3 className="text-lg font-semibold text-black">{proposal.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#4D89B0]/60" />
                  <span className="text-sm text-black">{proposal.timeLeft} left</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Vote className="h-4 w-4 text-[#4D89B0]/60" />
                    <span className="text-sm text-black">{proposal.totalVotes} votes</span>
                  </div>
                  {proposal.userVote && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-[#4D89B0]" />
                      <span className="text-sm text-[#4D89B0]">Voted {proposal.userVote}</span>
                    </div>
                  )}
                </div>

                {proposal.userVote ? (
                  <Button size="sm" variant="outline" disabled>
                    Vote Submitted
                  </Button>
                ) : (
                  <Button size="sm" className="bg-[#4D89B0] hover:bg-[#4D89B0]/90 text-white">
                    Cast Vote
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
          {proposalsLoading && activeProposals.length === 0 && (
            <div className="text-center py-8 text-black">
              Loading active proposals...
            </div>
          )}
          {proposalsLoading && activeProposals.length > 0 && (
            <div className="text-center py-4 text-black text-sm">
              Loading more proposals...
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'activity' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/80 rounded-lg border border-[#E8DCC4]/30 p-6"
        >
          <h2 className="text-lg font-semibold text-black mb-6">Activity Timeline</h2>
          <div className="space-y-6">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-start gap-4"
              >
                <div className="flex flex-col items-center">
                  <div className={`p-2 rounded-full bg-[#4D89B0]/10`}>
                    {activity.type === 'vote' && <Vote className="h-4 w-4 text-[#4D89B0]" />}
                    {activity.type === 'proposal' && <MessageSquare className="h-4 w-4 text-[#4D89B0]" />}
                    {activity.type === 'join' && <Users className="h-4 w-4 text-[#4D89B0]" />}
                  </div>
                  {index < recentActivity.length - 1 && (
                    <div className="w-px h-8 bg-[#E8DCC4]/30 mt-2"></div>
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <p className="text-black font-medium">{activity.description}</p>
                  <p className="text-sm text-black mt-1">
                    {activity.spaceName} • {activity.time}
                  </p>
                </div>
              </motion.div>
            ))}
            {activityLoading && recentActivity.length === 0 && (
              <div className="text-center py-8 text-black">
                Loading activity timeline...
              </div>
            )}
            {activityLoading && recentActivity.length > 0 && (
              <div className="text-center py-4 text-black text-sm">
                Loading more activity...
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}