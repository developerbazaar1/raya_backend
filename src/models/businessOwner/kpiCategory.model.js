
/**
 * KPI CATEGORY COLLECTION
 * ----------------
 * - Created by employer
 * - Represents a KPI category definition
 */
const mongoose = require('mongoose');

const kpiCategorySchema = new mongoose.Schema({
    businessOwnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    categoryName: { type: String, required: true, trim: true, maxlength: 150 },
}, { timestamps: true });


module.exports = mongoose.model('KpiCategory', kpiCategorySchema);