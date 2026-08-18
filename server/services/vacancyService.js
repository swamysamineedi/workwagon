const Vacancy = require('../models/Vacancy');
const ShopProfile = require('../models/ShopProfile');
const { AppError } = require('../middleware/errorHandler');

// ─── Create Vacancy ───────────────────────────────────────────────────────────

const createVacancy = async (userId, body) => {
  const shop = await ShopProfile.findOne({ user: userId });
  if (!shop) throw new AppError('Shop profile not found. Complete your profile first.', 404);

  const {
    title, description, category, requiredSkills = [],
    employmentType, payRate, totalSlots = 1,
    startsAt, expiresAt, location,
  } = body;

  const vacancy = await Vacancy.create({
    shop: shop._id,
    postedBy: userId,
    title,
    description,
    category,
    requiredSkills,
    employmentType,
    payRate,
    totalSlots,
    filledSlots: 0,
    status: 'open',
    startsAt,
    expiresAt,
    location: location || { city: shop.location?.city, region: shop.location?.region, country: shop.location?.country },
  });

  // Update shop's denormalized counts
  await ShopProfile.findByIdAndUpdate(shop._id, {
    $inc: { totalVacanciesPosted: 1, activeVacancies: 1 },
  });

  return vacancy;
};

// ─── Get My Vacancies (shop) ──────────────────────────────────────────────────

const getMyVacancies = async (userId, query) => {
  const shop = await ShopProfile.findOne({ user: userId });
  if (!shop) throw new AppError('Shop profile not found.', 404);

  const { status, page = 1, limit = 20 } = query;
  const filter = { shop: shop._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [vacancies, total] = await Promise.all([
    Vacancy.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Vacancy.countDocuments(filter),
  ]);

  return { vacancies, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
};

// ─── Browse Vacancies (workers) ───────────────────────────────────────────────

const browseVacancies = async (query) => {
  const {
    category, skill, employmentType, city,
    minPay, maxPay,
    page = 1, limit = 20,
    sort = 'newest',
  } = query;

  const filter = { status: 'open' };
  if (category) filter.category = new RegExp(category, 'i');
  if (skill) filter.requiredSkills = { $in: [skill] };
  if (employmentType) filter.employmentType = employmentType;
  if (city) filter['location.city'] = new RegExp(city, 'i');
  if (minPay) filter['payRate.amount'] = { ...filter['payRate.amount'], $gte: Number(minPay) };
  if (maxPay) filter['payRate.amount'] = { ...filter['payRate.amount'], $lte: Number(maxPay) };

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    pay_high: { 'payRate.amount': -1 },
    pay_low: { 'payRate.amount': 1 },
  };

  const skip = (Number(page) - 1) * Number(limit);
  const [vacancies, total] = await Promise.all([
    Vacancy.find(filter)
      .populate('shop', 'businessName industry logoUrl location isVerified')
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(Number(limit)),
    Vacancy.countDocuments(filter),
  ]);

  return { vacancies, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
};

// ─── Get Single Vacancy ───────────────────────────────────────────────────────

const getVacancyById = async (vacancyId) => {
  const vacancy = await Vacancy.findById(vacancyId).populate(
    'shop',
    'businessName industry description logoUrl location phone website isVerified'
  );
  if (!vacancy) throw new AppError('Vacancy not found.', 404);
  return vacancy;
};

// ─── Update Vacancy ───────────────────────────────────────────────────────────

const ALLOWED_UPDATE = [
  'title', 'description', 'category', 'requiredSkills',
  'employmentType', 'payRate', 'totalSlots',
  'startsAt', 'expiresAt', 'location',
];

const updateVacancy = async (userId, vacancyId, body) => {
  const vacancy = await Vacancy.findById(vacancyId);
  if (!vacancy) throw new AppError('Vacancy not found.', 404);

  // Ownership check
  if (String(vacancy.postedBy) !== String(userId)) {
    throw new AppError('You can only edit your own vacancies.', 403);
  }

  // Cannot edit filled/expired/closed
  if (['filled', 'expired'].includes(vacancy.status)) {
    throw new AppError(`Cannot edit a ${vacancy.status} vacancy.`, 400);
  }

  ALLOWED_UPDATE.forEach((field) => {
    if (body[field] !== undefined) {
      if (field === 'payRate' || field === 'location') {
        vacancy[field] = { ...vacancy[field]?.toObject?.() ?? vacancy[field], ...body[field] };
      } else {
        vacancy[field] = body[field];
      }
    }
  });

  // Slot guard
  if (vacancy.totalSlots < vacancy.filledSlots) {
    throw new AppError('Total slots cannot be less than already filled slots.', 400);
  }

  await vacancy.save();
  return vacancy;
};

// ─── Change Status ────────────────────────────────────────────────────────────

const VALID_TRANSITIONS = {
  open:   ['paused', 'closed'],
  paused: ['open', 'closed'],
  draft:  ['open', 'closed'],
  closed: [],
  filled: [],
  expired: [],
};

const changeStatus = async (userId, vacancyId, newStatus) => {
  const vacancy = await Vacancy.findById(vacancyId);
  if (!vacancy) throw new AppError('Vacancy not found.', 404);

  if (String(vacancy.postedBy) !== String(userId)) {
    throw new AppError('You can only change status of your own vacancies.', 403);
  }

  const allowed = VALID_TRANSITIONS[vacancy.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(
      `Cannot transition from ${vacancy.status} to ${newStatus}.`,
      400
    );
  }

  const wasActive = vacancy.status === 'open' || vacancy.status === 'paused';
  const isNowActive = newStatus === 'open';

  vacancy.status = newStatus;
  await vacancy.save();

  // Update shop denormalized count
  if (wasActive && newStatus === 'closed') {
    await ShopProfile.findOneAndUpdate({ user: userId }, { $inc: { activeVacancies: -1 } });
  } else if (!wasActive && isNowActive) {
    await ShopProfile.findOneAndUpdate({ user: userId }, { $inc: { activeVacancies: 1 } });
  }

  return vacancy;
};

// ─── Delete Vacancy ───────────────────────────────────────────────────────────

const deleteVacancy = async (userId, vacancyId) => {
  const vacancy = await Vacancy.findById(vacancyId);
  if (!vacancy) throw new AppError('Vacancy not found.', 404);

  if (String(vacancy.postedBy) !== String(userId)) {
    throw new AppError('You can only delete your own vacancies.', 403);
  }

  if (vacancy.filledSlots > 0) {
    throw new AppError('Cannot delete a vacancy that already has filled slots.', 400);
  }

  await vacancy.deleteOne();

  // Update shop denormalized count
  if (vacancy.status === 'open' || vacancy.status === 'paused') {
    await ShopProfile.findOneAndUpdate(
      { user: userId },
      { $inc: { activeVacancies: -1, totalVacanciesPosted: -1 } }
    );
  } else {
    await ShopProfile.findOneAndUpdate(
      { user: userId },
      { $inc: { totalVacanciesPosted: -1 } }
    );
  }
};

module.exports = {
  createVacancy, getMyVacancies, browseVacancies,
  getVacancyById, updateVacancy, changeStatus, deleteVacancy,
};
