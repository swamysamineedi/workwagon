const connectionService = require('../services/connectionService');
const asyncHandler = require('../utils/asyncHandler');

const getConnections = asyncHandler(async (req, res) => {
  const connections = await connectionService.getConnections(req.user.id, req.user.role);
  
  res.status(200).json({
    status: 'success',
    data: { connections }
  });
});

module.exports = {
  getConnections
};
