const mongoose = require('mongoose');
const contractorSchema = new mongoose.Schema({
    // # Reference to the business owner (User)
    businessOwnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    companyName: { type: String, trim: true },
    contractorName: { type: String, trim: true },
    email: { type: String, trim: true },

    phoneNumber: {
        countryCode: { type: String, trim: true },
        number: { type: String, trim: true }
    },
}, { timestamps: true });

module.exports = mongoose.model('Contractor', contractorSchema);