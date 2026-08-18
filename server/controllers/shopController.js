const shopService = require('../services/shopService');
const asyncHandler = require('../utils/asyncHandler');

const getMe = asyncHandler(async (req, res) => {
  const profile = await shopService.getMyProfile(req.user._id);
  res.json({ status: 'success', data: { profile } });
});

const updateMe = asyncHandler(async (req, res) => {
  const profile = await shopService.updateMyProfile(req.user._id, req.body);
  res.json({ status: 'success', message: 'Profile updated.', data: { profile } });
});

const getById = asyncHandler(async (req, res) => {
  const profile = await shopService.getProfileById(req.params.id);
  res.json({ status: 'success', data: { profile } });
});

module.exports = { getMe, updateMe, getById };
