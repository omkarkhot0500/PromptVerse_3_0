import { Schema, model, models } from 'mongoose';

const PromptSchema = new Schema({
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  prompt: {
    type: String,
    required: [true, 'Prompt is required.'],
  },
  tag: {
    type: String,
    required: [true, 'Tag is required.'],
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  // NEW: Expiry timestamp (only set for public prompts)
  expiresAt: {
    type: Date,
    default: null,
    index: true, // Index for efficient cleanup queries
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Add TTL index for MongoDB automatic deletion
PromptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

const Prompt = models.Prompt || model('Prompt', PromptSchema);

export default Prompt;
