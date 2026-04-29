const { FileReferenceSchema } = require('../schema/file.schema');
const { ROLES } = require('../../config/constant');
mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },
    userProfile: {
        type: FileReferenceSchema,
        default: {
            url: '',
            key: '',
            fileName: '',
            mimeType: '',
            sizeBytes: 0,
        },
    },
    dateOfJoining: { type: Date },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);


