const KpiCategory = require('../models/businessOwner/kpiCategory.model');
const AppError = require('../utils/appError');

const formatCategory = (doc) => ({
  _id: doc._id,
  categoryName: doc.categoryName,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

exports.createKpiCategoryService = async (payload, userId) => {
  const categoryName = payload.categoryName?.trim();

  const existingCategory = await KpiCategory.findOne({
    businessOwnerId: userId,
    categoryName: { $regex: `^${categoryName}$`, $options: 'i' }
  });

  if (existingCategory) {
    throw new AppError('KPI category already exists', 409);
  }

  const category = await KpiCategory.create({
    businessOwnerId: userId,
    categoryName
  });

  return formatCategory(category);
};