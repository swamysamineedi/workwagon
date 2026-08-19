const { AppError } = require('../middleware/errorHandler');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const ShopProfile = require('../models/ShopProfile');
const WorkerProfile = require('../models/WorkerProfile');
const Vacancy = require('../models/Vacancy');
const Connection = require('../models/Connection');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');

// ─── Dashboard Stats ─────────────────────────────────────────────────────────
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalWorkers,
    totalBusinesses,
    activeVacancies,
    connections,
    pendingVerifications,
    openReports,
  ] = await Promise.all([
    User.countDocuments({ role: 'worker' }),
    User.countDocuments({ role: 'shop' }),
    Vacancy.countDocuments({ status: 'open', moderationStatus: 'APPROVED' }),
    Connection.countDocuments(),
    ShopProfile.countDocuments({ verificationStatus: 'PENDING' }),
    Report.countDocuments({ status: 'OPEN' }),
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      totalWorkers,
      totalBusinesses,
      activeVacancies,
      connections,
      pendingVerifications,
      openReports,
    },
  });
});

// ─── Users (Workers) Management ─────────────────────────────────────────────
exports.getWorkers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, status } = req.query;
  const filter = { role: 'worker' };
  
  if (status) filter.isActive = status === 'active';
  if (search) filter.email = new RegExp(search, 'i');

  const skip = (Number(page) - 1) * Number(limit);
  
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  // Fetch profiles for these users
  const userIds = users.map(u => u._id);
  const profiles = await WorkerProfile.find({ user: { $in: userIds } });
  
  // Merge profiles
  const mergedUsers = users.map(user => {
    const userObj = user.toObject();
    userObj.profile = profiles.find(p => String(p.user) === String(user._id));
    return userObj;
  });

  res.status(200).json({
    status: 'success',
    data: {
      workers: mergedUsers,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// ─── Businesses Management ──────────────────────────────────────────────────
exports.getBusinesses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, status, verification } = req.query;
  
  // First, find users matching role and status
  const userFilter = { role: 'shop' };
  if (status) userFilter.isActive = status === 'active';
  if (search) userFilter.email = new RegExp(search, 'i');
  
  let users = await User.find(userFilter).select('-password');
  let userIds = users.map(u => u._id);
  
  // Then filter by profile fields
  const profileFilter = { user: { $in: userIds } };
  if (verification) profileFilter.verificationStatus = verification;
  if (search) profileFilter.$or = [
    { businessName: new RegExp(search, 'i') },
  ];

  const skip = (Number(page) - 1) * Number(limit);
  
  const [profiles, total] = await Promise.all([
    ShopProfile.find(profileFilter)
      .populate('user', '-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    ShopProfile.countDocuments(profileFilter),
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      businesses: profiles,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// ─── Update User Status ─────────────────────────────────────────────────────
exports.updateUserStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { action, reason } = req.body; // action: 'suspend' or 'activate'

  if (!['suspend', 'activate'].includes(action)) {
    return next(new AppError('Action must be suspend or activate', 400));
  }

  const user = await User.findById(id);
  if (!user) return next(new AppError('User not found', 404));
  if (user.role === 'admin') return next(new AppError('Cannot modify admin accounts', 403));

  const isActive = action === 'activate';
  user.isActive = isActive;
  await user.save();

  // Audit
  await AuditLog.create({
    admin: req.user._id,
    action: action === 'activate' ? 'ACTIVATE_USER' : 'SUSPEND_USER',
    targetEntity: 'User',
    targetId: user._id,
    reason,
  });

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

// ─── Verifications ─────────────────────────────────────────────────────────
exports.getPendingVerifications = asyncHandler(async (req, res) => {
  const verifications = await ShopProfile.find({ verificationStatus: 'PENDING' })
    .populate('user', 'email createdAt')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    data: { verifications },
  });
});

exports.updateVerificationStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params; // ShopProfile ID
  const { status, reason } = req.body; // status: 'APPROVED' or 'REJECTED'

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return next(new AppError('Status must be APPROVED or REJECTED', 400));
  }

  const profile = await ShopProfile.findById(id);
  if (!profile) return next(new AppError('Shop profile not found', 404));

  profile.verificationStatus = status;
  if (reason) profile.verificationReason = reason;
  profile.verifiedAt = Date.now();
  profile.verifiedBy = req.user._id;
  await profile.save();

  await AuditLog.create({
    admin: req.user._id,
    action: `VERIFY_BUSINESS_${status}`,
    targetEntity: 'ShopProfile',
    targetId: profile._id,
    reason,
  });

  res.status(200).json({
    status: 'success',
    data: { profile },
  });
});

// ─── Vacancy Moderation ────────────────────────────────────────────────────
exports.getVacancies = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, moderation } = req.query;
  const filter = {};
  
  if (status) filter.status = status;
  if (moderation) filter.moderationStatus = moderation;

  const skip = (Number(page) - 1) * Number(limit);
  
  const [vacancies, total] = await Promise.all([
    Vacancy.find(filter)
      .populate('shop', 'businessName')
      .populate('postedBy', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Vacancy.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      vacancies,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

exports.updateVacancyModeration = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, reason } = req.body; // status: 'APPROVED', 'REJECTED', 'REMOVED'

  if (!['APPROVED', 'REJECTED', 'REMOVED'].includes(status)) {
    return next(new AppError('Invalid moderation status', 400));
  }

  const vacancy = await Vacancy.findById(id);
  if (!vacancy) return next(new AppError('Vacancy not found', 404));

  vacancy.moderationStatus = status;
  if (reason) vacancy.moderationReason = reason;
  vacancy.moderatedAt = Date.now();
  vacancy.moderatedBy = req.user._id;

  // If removed or rejected, we might want to update shop vacancy counts, 
  // but status usually governs that. We'll leave it as moderationStatus for now.
  if (status === 'REMOVED' && vacancy.status === 'open') {
    vacancy.status = 'closed'; // Force close if removed
    await ShopProfile.findOneAndUpdate({ _id: vacancy.shop }, { $inc: { activeVacancies: -1 } });
  }

  await vacancy.save();

  await AuditLog.create({
    admin: req.user._id,
    action: `MODERATE_VACANCY_${status}`,
    targetEntity: 'Vacancy',
    targetId: vacancy._id,
    reason,
  });

  res.status(200).json({
    status: 'success',
    data: { vacancy },
  });
});

// ─── Reports ────────────────────────────────────────────────────────────────
exports.getReports = asyncHandler(async (req, res) => {
  const { status = 'OPEN', page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status && status !== 'ALL') filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate('reporter', 'email role')
      .populate('reportedUser', 'email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Report.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      reports,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

exports.updateReportStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, notes } = req.body; // status: 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'

  const report = await Report.findById(id);
  if (!report) return next(new AppError('Report not found', 404));

  report.status = status;
  if (notes) report.adminNotes = notes;
  if (status === 'RESOLVED' || status === 'DISMISSED') {
    report.resolvedAt = Date.now();
    report.resolvedBy = req.user._id;
  }
  await report.save();

  await AuditLog.create({
    admin: req.user._id,
    action: `UPDATE_REPORT_${status}`,
    targetEntity: 'Report',
    targetId: report._id,
    reason: notes,
  });

  res.status(200).json({
    status: 'success',
    data: { report },
  });
});
