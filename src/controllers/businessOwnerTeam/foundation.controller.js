const { foundationService } = require('../../services/businessOwnerTeam/foundation.service');

exports.getFoundation = async (req, res) => {
  const data = await foundationService(req.user.userId, req.query);
  res.status(200).json({
    status: 'success',
    message: 'Foundation fetched successfully.',
    data
  });
};
