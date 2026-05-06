/**
 * BusinessFoundation model
 * ----------------
 * - Created by employer
 * - Represents the foundational elements of a business, including mission, vision, and values
 */
const mongoose = require('mongoose');

const businessFoundationSchema = new mongoose.Schema({
    businessOwnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    mission: { type: String, trim: true, default: '' },
    vision: { type: String, trim: true, default: '' },
    values: {
        type: [{ type: String, trim: true }],
        default: []
    },
}, { timestamps: true });

module.exports = mongoose.model('BusinessFoundation', businessFoundationSchema);
