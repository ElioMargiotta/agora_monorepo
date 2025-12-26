import connectDB from './mongodb';
import ProposalDraft from './models/ProposalDraft';

/**
 * Save or update a proposal draft
 */
export async function saveProposalDraft(draftId, data) {
  try {
    await connectDB();
    
    const draft = await ProposalDraft.findOneAndUpdate(
      { draftId },
      { 
        draftId,
        ...data
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    ).lean();
    
    return { success: true, data: draft };
  } catch (error) {
    console.error('Error saving proposal draft:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get a proposal draft by draftId
 */
export async function getProposalDraft(draftId) {
  try {
    await connectDB();
    
    const draft = await ProposalDraft.findOne({ draftId }).lean();
    return draft;
  } catch (error) {
    console.error('Error getting proposal draft:', error);
    return null;
  }
}

/**
 * Get all drafts for a specific space
 */
export async function getSpaceDrafts(spaceId) {
  try {
    await connectDB();
    
    const drafts = await ProposalDraft.find({ 
      spaceId,
      status: 'draft'
    }).sort({ updatedAt: -1 }).lean();
    
    return drafts;
  } catch (error) {
    console.error('Error getting space drafts:', error);
    return [];
  }
}

/**
 * Get all drafts created by a user
 */
export async function getUserDrafts(createdBy) {
  try {
    await connectDB();
    
    const drafts = await ProposalDraft.find({ 
      createdBy,
      status: 'draft'
    }).sort({ updatedAt: -1 }).lean();
    
    return drafts;
  } catch (error) {
    console.error('Error getting user drafts:', error);
    return [];
  }
}

/**
 * Delete a draft
 */
export async function deleteProposalDraft(draftId) {
  try {
    await connectDB();
    
    const result = await ProposalDraft.findOneAndDelete({ draftId });
    
    if (!result) {
      return { success: false, error: 'Draft not found' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting proposal draft:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark draft as published
 */
export async function publishDraft(draftId, proposalId) {
  try {
    await connectDB();
    
    const draft = await ProposalDraft.findOneAndUpdate(
      { draftId },
      { 
        status: 'published',
        proposalId
      },
      { new: true }
    ).lean();
    
    if (!draft) {
      return { success: false, error: 'Draft not found' };
    }
    
    return { success: true, data: draft };
  } catch (error) {
    console.error('Error publishing draft:', error);
    return { success: false, error: error.message };
  }
}
