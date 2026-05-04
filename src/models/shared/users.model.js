const { FileReferenceSchema } = require('./file.schema');
const { ROLES } = require('../../config/constant');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, default: null },
  role: { type: String, enum: ROLES, required: true },
  userProfile: {
    type: FileReferenceSchema,
    default: {
      url: '',
      key: '',
      fileName: '',
      mimeType: '',
      sizeBytes: 0
    }
  },
  dateOfJoining: { type: Date },
  // # Reference to the business owner (User)
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);


