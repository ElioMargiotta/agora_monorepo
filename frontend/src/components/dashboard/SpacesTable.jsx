"use client";
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Crown,
  Shield,
  User,
  Eye,
  Calendar,
  Users,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useProposalsBySpaces } from '@/hooks/useSubgraph';

function getRoleIcon(role) {
  switch (role) {
    case 'owner':
      return <Crown className="h-4 w-4 text-[#4D89B0]" />;
    case 'admin':
      return <Shield className="h-4 w-4 text-[#4D89B0]/80" />;
    case 'member':
      return <User className="h-4 w-4 text-[#4D89B0]/60" />;
    default:
      return <User className="h-4 w-4 text-[#4D89B0]/60" />;
  }
}

function getRoleBadge(role) {
  const variants = {
    owner: 'default',
    admin: 'secondary',
    member: 'outline'
  };

  const labels = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member'
  };

  return (
    <Badge variant={variants[role] || 'outline'} className="flex items-center gap-1">
      {getRoleIcon(role)}
      {labels[role] || role}
    </Badge>
  );
}

function getEligibilityBadge(eligibilityType) {
  const variants = {
    public: 'default',
    token: 'secondary',
    nft: 'outline',
    whitelist: 'destructive'
  };

  const labels = {
    public: 'Public',
    token: 'Token Holder',
    nft: 'NFT Holder',
    whitelist: 'Whitelist'
  };

  return (
    <Badge variant={variants[eligibilityType] || 'outline'} className="flex items-center gap-1">
      {labels[eligibilityType] || eligibilityType}
    </Badge>
  );
}

