const mongoose = require('mongoose');

const FileReferenceSchema = new mongoose.Schema(
  {
    url: { type: String, default: null },
    key: { type: String, default: null },
    fileName: { type: String },
    mimeType: { type: String },
    sizeBytes: { type: Number }
  },
  { _id: false }
);

module.exports = { FileReferenceSchema };
