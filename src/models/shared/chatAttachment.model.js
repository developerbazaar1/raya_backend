/**
 * CHAT MESSAGE ATTACHMENTS
 * ------------------------
 * - Separate collection for scalability
 */
const mongoose = require('mongoose');
const chatAttachmentSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatMessage',
      required: true,
      index: true
    },

    fileName: String,
    fileUrl: { type: String, required: true },
    fileType: String,
    fileSize: Number
  },
  { timestamps: true }
);

// INDEXES
chatAttachmentSchema.index({ messageId: 1 });

module.exports = mongoose.model('ChatAttachment', chatAttachmentSchema);
