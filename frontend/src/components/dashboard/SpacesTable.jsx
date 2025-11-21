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
  Plus,
  Calendar,
  Users,
  FileText,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';
import { CreateProposalDialog } from '@/components/dashboard/CreateProposalDialog';

// Mock data for proposals - replace with real data later
const mockProposals = [
  {
    id: '1',
    title: 'Increase treasury allocation for development',
    status: 'active',
    votes: { yes: 45, no: 12, abstain: 3 },
    endDate: '2025-12-01',
    quorum: 60
  },
  {
    id: '2',
    title: 'Add new admin member',
    status: 'passed',
    votes: { yes: 52, no: 8, abstain: 0 },
    endDate: '2025-11-15',
    quorum: 60
  },
  {
    id: '3',
    title: 'Update voting parameters',
    status: 'failed',
    votes: { yes: 28, no: 32, abstain: 0 },
    endDate: '2025-11-10',
    quorum: 60
  }
];

function getRoleIcon(role) {
  switch (role) {
    case 'owner':
      return <Crown className="h-4 w-4 text-yellow-600" />;
    case 'admin':
      return <Shield className="h-4 w-4 text-blue-600" />;
    case 'member':
      return <User className="h-4 w-4 text-gray-600" />;
    default:
      return <User className="h-4 w-4 text-gray-600" />;
  }
}

function getRoleBadge(role) {
  const variants = {
    owner: 'default',
    admin: 'secondary',
    member: 'outline'
  };

  return (
    <Badge variant={variants[role] || 'outline'} className="flex items-center gap-1">
      {getRoleIcon(role)}
      {role.charAt(0).toUpperCase() + role.slice(1)}
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

function SpaceRow({ space, onToggleExpand, isExpanded }) {
  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const getProposalStats = (space) => {
    // Mock data - replace with real proposal counts
    const openCount = Math.floor(Math.random() * 10);
    const closedCount = Math.floor(Math.random() * 20);
    return { open: openCount, closed: closedCount };
  };

  const proposalStats = getProposalStats(space);

  return (
    <>
      <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => onToggleExpand(space.id)}>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <button className="mr-2 text-gray-400 hover:text-gray-600">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            <div>
              <div className="text-sm font-medium text-gray-900">{space.displayName}</div>
              <div className="text-sm text-gray-500">{space.ensName}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {getRoleBadge(space.role)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-gray-400" />
            {space.memberCount.toString()}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <div className="flex items-center gap-2">
            <span className="text-green-600">{proposalStats.open} open</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">{proposalStats.closed} closed</span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-gray-400" />
            {formatDate(space.createdAt)}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {getStatusBadge(space.isActive ? 'active' : 'archived')}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex items-center justify-end gap-2">
            <Link href={`/app/${space.ensName.replace('.eth', '')}`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            {space.role === 'owner' && (
              <CreateProposalDialog
                spaceId={space.spaceId}
                spaceName={space.displayName}
              />
            )}
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan="7" className="px-6 py-4 bg-gray-50">
            <SpaceDetails space={space} />
          </td>
        </tr>
      )}
    </>
  );
}

function SpaceDetails({ space }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900">Recent Proposals</h4>
        {space.role !== 'member' && (
          <CreateProposalDialog
            spaceId={space.spaceId}
            spaceName={space.displayName}
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockProposals.map((proposal) => (
          <Card key={proposal.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-medium line-clamp-2">
                  {proposal.title}
                </CardTitle>
                <Badge variant={proposal.status === 'active' ? 'default' : 'secondary'}>
                  {proposal.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Yes: {proposal.votes.yes}</span>
                  <span>No: {proposal.votes.no}</span>
                  <span>Abstain: {proposal.votes.abstain}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quorum: {proposal.quorum}%</span>
                  <span>Ends: {new Date(proposal.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <Button variant="outline" size="sm">
          View All Proposals
        </Button>
      </div>
    </div>
  );
}

export function SpacesTable({ spaces, loading, error }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Flatten spaces from categorized structure
  const allSpaces = useMemo(() => {
    const flatSpaces = [];
    Object.entries(spaces).forEach(([role, spaceList]) => {
      spaceList.forEach(space => {
        flatSpaces.push({ ...space, role });
      });
    });
    return flatSpaces;
  }, [spaces]);

  // Filter and sort spaces
  const filteredAndSortedSpaces = useMemo(() => {
    let filtered = allSpaces.filter(space => {
      const matchesSearch = space.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          space.ensName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || space.role === roleFilter;
      return matchesSearch && matchesRole;
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
  }, [allSpaces, searchTerm, roleFilter, sortBy, sortOrder]);

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
            <p className="text-gray-600">Loading spaces...</p>
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
    <div className="space-y-4">
      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search spaces..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Creation Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="members">Members</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Space
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Members
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proposals
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedSpaces.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
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
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Rows per page:</span>
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">
                {Math.min((currentPage - 1) * pageSize + 1, filteredAndSortedSpaces.length)}-
                {Math.min(currentPage * pageSize, filteredAndSortedSpaces.length)} of {filteredAndSortedSpaces.length}
              </span>

              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}