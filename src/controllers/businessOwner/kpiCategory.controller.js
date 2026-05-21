const { createKpiCategoryService } = require('../../services/kpiCategory.service');

exports.createKpiCategory = async (req, res) => {
  const data = await createKpiCategoryService(req.body, req.user.userId);

  res.status(201).json({
    status: 'success',
    message: 'KPI category created successfully',
    data
  });
};
