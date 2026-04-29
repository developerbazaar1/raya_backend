const mongoose = require('mongoose');

const employeeRoleSchema = new mongoose.Schema(
  {
    businessOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusinessOwner',
      required: true,
    },
    roleName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('EmployeeRole', employeeRoleSchema);
