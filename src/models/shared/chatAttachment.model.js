/**
 * CHAT MESSAGE ATTACHMENTS
 * ------------------------
 * - Separate collection for scalability
 */
const mongoose = require('mongoose');
const { FileReferenceSchema } = require('./file.schema');
const chatAttachmentSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatMessage',
      required: true,
    },

    attachment: {
      type: FileReferenceSchema,
      default: {
        url: '',
        key: '',
        fileName: '',
        mimeType: '',
        sizeBytes: 0
      }
    },
  },
  { timestamps: true }
);

// INDEXES
chatAttachmentSchema.index({ messageId: 1 });

module.exports = mongoose.model('ChatAttachment', chatAttachmentSchema);
