const WorkerProfile = require('../models/WorkerProfile');
const { AppError } = require('../middleware/errorHandler');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calculate profile completeness 0–100.
 * Weighted fields: name, bio, skills, jobCategories, availability,
 * location.city, experienceYears, phone.
 */
const calcCompleteness = (p) => {
  const checks = [
    [p.firstName && p.lastName,        20],
    [p.bio,                            15],
    [p.skills && p.skills.length > 0,  20],
    [p.jobCategories && p.jobCategories.length > 0, 15],
    [p.location && p.location.city,    10],
    [p.experienceYears != null,        10],
    [p.phone,                           5],
    [p.avatarUrl,                       5],
  ];
  return checks.reduce((sum, [cond, pts]) => sum + (cond ? pts : 0), 0);
};

// ─── Get My Profile ───────────────────────────────────────────────────────────

const getMyProfile = async (userId) => {
  const profile = await WorkerProfile.findOne({ user: userId }).populate(
    'user',
    'email role isVerified createdAt'
  );
  if (!profile) throw new AppError('Worker profile not found.', 404);
  return profile;
};

// ─── Update My Profile ────────────────────────────────────────────────────────

const ALLOWED_FIELDS = [
  'firstName', 'lastName', 'bio', 'phone', 'avatarUrl',
  'skills', 'jobCategories', 'experienceYears',
  'availability', 'location', 'isPublic',
];

const updateMyProfile = async (userId, body) => {
  const profile = await WorkerProfile.findOne({ user: userId });
  if (!profile) throw new AppError('Worker profile not found.', 404);

  // Only apply allowed fields
  ALLOWED_FIELDS.forEach((field) => {
    if (body[field] !== undefined) {
      if (field === 'availability' || field === 'location') {
        // Merge nested objects
        profile[field] = { ...profile[field]?.toObject?.() ?? profile[field], ...body[field] };
      } else {
        profile[field] = body[field];
      }
    }
  });

  profile.profileCompleteness = calcCompleteness(profile);
  await profile.save();
  return profile;
};

// ─── Get Profile By ID (public) ───────────────────────────────────────────────

const getProfileById = async (profileId) => {
  const profile = await WorkerProfile.findById(profileId).populate(
    'user',
    'email role isVerified createdAt'
  );
  if (!profile) throw new AppError('Worker profile not found.', 404);
  if (!profile.isPublic) throw new AppError('This profile is private.', 403);
  return profile;
};

// ─── List Workers (for shop discovery) ───────────────────────────────────────

const listWorkers = async (query) => {
  const {
    skill, category, available, city,
    page = 1, limit = 20,
  } = query;

  const filter = { isPublic: true };
  if (available !== undefined) filter['availability.isAvailable'] = available === 'true';
  if (skill) filter.skills = { $in: [skill] };
  if (category) filter.jobCategories = { $in: [category] };
  if (city) filter['location.city'] = new RegExp(city, 'i');

  const skip = (Number(page) - 1) * Number(limit);
  const [workers, total] = await Promise.all([
    WorkerProfile.find(filter)
      .populate('user', 'email isVerified createdAt')
      .sort({ profileCompleteness: -1 })
      .skip(skip)
      .limit(Number(limit)),
    WorkerProfile.countDocuments(filter),
  ]);

  return { workers, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
};

module.exports = { getMyProfile, updateMyProfile, getProfileById, listWorkers };
