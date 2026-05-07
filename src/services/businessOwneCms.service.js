const CMS = require('../models/admin/cms.Model');
const AppError = require('../utils/appError');

exports.cmsCreateService = async (body, userId) => {
  const { page_name, slug, description } = body;

  const existingSlug = await CMS.findOne({ slug });
  if (existingSlug) {
    throw new AppError('Slug already exists', 400);
  }

  const cms = await CMS.create({
    page_name,
    slug,
    description,
    updated_by: userId,
    updatedByModel: 'User'
  });
  return cms;
};

exports.cmsUpdateService = async (id, body, userId) => {
  const { page_name, slug, description } = body;

  const existingSlug = await CMS.findOne({ slug, _id: { $ne: id } });
  if (existingSlug) {
    throw new AppError('Slug already exists', 400);
  }

  const cms = await CMS.findOneAndUpdate(
    { _id: id, updated_by: userId, updatedByModel: 'User' },
    {
      page_name,
      slug,
      description,
      updated_by: userId,
      updatedByModel: 'User'
    },
    { new: true }
  );

  if (!cms) {
    throw new AppError('Page not found', 404);
  }

  return cms;
};

exports.cmsListService = async (userId) => {
  const cms = await CMS.find({ updated_by: userId, updatedByModel: 'User' }).populate(
    'updated_by',
    'name'
  );

  const formattedCms = cms.map((item) => {
    return {
      id: item._id,
      page_name: item.page_name,
      description: item.description,
      slug: item.slug,
      updated_by: item.updated_by?.name || ''
    };
  });
  return formattedCms;
};

exports.cmsGetService = async (id, userId) => {
  const cms = await CMS.findOne({ _id: id, updated_by: userId, updatedByModel: 'User' }).populate(
    'updated_by',
    'name'
  );

  if (!cms) {
    throw new AppError('Page not found', 404);
  }

  return {
    id: cms._id,
    page_name: cms.page_name,
    slug: cms.slug,
    description: cms.description,
    updated_by: cms.updated_by?.name || ''
  };
};
