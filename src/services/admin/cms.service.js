const AppError = require('../../utils/appError');
const CMS = require('../../models/admin/cms.Model');

exports.cmsCreateService = async (body, adminId) => {
  const { page_name, slug, description } = body;

  const existingSlug = await CMS.findOne({ slug });
  if (existingSlug) {
    throw new AppError('Slug already exists', 400);
  }

  const cms = await CMS.create({
    page_name,
    slug,
    description,
    updated_by: adminId,
    updatedByModel: body.updatedByModel || 'AdminUser'
  });
  return cms;
};

exports.cmsUpdateService = async (id, body, adminId) => {
  const { page_name, slug, description } = body;

  const existingSlug = await CMS.findOne({ slug, _id: { $ne: id } });
  if (existingSlug) {
    throw new AppError('Slug already exists', 400);
  }

  const cms = await CMS.findByIdAndUpdate(
    id,
    {
      page_name,
      slug,
      description,
      updated_by: adminId,
      updatedByModel: body.updatedByModel || 'AdminUser'
    },
    { new: true }
  );

  if (!cms) {
    throw new AppError('Page not Found', 404);
  }

  return cms;
};

exports.cmsListService = async () => {
  const cms = await CMS.find().populate('updated_by', 'name');

  const formattedCms = cms.map((item) => {
    return {
      id: item._id,
      page_name: item.page_name,
      slug: item.slug,
      updated_by: item.updated_by.name
    };
  });
  return formattedCms;
};

exports.cmsGetService = async (id, adminId) => {
  const cms = await CMS.findById(id);

  if (!cms) throw new AppError('Page not found', 404);

  const formattedCms = {
    id: cms._id,
    page_name: cms.page_name,
    slug: cms.slug,
    description: cms.description
  };

  return formattedCms;
};
