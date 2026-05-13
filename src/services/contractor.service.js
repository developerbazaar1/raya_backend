const mongoose = require('mongoose');
const AppError = require('../utils/appError');
const Contractor = require('../models/businessOwnerTeam/contractor.model');
const Schedule = require('../models/businessOwnerTeam/schedule.model');

exports.contractorCreateService = async (body, userId) => {
  const { companyName, contractorName, email, phoneNumber, role } = body;

  const existingContractor = await Contractor.findOne({ email });
  if (existingContractor) {
    throw new AppError('Contractor already exists with this email', 400);
  }

  const contractor = await Contractor.create({
    companyName,
    contractorName,
    email,
    phoneNumber,
    role,
    businessOwnerId: userId
  });

  const formattedContractor = {
    id: contractor._id,
    companyName: contractor.companyName || '',
    contractorName: contractor.contractorName || '',
    email: contractor.email || '',
    phoneNumber: contractor.phoneNumber || '',
    role: contractor.role || '',
    businessOwnerId: contractor.businessOwnerId || '',
    createdAt: contractor.createdAt
  };
  return formattedContractor;
};

exports.contractorListService = async (businessOwnerId) => {
  const contractors = await Contractor.find({ businessOwnerId }).select(
    'companyName contractorName email phoneNumber role notes'
  );

  const formattedContractors = contractors.map((contractor) => ({
    id: contractor._id,
    companyName: contractor.companyName || '',
    contractorName: contractor.contractorName || '',
    email: contractor.email || '',
    phoneNumber: contractor.phoneNumber || '',
    role: contractor.role || ''
  }));
  return formattedContractors;
};

exports.contractorDetailsService = async (contractorId, businessOwnerId) => {
  if (!mongoose.Types.ObjectId.isValid(contractorId)) {
    throw new AppError('Invalid Contractor ID format', 400);
  }

  const contractor = await Contractor.findOne({ _id: contractorId, businessOwnerId }).select(
    'companyName contractorName email phoneNumber role createdAt businessOwnerId'
  );
  if (!contractor) {
    throw new AppError('Contractor not found', 404);
  }

  const formattedContractor = {
    id: contractor._id,
    companyName: contractor.companyName || '',
    contractorName: contractor.contractorName || '',
    email: contractor.email || '',
    phoneNumber: contractor.phoneNumber || '',
    role: contractor.role || '',
    businessOwnerId: contractor.businessOwnerId || '',
    createdAt: contractor.createdAt
  };
  return formattedContractor;
};
exports.contractorDeleteService = async (contractorId, businessOwnerId) => {
  if (!mongoose.Types.ObjectId.isValid(contractorId)) {
    throw new AppError('Invalid Contractor ID format', 400);
  }
  const contractor = await Contractor.findOne({ _id: contractorId, businessOwnerId });
  if (!contractor) {
    throw new AppError('Contractor not found', 404);
  }
  await contractor.deleteOne();
  return contractor;
};

exports.contractorScheduleService = async (contractorId, body, businessOwnerId) => {
  if (!mongoose.Types.ObjectId.isValid(contractorId)) {
    throw new AppError('Invalid Contractor ID format', 400);
  }
  const { time, date, notes } = body;
  const contractor = await Contractor.findOne({ _id: contractorId, businessOwnerId });
  if (!contractor) {
    throw new AppError('Contractor not found', 404);
  }
  const existingSchedule = await Schedule.findOne({ contractorId, date: body.date });
  if (existingSchedule) {
    throw new AppError('Schedule already exists for this contractor', 400);
  }
  const schedule = await Schedule.create({
    contractorId,
    businessOwnerId,
    time,
    date,
    notes,
    status: 'not_started'
  });
  const formattedSchedule = {
    id: schedule._id,
    contractorId: schedule.contractorId || '',
    businessOwnerId: schedule.businessOwnerId || '',
    time: schedule.time || '',
    date: schedule.date || '',
    notes: schedule.notes || '',
    status: schedule.status || ''
  };
  return formattedSchedule;
};
exports.updateContractorService = async (contractorId, body, userId) => {
  if (!mongoose.Types.ObjectId.isValid(contractorId)) {
    throw new AppError('Invalid Contractor ID format', 400);
  }
  const contractor = await Contractor.findOne({ _id: contractorId, businessOwnerId: userId });
  if (!contractor) {
    throw new AppError('Contractor not found', 404);
  }
  const { companyName, contractorName, email, phoneNumber, role } = body;

  contractor.companyName = companyName || contractor.companyName;
  contractor.contractorName = contractorName || contractor.contractorName;
  contractor.email = email || contractor.email;
  contractor.phoneNumber = phoneNumber || contractor.phoneNumber;
  contractor.role = role || contractor.role;
  await contractor.save();

  const formattedContractor = {
    id: contractor._id,
    companyName: contractor.companyName || '',
    contractorName: contractor.contractorName || '',
    email: contractor.email || '',
    phoneNumber: contractor.phoneNumber || '',
    role: contractor.role || ''
  };
  return formattedContractor;
};