function getStatusBadge(status) {
  const variants = {
    active: 'default',
    paused: 'secondary',
    archived: 'outline'
  };

  return (
    <Badge variant={variants[status] || 'outline'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function SpaceRow({ space, onToggleExpand, isExpanded, proposalsData, proposalsLoading, showExpandable = true, showEligibilityType = false }) {
  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const getProposalStats = (space) => {
    if (proposalsLoading || !proposalsData?.proposalCreateds) {
      return { open: '...', closed: '...' };
    }

    const spaceProposals = proposalsData.proposalCreateds.filter(p => p.spaceId === space.spaceId);
    const now = Math.floor(Date.now() / 1000);
    
    const openCount = spaceProposals.filter(p => p.p_start <= now && p.p_end > now).length;
    const closedCount = spaceProposals.filter(p => p.p_end <= now).length;
    
    return { open: openCount, closed: closedCount };
  };

  const proposalStats = getProposalStats(space);

  return (
    <>
      <tr className={showExpandable ? "hover:bg-[#4D89B0]/5 cursor-pointer" : "hover:bg-[#4D89B0]/5"} onClick={() => showExpandable && onToggleExpand(space.id)}>
        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            {showExpandable && (
              <button className="mr-2 text-[#4D89B0]/60 hover:text-[#4D89B0]">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            )}
            <div>
              <div className="text-sm font-medium text-black">{space.displayName}</div>
              <div className="text-sm text-[#4D89B0]/70">{space.ensName}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {showEligibilityType ? getEligibilityBadge(space.eligibilityType || 'public') : getRoleBadge(space.role)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-[#4D89B0]/60" />
            {space.memberCount.toString()}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <div className="flex items-center gap-2">
            <span className="text-[#4D89B0]">{proposalStats.open} open</span>
            <span className="text-[#4D89B0]/40">/</span>
            <span className="text-[#4D89B0]/70">{proposalStats.closed} closed</span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-[#4D89B0]/60" />
            {formatDate(space.createdAt)}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {getStatusBadge(space.isActive ? 'active' : 'archived')}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex items-center justify-end gap-2">
            <Link href={`/app/${space.ensName.replace('.agora', '')}`}>
              <Button variant="ghost" size="sm" className="text-[#4D89B0] hover:text-white border border-[#4D89B0] hover:bg-[#4D89B0] transition-colors">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </td>
      </tr>
      {showExpandable && isExpanded && (
        <tr>
          <td colSpan="7" className="px-6 py-4 bg-[#4D89B0]/5">
            <SpaceDetails 
              space={space} 
              proposalsData={proposalsData}
              proposalsLoading={proposalsLoading}
            />
          </td>
        </tr>
      )}
    </>
  );
}

function SpaceDetails({ space, proposalsData, proposalsLoading }) {
  // Get recent proposals for this space
  const recentProposals = useMemo(() => {
    if (proposalsLoading || !proposalsData?.proposalCreateds) {
      return [];
    }

    return proposalsData.proposalCreateds
      .filter(p => p.spaceId === space.spaceId)
      .sort((a, b) => Number(b.p_end) - Number(a.p_end)) // Sort by end date, most recent first
      .slice(0, 6); // Show up to 6 recent proposals
  }, [proposalsData, proposalsLoading, space.spaceId]);

  const getProposalStatus = (proposal) => {
    const now = Math.floor(Date.now() / 1000);
    if (proposal.p_start <= now && proposal.p_end > now) {
      return 'active';
    }
    return 'completed';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-black">Recent Proposals</h4>
      </div>

      {proposalsLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-black mt-2">Loading proposals...</p>
        </div>
      ) : recentProposals.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProposals.map((proposal) => {
              const status = getProposalStatus(proposal);
              return (
                <Card key={proposal.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-medium line-clamp-2">
                        {proposal.p_title}
                      </CardTitle>
                      <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                        {status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-xs text-black">
                      <div className="flex justify-between">
                        <span>Choices: {proposal.p_choices.length}</span>
                        <span>
                          {status === 'active' ? 'Ends:' : 'Ended:'} {new Date(Number(proposal.p_end) * 1000).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs text-[#4D89B0]/70">
                        ID: {proposal.proposalId.slice(0, 10)}...{proposal.proposalId.slice(-6)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-center pt-4">
            <Link href={`/app/${space.ensName ? space.ensName.replace('.agora', '') : space.displayName}`}>
              <Button variant="outline" size="sm" className="border-[#4D89B0] text-black hover:bg-[#4D89B0] hover:text-white">
                View All Proposals
              </Button>
            </Link>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-black">No proposals yet.</p>
        </div>
      )}
    </div>
  );
}

export function SpacesTable({ spaces, loading, error, showFilters = true, title = "Spaces", showExpandable = true, showEligibilityType = false, userJoinedSpaces = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [eligibilityFilter, setEligibilityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hoveredFilter, setHoveredFilter] = useState(null);
  const [hideTimeout, setHideTimeout] = useState(null);

  // Define colors for consistency
  const colors = {
    primary: '#4D89B0', // Zama blue
    white: '#ffffff',
    black: '#000000',
    hoverBg: 'rgba(77, 137, 176, 0.1)',
  };

  // Filter configuration - adapt based on context
  const filterItems = showEligibilityType ? [
    {
      name: 'Eligibility',
      current: eligibilityFilter,
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'public', label: 'Public' },
        { value: 'token', label: 'Token Holder' },
        { value: 'nft', label: 'NFT Holder' },
        { value: 'whitelist', label: 'Whitelist' },
      ],
      onChange: setEligibilityFilter
    },
    {
      name: 'Status',
      current: statusFilter,
      options: [
        { value: 'all', label: 'All Spaces' },
        { value: 'joined', label: 'Joined' },
        { value: 'not-joined', label: 'Not Joined' },
      ],
      onChange: setStatusFilter
    },
    {
      name: 'Sort',
      current: sortBy,
      options: [
        { value: 'created', label: 'Creation Date' },
        { value: 'name', label: 'Name' },
        { value: 'members', label: 'Members' },
      ],
      onChange: setSortBy
    },
    {
      name: 'Order',
      current: sortOrder,
      options: [
        { value: 'desc', label: 'Newest First' },
        { value: 'asc', label: 'Oldest First' },
      ],
      onChange: setSortOrder
    },
    {
      name: 'Display',
      current: pageSize.toString(),
      options: [
        { value: '10', label: '10 per page' },
        { value: '25', label: '25 per page' },
        { value: '50', label: '50 per page' },
      ],
      onChange: (value) => setPageSize(Number(value))
    }
  ] : [
    {
      name: 'Role',
      current: roleFilter,
      options: [
        { value: 'all', label: 'All Roles' },
        { value: 'owner', label: 'Owner' },
        { value: 'admin', label: 'Admin' },
        { value: 'member', label: 'Member' },
      ],
      onChange: setRoleFilter
    },
    {
      name: 'Sort',
      current: sortBy,
      options: [
        { value: 'created', label: 'Creation Date' },
        { value: 'name', label: 'Name' },
        { value: 'members', label: 'Members' },
      ],
      onChange: setSortBy
    },
    {
      name: 'Order',
      current: sortOrder,
      options: [
        { value: 'desc', label: 'Newest First' },
        { value: 'asc', label: 'Oldest First' },
      ],
      onChange: setSortOrder
    },
    {
      name: 'Display',
      current: pageSize.toString(),
      options: [
        { value: '10', label: '10 per page' },
        { value: '25', label: '25 per page' },
        { value: '50', label: '50 per page' },
      ],
      onChange: (value) => setPageSize(Number(value))
    }
  ];

  const handleMouseEnter = (filterName) => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
    setHoveredFilter(filterName);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setHoveredFilter(null);
    }, 300); // 300ms delay before hiding
    setHideTimeout(timeout);
  };

  // Flatten spaces from categorized structure or simple array
  const allSpaces = useMemo(() => {
    if (!spaces) return [];

    // Check if spaces is an object with categorized keys or a simple object with 'all' key
    if (typeof spaces === 'object' && !Array.isArray(spaces)) {
      const flatSpaces = [];
      Object.entries(spaces).forEach(([role, spaceList]) => {
        if (Array.isArray(spaceList)) {
          spaceList.forEach(space => {
            flatSpaces.push({ ...space, role: role === 'all' ? (space.role || 'public') : role });
          });
        }
      });
      return flatSpaces;
    }

    // If it's already an array, use it directly
    return Array.isArray(spaces) ? spaces : [];
  }, [spaces]);

  // Get space IDs for proposal queries
  const spaceIds = useMemo(() => allSpaces.map(space => space.spaceId), [allSpaces]);

  // Fetch proposals for all spaces
  const { data: proposalsData, isLoading: proposalsLoading } = useProposalsBySpaces(
    spaceIds,
    spaceIds.length > 0
  );

  // Filter and sort spaces
  const filteredAndSortedSpaces = useMemo(() => {
    let filtered = allSpaces.filter(space => {
      const matchesSearch = space.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          space.ensName.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesFilter = true;
      if (showEligibilityType) {
        // For eligibility filter, check space.eligibilityType or default to 'public'
        const eligibilityType = space.eligibilityType || 'public';
        matchesFilter = eligibilityFilter === 'all' || eligibilityType === eligibilityFilter;
        
        // Also apply status filter (joined/not joined)
        if (statusFilter !== 'all') {
          const isJoined = userJoinedSpaces.includes(space.spaceId);
          const matchesStatus = statusFilter === 'joined' ? isJoined : !isJoined;
          matchesFilter = matchesFilter && matchesStatus;
        }
      } else {
        // For role filter (My Spaces), use the role field
        matchesFilter = roleFilter === 'all' || space.role === roleFilter;
      }
      
      return matchesSearch && matchesFilter;
    });

    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.displayName.toLowerCase();
          bValue = b.displayName.toLowerCase();
          break;
        case 'created':
          aValue = Number(a.createdAt);
          bValue = Number(b.createdAt);
          break;
        case 'members':
          aValue = Number(a.memberCount);
          bValue = Number(b.memberCount);
          break;
        default:
          aValue = a.displayName.toLowerCase();
          bValue = b.displayName.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [allSpaces, searchTerm, roleFilter, eligibilityFilter, statusFilter, sortBy, sortOrder, showEligibilityType, userJoinedSpaces]);

  // Paginate spaces
  const paginatedSpaces = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedSpaces.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedSpaces, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedSpaces.length / pageSize);

  const toggleRowExpansion = (spaceId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(spaceId)) {
      newExpanded.delete(spaceId);
    } else {
      newExpanded.add(spaceId);
    }
    setExpandedRows(newExpanded);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-black">Loading spaces...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading spaces: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {showFilters && (
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <div className="relative flex-1 w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search spaces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto relative">
              {filterItems.map((filter) => (
                <div
                  key={filter.name}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(filter.name)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors duration-200 font-medium text-sm"
                    style={{
                      color: colors.black,
                      backgroundColor: hoveredFilter === filter.name ? colors.hoverBg : 'transparent'
                    }}
                  >
                    {filter.name}
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {/* Dropdown */}
                  {hoveredFilter === filter.name && (
                    <div
                      className="absolute top-full left-0 mt-1 w-48 rounded-md shadow-lg z-50 animate-in fade-in-0 zoom-in-95"
                      style={{ backgroundColor: colors.white, border: `1px solid ${colors.primary}20` }}
                      onMouseEnter={() => handleMouseEnter(filter.name)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="py-1">
                        {filter.options.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              filter.onChange(option.value);
                              setHoveredFilter(null);
                            }}
                            className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors duration-150 w-full text-left"
                            style={{ color: colors.black }}
                          >
                            {option.label}
                            {filter.current === option.value && (
                              <div className="w-2 h-2 rounded-full ml-auto" style={{ backgroundColor: colors.primary }}></div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-6 px-6">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-[#E8DCC4]/30">
              <thead className="bg-[#E8DCC4]/10">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider min-w-0">
                    <div className="max-w-xs lg:max-w-none">Space</div>
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    {showEligibilityType ? 'Eligibility' : 'Role'}
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Proposals
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-[#E8DCC4]/30">
                {paginatedSpaces.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-black">
                      No spaces found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedSpaces.map((space) => (
                    <SpaceRow
                      key={space.id}
                      space={space}
                      isExpanded={expandedRows.has(space.id)}
                      onToggleExpand={toggleRowExpansion}
                      proposalsData={proposalsData}
                      proposalsLoading={proposalsLoading}
                      showExpandable={showExpandable}
                      showEligibilityType={showEligibilityType}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 lg:px-6 py-3 bg-[#E8DCC4]/10 border-t border-[#E8DCC4]/30">
            <div className="text-sm text-black text-center sm:text-left">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredAndSortedSpaces.length)} of {filteredAndSortedSpaces.length} spaces
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex-shrink-0 border-[#4D89B0] text-black hover:bg-[#4D89B0] hover:text-white"
              >
                Previous
              </Button>
              <span className="text-sm text-black whitespace-nowrap px-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex-shrink-0 border-[#4D89B0] text-black hover:bg-[#4D89B0] hover:text-white"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}