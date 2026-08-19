const Request = require('../models/Request');
const Connection = require('../models/Connection');
const Vacancy = require('../models/Vacancy');
const { createConnection } = require('./connectionService');
const { AppError } = require('../middleware/errorHandler');

/**
 * Helper to determine direction from role
 */
const getDirection = (role) => role === 'worker' ? 'worker_to_shop' : 'shop_to_worker';

/**
 * Creates a Request.
 * Worker → must supply a vacancyId.
 * Shop   → may supply a vacancyId (invite to specific role) or none.
 *
 * Also checks for a mutual match: if the other side already has a pending
 * request to this user, create a Connection immediately.
 */
const createRequest = async (user, toUserId, vacancyId, message) => {
  const fromUserId = user.id || user._id;
  const direction = getDirection(user.role);

  // ── 1. Self-request guard ─────────────────────────────────────────────────
  if (String(fromUserId) === String(toUserId)) {
    throw new AppError('Cannot send a request to yourself.', 400);
  }

  // ── 2. Validate Vacancy if provided ───────────────────────────────────────
  let vacancy = null;
  if (vacancyId) {
    vacancy = await Vacancy.findById(vacancyId);
    if (!vacancy) throw new AppError('Vacancy not found.', 404);

    // Block paused, filled, closed, expired vacancies
    if (['paused', 'filled', 'closed', 'expired'].includes(vacancy.status)) {
      throw new AppError(
        `Cannot send request: this vacancy is currently ${vacancy.status}.`, 400
      );
    }

    // Slot guard
    if (vacancy.filledSlots >= vacancy.totalSlots) {
      throw new AppError('Cannot send request: this vacancy is full.', 400);
    }

    // For worker requests: verify vacancy belongs to the shop they are requesting
    if (direction === 'worker_to_shop' && String(vacancy.postedBy) !== String(toUserId)) {
      throw new AppError('This vacancy does not belong to the specified shop.', 400);
    }
  } else if (direction === 'worker_to_shop') {
    // Worker MUST supply a vacancyId — they can't apply without targeting a vacancy
    throw new AppError('A vacancy ID is required when a worker applies to a shop.', 400);
  }

  // ── 3. Check for existing active Connection ────────────────────────────────
  const existingConn = await Connection.findOne({
    $or: [
      { workerUser: fromUserId, shopUser: toUserId, status: 'active' },
      { workerUser: toUserId, shopUser: fromUserId, status: 'active' },
    ],
  });
  if (existingConn) {
    throw new AppError('You are already connected with this user.', 400);
  }

  // ── 4. Check for existing pending request (duplicate guard) ───────────────
  // Prevents sending the same request twice for the same vacancy
  if (vacancyId) {
    const existing = await Request.findOne({
      fromUser: fromUserId,
      toUser: toUserId,
      vacancy: vacancyId,
      status: { $in: ['pending', 'accepted'] },
    });
    if (existing) {
      throw new AppError('You have already sent a request for this vacancy.', 409);
    }
  }

  // ── 5. Mutual-match detection ─────────────────────────────────────────────
  // Did the recipient already send a pending request toward us?
  const reverseRequest = await Request.findOne({
    fromUser: toUserId,
    toUser: fromUserId,
    status: 'pending',
  });

  if (reverseRequest) {
    // MUTUAL MATCH — create connection, mark both requests accepted
    const newRequest = await Request.create({
      fromUser: fromUserId,
      toUser: toUserId,
      direction,
      vacancy: vacancyId || undefined,
      message,
      status: 'accepted',
      respondedAt: new Date(),
    });

    reverseRequest.status = 'accepted';
    reverseRequest.respondedAt = new Date();
    await reverseRequest.save();

    const workerUserId = direction === 'worker_to_shop' ? fromUserId : toUserId;
    const shopUserId   = direction === 'shop_to_worker' ? fromUserId : toUserId;
    const workerReqId  = direction === 'worker_to_shop' ? newRequest._id : reverseRequest._id;
    const shopReqId    = direction === 'shop_to_worker' ? newRequest._id : reverseRequest._id;
    const activeVacancyId = vacancyId || reverseRequest.vacancy;

    const connection = await createConnection(
      workerUserId, shopUserId, activeVacancyId, workerReqId, shopReqId
    );

    newRequest.connection = connection._id;
    reverseRequest.connection = connection._id;
    await newRequest.save();
    await reverseRequest.save();

    return { matched: true, connection, request: newRequest };
  }

  // ── 6. No mutual match — create a pending request ─────────────────────────
  try {
    const request = await Request.create({
      fromUser: fromUserId,
      toUser: toUserId,
      direction,
      vacancy: vacancyId || undefined,
      message,
      status: 'pending',
    });
    return { matched: false, request };
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError('You have already sent a request for this vacancy.', 409);
    }
    throw err;
  }
};

/**
 * Respond to an incoming request (accept or reject).
 * Only the recipient (toUser) can respond.
 * On accept: creates a Connection directly without creating a dummy reverse request.
 */
