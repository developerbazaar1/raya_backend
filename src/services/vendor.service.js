const mongoose = require('mongoose');
const Vendor = require('../models/businessOwnerTeam/vendor.model');
const Schedule = require('../models/businessOwnerTeam/schedule.model');
const AppError = require('../utils/appError');

exports.vendorCreateService = async (body, userId) => {
  const { companyName, representativeName, email, notes, phoneNumber, role } = body;

  const existingVendor = await Vendor.findOne({ email });
  if (existingVendor) {
    throw new AppError('Vendor already exists with this email', 400);
  }

  const vendor = await Vendor.create({
    companyName,
    representativeName,
    email,
    notes,
    phoneNumber,
    role,
    businessOwnerId: userId
  });

  const formattedVendor = {
    id: vendor._id,
    companyName: vendor.companyName || '',
    representativeName: vendor.representativeName || '',
    email: vendor.email || '',
    phoneNumber: vendor.phoneNumber || '',
    role: vendor.role || '',
    notes: vendor.notes || '',
    businessOwnerId: vendor.businessOwnerId || '',
    createdAt: vendor.createdAt
  };
  return formattedVendor;
};

exports.vendorListService = async (userId, query = {}) => {
  let { page = 1, limit = 10 } = query;

  page = parseInt(page);
  limit = parseInt(limit);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;

  const skip = (page - 1) * limit;

  const [vendors, total] = await Promise.all([
    Vendor.find({ businessOwnerId: userId })
      .select('companyName representativeName email phoneNumber role notes')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Vendor.countDocuments({ businessOwnerId: userId })
  ]);

  const formattedVendors = vendors.map((vendor) => ({
    id: vendor._id,
    companyName: vendor.companyName || '',
    representativeName: vendor.representativeName || '',
    email: vendor.email || '',
    phoneNumber: vendor.phoneNumber || '',
    role: vendor.role || '',
    notes: vendor.notes || ''
  }));

  return {
    data: formattedVendors,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
};

exports.vendorDetailsService = async (vendorId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    throw new AppError('Invalid Vendor ID format', 400);
  }

  const vendor = await Vendor.findOne({ _id: vendorId, businessOwnerId: userId }).select(
    'companyName representativeName email phoneNumber role notes createdAt businessOwnerId'
  );
  if (!vendor) {
    throw new AppError('Vendor not found', 404);
  }

  const formattedVendor = {
    id: vendor._id,
    companyName: vendor.companyName || '',
    representativeName: vendor.representativeName || '',
    email: vendor.email || '',
    phoneNumber: vendor.phoneNumber || '',
    role: vendor.role || '',
    notes: vendor.notes || '',
    businessOwnerId: vendor.businessOwnerId || '',
    createdAt: vendor.createdAt
  };
  return formattedVendor;
};

exports.vendorDeleteService = async (vendorId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    throw new AppError('Invalid Vendor ID format', 400);
  }

  const vendor = await Vendor.findOne({ _id: vendorId, businessOwnerId: userId });
  if (!vendor) {
    throw new AppError('Vendor not found', 404);
  }
  await vendor.deleteOne();
  return vendor;
};

exports.vendorScheduleService = async (vendorId, body, userId) => {
  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    throw new AppError('Invalid Vendor ID format', 400);
  }

  const { time, date, notes } = body;
  const vendor = await Vendor.findOne({ _id: vendorId, businessOwnerId: userId });
  if (!vendor) {
    throw new AppError('Vendor not found', 404);
  }

  const existingSchedule = await Schedule.findOne({ vendorId, date: body.date });
  if (existingSchedule) {
    throw new AppError('Schedule already exists for this vendor', 400);
  }

  const schedule = await Schedule.create({
    vendorId,
    businessOwnerId: userId,
    time,
    date,
    notes,
    status: 'not_started'
  });

  const formattedSchedule = {
    id: schedule._id,
    vendorId: schedule.vendorId || '',
    businessOwnerId: schedule.businessOwnerId || '',
    time: schedule.time || '',
    date: schedule.date || '',
    notes: schedule.notes || '',
    status: schedule.status || ''
  };
  return formattedSchedule;
};

exports.updateVendorService = async (vendorId, body, userId) => {
  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    throw new AppError('Invalid Vendor ID format', 400);
  }

  const vendor = await Vendor.findOne({ _id: vendorId, businessOwnerId: userId });
  if (!vendor) {
    throw new AppError('Vendor not found', 404);
  }
  const { companyName, representativeName, email, notes, phoneNumber, role } = body;
  // if (email) {
  //     const existingVendor = await Vendor.findOne({ email, _id: { $ne: vendorId } });
  //     if (existingVendor) {
  //         throw new AppError('Email already exists', 400);
  //     }
  // }
  vendor.companyName = companyName || vendor.companyName;
  vendor.representativeName = representativeName || vendor.representativeName;
  vendor.email = email || vendor.email;
  vendor.notes = notes || vendor.notes;
  vendor.phoneNumber = phoneNumber || vendor.phoneNumber;
  vendor.role = role || vendor.role;
  await vendor.save();
  const formattedVendor = {
    id: vendor._id,
    companyName: vendor.companyName || '',
    representativeName: vendor.representativeName || '',
    email: vendor.email || '',
    phoneNumber: vendor.phoneNumber || '',
    role: vendor.role || '',
    notes: vendor.notes || '',
    businessOwnerId: vendor.businessOwnerId || '',
    createdAt: vendor.createdAt
  };
  return formattedVendor;
};