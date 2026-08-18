const Request = require('../models/Request');
const Connection = require('../models/Connection');
const Vacancy = require('../models/Vacancy');
const { createConnection } = require('./connectionService');
const { AppError } = require('../middleware/errorHandler');

/**
 * Helper to determine direction
 */
const getDirection = (role) => role === 'worker' ? 'worker_to_shop' : 'shop_to_worker';

/**
 * Creates a Request, checking for a mutual match first.
 */
const createRequest = async (user, toUserId, vacancyId, message) => {
  const fromUserId = user.id;
  const direction = getDirection(user.role);

  // 1. Basic validation
  if (String(fromUserId) === String(toUserId)) {
    throw new AppError('Cannot send request to yourself', 400);
  }

  // 2. Validate Vacancy if provided
  let vacancy = null;
  if (vacancyId) {
    vacancy = await Vacancy.findById(vacancyId);
    if (!vacancy) throw new AppError('Vacancy not found', 404);
    if (['filled', 'closed', 'expired'].includes(vacancy.status)) {
      throw new AppError(`Cannot request: Vacancy is ${vacancy.status}`, 400);
    }
    // Prevent worker from applying to a vacancy that isn't owned by the toUserId shop
    if (direction === 'worker_to_shop' && String(vacancy.postedBy) !== String(toUserId)) {
        throw new AppError('Vacancy does not belong to this shop', 400);
    }
  } else if (direction === 'worker_to_shop') {
    throw new AppError('Vacancy is required when worker requests a shop', 400);
  }

  // 3. Check for existing Connection
  const existingConn = await Connection.findOne({
    $or: [
      { workerUser: fromUserId, shopUser: toUserId, status: 'active' },
      { workerUser: toUserId, shopUser: fromUserId, status: 'active' }
    ]
  });
  if (existingConn) {
    throw new AppError('You are already connected with this user', 400);
  }

  // 4. Check for mutual match (Reverse Request)
  // i.e., did toUserId already send a pending request to fromUserId?
  const reverseRequest = await Request.findOne({
    fromUser: toUserId,
    toUser: fromUserId,
    status: 'pending',
    // If we're tied to a vacancy, the reverse request might be tied to the same vacancy, or no vacancy (if shop proactively scouted).
  });

  if (reverseRequest) {
    // MUTUAL MATCH! Create the connection
    const newRequest = await Request.create({
      fromUser: fromUserId,
      toUser: toUserId,
      direction,
      vacancy: vacancyId,
      message,
      status: 'accepted', // Automatically accepted because of mutual match
      respondedAt: new Date()
    });

    reverseRequest.status = 'accepted';
    reverseRequest.respondedAt = new Date();
    await reverseRequest.save();

    const workerUserId = direction === 'worker_to_shop' ? fromUserId : toUserId;
    const shopUserId = direction === 'shop_to_worker' ? fromUserId : toUserId;
    const workerRequestId = direction === 'worker_to_shop' ? newRequest._id : reverseRequest._id;
    const shopRequestId = direction === 'shop_to_worker' ? newRequest._id : reverseRequest._id;
    
    // Resolve the vacancy to use for the connection (prefer the one with the vacancy ID if one was missing)
    const activeVacancyId = vacancyId || reverseRequest.vacancy;

    const connection = await createConnection(workerUserId, shopUserId, activeVacancyId, workerRequestId, shopRequestId);
    
    newRequest.connection = connection._id;
    reverseRequest.connection = connection._id;
    await newRequest.save();
    await reverseRequest.save();

    return { matched: true, connection, request: newRequest };
  }

  // 5. No mutual match, just create a pending request
  try {
    const request = await Request.create({
      fromUser: fromUserId,
      toUser: toUserId,
      direction,
      vacancy: vacancyId,
      message,
      status: 'pending'
    });
    return { matched: false, request };
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError('You have already sent a request for this vacancy', 409);
    }
    throw err;
  }
};

/**
 * Respond to an incoming request
 */
const respondToRequest = async (userId, requestId, action) => {
  const request = await Request.findById(requestId);
  if (!request) throw new AppError('Request not found', 404);

  if (String(request.toUser) !== String(userId)) {
    throw new AppError('Not authorized to respond to this request', 403);
  }

  if (request.status !== 'pending') {
    throw new AppError(`Cannot respond to a ${request.status} request`, 400);
  }

  if (action === 'reject') {
    request.status = 'rejected';
    request.respondedAt = new Date();
    await request.save();
    return { request, matched: false };
  }

  if (action === 'accept') {
    // Determine roles
    const workerUserId = request.direction === 'worker_to_shop' ? request.fromUser : request.toUser;
    const shopUserId = request.direction === 'shop_to_worker' ? request.fromUser : request.toUser;
    
    // We need to create a dummy "accepted" reverse request to fulfill the schema requirement
    // that a connection has both a workerRequest and shopRequest.
    const reverseDirection = request.direction === 'worker_to_shop' ? 'shop_to_worker' : 'worker_to_shop';
    
    const reverseRequest = await Request.create({
      fromUser: request.toUser,
      toUser: request.fromUser,
      direction: reverseDirection,
      vacancy: request.vacancy,
      status: 'accepted',
      respondedAt: new Date(),
      message: 'Automatically created upon acceptance'
    });

    request.status = 'accepted';
    request.respondedAt = new Date();
    await request.save();

    const workerRequestId = request.direction === 'worker_to_shop' ? request._id : reverseRequest._id;
    const shopRequestId = request.direction === 'shop_to_worker' ? request._id : reverseRequest._id;

    const connection = await createConnection(workerUserId, shopUserId, request.vacancy, workerRequestId, shopRequestId);
    
    request.connection = connection._id;
    reverseRequest.connection = connection._id;
    await request.save();
    await reverseRequest.save();

    return { request, matched: true, connection };
  }

  throw new AppError('Invalid action', 400);
};

/**
 * Get inbox/outbox for a user
 */
const getRequests = async (userId, type) => {
  const filter = {};
  if (type === 'inbox') {
    filter.toUser = userId;
  } else if (type === 'outbox') {
    filter.fromUser = userId;
  } else {
    filter.$or = [{ fromUser: userId }, { toUser: userId }];
  }

  const requests = await Request.find(filter)
    .populate('fromUser', 'email role')
    .populate('toUser', 'email role')
    .populate('vacancy', 'title location payRate status')
    .sort({ createdAt: -1 });

  // To make it easy for frontend, let's also attach profile info manually or use aggregate.
  // For simplicity we will fetch profiles.
  const WorkerProfile = require('../models/WorkerProfile');
  const ShopProfile = require('../models/ShopProfile');

  const enriched = await Promise.all(requests.map(async (req) => {
    const r = req.toObject();
    if (r.fromUser.role === 'worker') {
      r.fromProfile = await WorkerProfile.findOne({ user: r.fromUser._id }).select('firstName lastName avatarUrl skills');
    } else {
      r.fromProfile = await ShopProfile.findOne({ user: r.fromUser._id }).select('businessName logoUrl industry');
    }
    
    if (r.toUser.role === 'worker') {
      r.toProfile = await WorkerProfile.findOne({ user: r.toUser._id }).select('firstName lastName avatarUrl skills');
    } else {
      r.toProfile = await ShopProfile.findOne({ user: r.toUser._id }).select('businessName logoUrl industry');
    }
    return r;
  }));

  return enriched;
};

module.exports = {
  createRequest,
  respondToRequest,
  getRequests
};
