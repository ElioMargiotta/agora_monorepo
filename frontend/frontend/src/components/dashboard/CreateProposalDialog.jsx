"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Plus, FileText, ChevronDown, Trash2 } from 'lucide-react';

export function CreateProposalDialog({ spaceId, spaceName }) {
  const router = useRouter();
  const params = useParams();
  const { address } = useAccount();
  const spaceNameParam = params.space_name;
  const [showDrafts, setShowDrafts] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingDraftId, setDeletingDraftId] = useState(null);

  const handleCreateProposal = () => {
    // Navigate to proposal creation page with spaceId as query parameter
    router.push(`/app/${spaceNameParam}/proposals/create?spaceId=${spaceId}`);
  };

  const loadDrafts = async () => {
    if (!address || !spaceId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/proposal-draft?spaceId=${spaceId}&createdBy=${address}`);
      const result = await response.json();
      
      if (result.success) {
        // Filter to only show drafts (not published)
        const draftProposals = (result.data || []).filter(d => d.status === 'draft');
        setDrafts(draftProposals);
      }
    } catch (error) {
      console.error('Error loading drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDraftClick = (draftId) => {
    router.push(`/app/${spaceNameParam}/proposals/create?spaceId=${spaceId}&draftId=${draftId}`);
  };

  const handleDeleteDraft = async (e, draftId) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this draft?')) {
      return;
    }

    setDeletingDraftId(draftId);
    try {
      const response = await fetch(`/api/proposal-draft?draftId=${draftId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Remove from local state
        setDrafts(drafts.filter(d => d.draftId !== draftId));
      } else {
        alert('Failed to delete draft: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert('Failed to delete draft');
    } finally {
      setDeletingDraftId(null);
    }
  };

  useEffect(() => {
    if (showDrafts && address && spaceId) {
      loadDrafts();
    }
  }, [showDrafts, address, spaceId]);

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Button
          onClick={handleCreateProposal}
          className="flex items-center gap-2 bg-[#4D89B0] hover:bg-[#4D89B0]/90 text-white cursor-pointer flex-1"
        >
          <Plus className="h-4 w-4" />
          Create Proposal
        </Button>
        <Button
          onClick={() => setShowDrafts(!showDrafts)}
          variant="outline"
          className="border-[#4D89B0] text-[#4D89B0] hover:bg-[#4D89B0]/10 cursor-pointer"
        >
          <FileText className="h-4 w-4" />
          <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${showDrafts ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {showDrafts && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-sm text-gray-500">Loading drafts...</div>
          ) : drafts.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No drafts found</div>
          ) : (
            <div className="py-1">
              {drafts.map((draft) => (
                <div
                  key={draft.draftId}
                  className="flex items-center hover:bg-gray-50 transition-colors group"
                >
                  <button
                    onClick={() => handleDraftClick(draft.draftId)}
                    className="flex-1 px-4 py-2 text-left"
                  >
                    <div className="text-sm font-medium text-black truncate">
                      {draft.title || 'Untitled Draft'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(draft.updatedAt).toLocaleDateString()}
                    </div>
                  </button>
                  <button
                    onClick={(e) => handleDeleteDraft(e, draft.draftId)}
                    disabled={deletingDraftId === draft.draftId}
                    className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    title="Delete draft"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
