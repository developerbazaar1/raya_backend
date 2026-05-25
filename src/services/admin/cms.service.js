const mongoose = require('mongoose');
const AppError = require('../../utils/appError');
const CMS = require('../../models/admin/cms.Model');

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (id, fieldName = 'Id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }

  return new mongoose.Types.ObjectId(id);
};

/**
 * Create CMS Page
 */
exports.cmsCreateService = async (body, adminId) => {
  const { page_name, slug, description, updatedByModel } = body;

  // Validate admin ID
  const adminObjectId = validateObjectId(adminId, 'Admin ID');

  // Check existing slug
  const existingSlug = await CMS.findOne({
    slug: slug.trim()
  });

  if (existingSlug) {
    throw new AppError('Slug already exists', 400);
  }

  // Create CMS page
  const cms = await CMS.create({
    page_name: page_name.trim(),
    slug: slug.trim(),
    description,
    updated_by: adminObjectId,
    updatedByModel: updatedByModel || 'AdminUser'
  });

  return {
    id: cms._id,
    page_name: cms.page_name,
    slug: cms.slug,
    description: cms.description
  };
};

/**
 * Update CMS Page
 */
exports.cmsUpdateService = async (id, body, adminId) => {
  const { page_name, slug, description, updatedByModel } = body;

  // Validate IDs
  const cmsId = validateObjectId(id, 'CMS ID');

  const adminObjectId = validateObjectId(adminId, 'Admin ID');

  // Check duplicate slug
  const existingSlug = await CMS.findOne({
    slug: slug.trim(),
    _id: { $ne: cmsId }
  });

  if (existingSlug) {
    throw new AppError('Slug already exists', 400);
  }

  // Update CMS page
  const cms = await CMS.findByIdAndUpdate(
    cmsId,
    {
      page_name: page_name.trim(),
      slug: slug.trim(),
      description,
      updated_by: adminObjectId,
      updatedByModel: updatedByModel || 'AdminUser'
    },
    {
      new: true
    }
  );

  if (!cms) {
    throw new AppError('Page not found', 404);
  }

  return {
    id: cms._id,
    page_name: cms.page_name,
    slug: cms.slug,
    description: cms.description
  };
};

/**
 * CMS List
 */
exports.cmsListService = async () => {
  const cmsPages = await CMS.find().populate('updated_by', 'name').sort({ createdAt: -1 });

  return cmsPages.map((item) => ({
    id: item._id,
    page_name: item.page_name,
    slug: item.slug,
    updated_by: item.updated_by?.name || ''
  }));
};

/**
 * Get CMS Page By ID
 */
exports.cmsGetService = async (id, _adminId) => {
  // Validate CMS ID
  const cmsId = validateObjectId(id, 'CMS ID');

  // Find CMS page
  const cms = await CMS.findById(cmsId);

  if (!cms) {
    throw new AppError('Page not found', 404);
  }

  return {
    id: cms._id,
    page_name: cms.page_name,
    slug: cms.slug,
    description: cms.description
  };
};
