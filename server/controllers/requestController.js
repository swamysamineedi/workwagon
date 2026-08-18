const requestService = require('../services/requestService');
const asyncHandler = require('../utils/asyncHandler');

const createRequest = asyncHandler(async (req, res) => {
  const { toUserId, vacancyId, message } = req.body;
  const result = await requestService.createRequest(req.user, toUserId, vacancyId, message);
  
  res.status(201).json({
    status: 'success',
    data: result
  });
});

const getRequests = asyncHandler(async (req, res) => {
  const { type = 'all' } = req.query; // 'inbox', 'outbox', or 'all'
  const requests = await requestService.getRequests(req.user.id, type);
  
  res.status(200).json({
    status: 'success',
    data: { requests }
  });
});

const respondToRequest = asyncHandler(async (req, res) => {
  const { action } = req.body; // 'accept' or 'reject'
  const result = await requestService.respondToRequest(req.user.id, req.params.id, action);
  
  res.status(200).json({
    status: 'success',
    data: result
  });
});

module.exports = {
  createRequest,
  getRequests,
  respondToRequest
};
