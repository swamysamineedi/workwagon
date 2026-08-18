const workerService = require('../services/workerService');
const asyncHandler = require('../utils/asyncHandler');

const getMe = asyncHandler(async (req, res) => {
  const profile = await workerService.getMyProfile(req.user._id);
  res.json({ status: 'success', data: { profile } });
});

const updateMe = asyncHandler(async (req, res) => {
  const profile = await workerService.updateMyProfile(req.user._id, req.body);
  res.json({ status: 'success', message: 'Profile updated.', data: { profile } });
});

const getById = asyncHandler(async (req, res) => {
  const profile = await workerService.getProfileById(req.params.id);
  res.json({ status: 'success', data: { profile } });
});

const list = asyncHandler(async (req, res) => {
  const result = await workerService.listWorkers(req.query);
  res.json({ status: 'success', data: result });
});

module.exports = { getMe, updateMe, getById, list };
