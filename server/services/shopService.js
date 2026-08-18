const ShopProfile = require('../models/ShopProfile');
const { AppError } = require('../middleware/errorHandler');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calcCompleteness = (p) => {
  const checks = [
    [p.businessName,                    20],
    [p.description,                     15],
    [p.industry,                        10],
    [p.businessType,                    10],
    [p.location && p.location.city,     15],
    [p.phone,                           10],
    [p.website,                          5],
    [p.logoUrl,                          5],
    [p.abn,                             10],
  ];
  return checks.reduce((sum, [cond, pts]) => sum + (cond ? pts : 0), 0);
};

// ─── Get My Profile ───────────────────────────────────────────────────────────

const getMyProfile = async (userId) => {
  const profile = await ShopProfile.findOne({ user: userId }).populate(
    'user',
    'email role isVerified createdAt'
  );
  if (!profile) throw new AppError('Shop profile not found.', 404);
  return profile;
};

// ─── Update My Profile ────────────────────────────────────────────────────────

const ALLOWED_FIELDS = [
  'businessName', 'businessType', 'industry', 'description',
  'logoUrl', 'website', 'phone', 'abn',
  'location', 'openingHours', 'isPublic',
];

const updateMyProfile = async (userId, body) => {
  const profile = await ShopProfile.findOne({ user: userId });
  if (!profile) throw new AppError('Shop profile not found.', 404);

  ALLOWED_FIELDS.forEach((field) => {
    if (body[field] !== undefined) {
      if (field === 'location' || field === 'openingHours') {
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
  const profile = await ShopProfile.findById(profileId).populate(
    'user',
    'email role isVerified createdAt'
  );
  if (!profile) throw new AppError('Shop profile not found.', 404);
  if (!profile.isPublic) throw new AppError('This business profile is private.', 403);
  return profile;
};

module.exports = { getMyProfile, updateMyProfile, getProfileById };
