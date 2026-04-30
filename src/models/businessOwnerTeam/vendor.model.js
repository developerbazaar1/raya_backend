const mongoose = require('mongoose');
const vendorSchema = new mongoose.Schema({
    businessOwnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BusinessOwner',
        required: true
    },
    companyName: { type: String, trim: true },
    representativeName: { type: String, trim: true },
    email: { type: String, trim: true },
    phoneNumber: {
        countryCode: { type: String, trim: true },
        number: { type: String, trim: true }
    },
    notes: { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);