import { NextResponse } from 'next/server';
import { saveProposalDraft, getProposalDraft, getSpaceDrafts, getUserDrafts, deleteProposalDraft, publishDraft } from '@/lib/proposalDrafts';

/**
 * POST /api/proposal-draft
 * Save or update a proposal draft
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { draftId, spaceId, title, description, choices, votingDuration, createdBy } = body;

    if (!draftId || !spaceId || !title || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields: draftId, spaceId, title, createdBy' },
        { status: 400 }
      );
    }

    const result = await saveProposalDraft(draftId, {
      spaceId,
      title,
      description: description || '',
      choices: choices || ['Yes', 'No'],
      votingDuration: votingDuration || 7,
      createdBy
    });

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/proposal-draft:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/proposal-draft?draftId=xxx
 * Get a specific draft
 * GET /api/proposal-draft?spaceId=xxx
 * Get all drafts for a space
 * GET /api/proposal-draft?createdBy=0x...
 * Get all drafts by user
 * GET /api/proposal-draft?spaceId=xxx&createdBy=0x...
 * Get all drafts for a space by a specific user
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('draftId');
    const spaceId = searchParams.get('spaceId');
    const createdBy = searchParams.get('createdBy');

    if (draftId) {
      const data = await getProposalDraft(draftId);
      if (data) {
        return NextResponse.json({ success: true, data });
      } else {
        return NextResponse.json(
          { error: 'Draft not found' },
          { status: 404 }
        );
      }
    } else if (spaceId && createdBy) {
      // Filter by both space and user
      const data = await getSpaceDrafts(spaceId);
      const filteredData = data.filter(d => d.createdBy === createdBy);
      return NextResponse.json({ success: true, data: filteredData });
    } else if (spaceId) {
      const data = await getSpaceDrafts(spaceId);
      return NextResponse.json({ success: true, data });
    } else if (createdBy) {
      const data = await getUserDrafts(createdBy);
      return NextResponse.json({ success: true, data });
    } else {
      return NextResponse.json(
        { error: 'Missing query parameter: draftId, spaceId, or createdBy' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/proposal-draft:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/proposal-draft?draftId=xxx
 * Delete a draft
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('draftId');

    if (!draftId) {
      return NextResponse.json(
        { error: 'Missing required parameter: draftId' },
        { status: 400 }
      );
    }

    const result = await deleteProposalDraft(draftId);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Draft not found' ? 404 : 500 }
      );
    }
  } catch (error) {
    console.error('Error in DELETE /api/proposal-draft:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/proposal-draft
 * Mark draft as published
 */
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { draftId, proposalId } = body;

    if (!draftId || !proposalId) {
      return NextResponse.json(
        { error: 'Missing required fields: draftId, proposalId' },
        { status: 400 }
      );
    }

    const result = await publishDraft(draftId, proposalId);

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Draft not found' ? 404 : 500 }
      );
    }
  } catch (error) {
    console.error('Error in PATCH /api/proposal-draft:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
