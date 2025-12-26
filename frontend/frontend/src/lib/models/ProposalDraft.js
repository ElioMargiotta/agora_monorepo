import mongoose from 'mongoose';

const ProposalDraftSchema = new mongoose.Schema({
  draftId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  spaceId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 5000
  },
  choices: {
    type: [String],
    default: ['Yes', 'No']
  },
  votingDuration: {
    type: Number,
    default: 7
  },
  proposalType: {
    type: Number,
    default: 0
  },
  eligibilityType: {
    type: Number,
    default: 0
  },
  eligibilityToken: {
    type: String,
    default: '0x0000000000000000000000000000000000000000'
  },
  eligibilityThreshold: {
    type: String,
    default: '1'
  },
  passingThreshold: {
    type: String,
    default: '50'
  },
  includeAbstain: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  proposalId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.models.ProposalDraft || 
  mongoose.model('ProposalDraft', ProposalDraftSchema);