const respondToRequest = async (userId, requestId, action) => {
  const request = await Request.findById(requestId);
  if (!request) throw new AppError('Request not found.', 404);

  // Authorization — only the recipient can respond
  if (String(request.toUser) !== String(userId)) {
    throw new AppError('You are not authorized to respond to this request.', 403);
  }

  if (request.status !== 'pending') {
    throw new AppError(
      `Cannot respond to a ${request.status} request.`, 400
    );
  }

  // ── Reject ────────────────────────────────────────────────────────────────
  if (action === 'reject') {
    request.status = 'rejected';
    request.respondedAt = new Date();
    await request.save();
    return { request, matched: false };
  }

  // ── Accept ────────────────────────────────────────────────────────────────
  if (action === 'accept') {
    // Validate vacancy slot is still available if this request is tied to one
    if (request.vacancy) {
      const vacancy = await Vacancy.findById(request.vacancy);
      if (vacancy) {
        if (['paused', 'filled', 'closed', 'expired'].includes(vacancy.status)) {
          throw new AppError(
            `Cannot accept: vacancy is now ${vacancy.status}.`, 400
          );
        }
        if (vacancy.filledSlots >= vacancy.totalSlots) {
          throw new AppError('Cannot accept: vacancy is now full.', 400);
        }
      }
    }

    // Determine worker vs shop user IDs
    const workerUserId = request.direction === 'worker_to_shop'
      ? request.fromUser
      : request.toUser;
    const shopUserId = request.direction === 'shop_to_worker'
      ? request.fromUser
      : request.toUser;

    // Mark original request accepted
    request.status = 'accepted';
    request.respondedAt = new Date();
    await request.save();

    // Create connection — no dummy shopRequest (direct accept flow)
    //
    // direction = 'worker_to_shop': Worker applied, shop accepts
    //   → workerRequest = request._id, shopRequest = null
    //
    // direction = 'shop_to_worker': Shop invited, worker accepts
    //   → workerRequest = request._id (same request used, connection still requires it)
    //     shopRequest = null (no separate shop request needed)
    //
    // In BOTH cases we link the single request as workerRequest for the model requirement.
    // shopRequest remains optional.
    const connection = await createConnection(
      workerUserId, shopUserId, request.vacancy,
      request._id,   // workerRequest — the one request that triggered the connection
      null           // shopRequest   — no dummy request
    );

    request.connection = connection._id;
    await request.save();

    return { request, matched: true, connection };
  }

  throw new AppError('Invalid action. Use "accept" or "reject".', 400);
};

/**
 * Cancel a pending request (initiator only).
 */
const cancelRequest = async (userId, requestId) => {
  const request = await Request.findById(requestId);
  if (!request) throw new AppError('Request not found.', 404);

  if (String(request.fromUser) !== String(userId)) {
    throw new AppError('You can only cancel requests you sent.', 403);
  }

  if (request.status !== 'pending') {
    throw new AppError(`Cannot cancel a ${request.status} request.`, 400);
  }

  request.status = 'cancelled';
  request.cancelledAt = new Date();
  await request.save();
  return { request };
};

/**
 * Get requests for a user — inbox, outbox, or all.
 * Enriches each request with fromProfile and toProfile data.
 */
const getRequests = async (userId, type) => {
  const filter = {};
  if (type === 'inbox') {
    filter.toUser = userId;
    // Exclude auto-created dummy requests and cancelled ones for cleanliness
    filter.status = { $ne: 'cancelled' };
  } else if (type === 'outbox') {
    filter.fromUser = userId;
    filter.status = { $ne: 'cancelled' };
  } else {
    filter.$or = [{ fromUser: userId }, { toUser: userId }];
  }

  const requests = await Request.find(filter)
    .populate('fromUser', 'email role')
    .populate('toUser', 'email role')
    .populate({
      path: 'vacancy',
      select: 'title location payRate status employmentType category',
    })
    .sort({ createdAt: -1 });

  const WorkerProfile = require('../models/WorkerProfile');
  const ShopProfile   = require('../models/ShopProfile');

  const enriched = await Promise.all(
    requests.map(async (req) => {
      const r = req.toObject();

      // fromProfile
      if (r.fromUser?.role === 'worker') {
        r.fromProfile = await WorkerProfile.findOne({ user: r.fromUser._id })
          .select('firstName lastName avatarUrl skills jobCategories experienceYears location availability');
      } else if (r.fromUser?.role === 'shop') {
        r.fromProfile = await ShopProfile.findOne({ user: r.fromUser._id })
          .select('businessName logoUrl industry location');
      }

      // toProfile
      if (r.toUser?.role === 'worker') {
        r.toProfile = await WorkerProfile.findOne({ user: r.toUser._id })
          .select('firstName lastName avatarUrl skills jobCategories experienceYears location availability');
      } else if (r.toUser?.role === 'shop') {
        r.toProfile = await ShopProfile.findOne({ user: r.toUser._id })
          .select('businessName logoUrl industry location');
      }

      return r;
    })
  );

  return enriched;
};

module.exports = {
  createRequest,
  respondToRequest,
  cancelRequest,
  getRequests,
};
