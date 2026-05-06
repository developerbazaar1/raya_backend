const mongoose = require('mongoose');
const employeeLeaveBalanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    totalAllocated: {
      type: Number,
      default: 0
    },
    carriedForward: {
      type: Number,
      default: 0
    },
    usedDays: {
      type: Number,
      default: 0
    },
    remainingDays: {
      type: Number
    }
  },
  {
    timestamps: true
  }
);


module.exports = mongoose.model('EmployeeLeaveBalance', employeeLeaveBalanceSchema);
