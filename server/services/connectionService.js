const mongoose = require('mongoose');
const Connection = require('../models/Connection');
const Vacancy = require('../models/Vacancy');
const ShopProfile = require('../models/ShopProfile');
const WorkerProfile = require('../models/WorkerProfile');
const { AppError } = require('../middleware/errorHandler');

/**
 * Creates a Connection between a Worker and a Shop for a specific Vacancy (if applicable).
 * Also increments the filledSlots on the Vacancy if one is provided.
 * Uses a Mongoose transaction to ensure atomicity.
 *
 * @param workerUserId  - User._id of the worker
 * @param shopUserId    - User._id of the shop
 * @param vacancyId     - Optional Vacancy._id
 * @param workerRequestId - The worker's Request._id
 * @param shopRequestId   - Optional shop's Request._id (mutual-match); null for direct-accept
 */
const createConnection = async (workerUserId, shopUserId, vacancyId, workerRequestId, shopRequestId = null) => {
  const session = await mongoose.startSession();
  let newConnection = null;

  try {
    session.startTransaction();

    // 1. Get the WorkerProfile and ShopProfile to link
    const workerProfile = await WorkerProfile.findOne({ user: workerUserId }).session(session);
    if (!workerProfile) throw new AppError('Worker profile not found', 404);

    const shopProfile = await ShopProfile.findOne({ user: shopUserId }).session(session);
    if (!shopProfile) throw new AppError('Shop profile not found', 404);

    // 2. Validate Vacancy slots if a vacancy is provided
    let vacancy = null;
    if (vacancyId) {
      vacancy = await Vacancy.findById(vacancyId).session(session);
      if (!vacancy) throw new AppError('Vacancy not found', 404);
      if (['filled', 'closed', 'expired', 'draft'].includes(vacancy.status)) {
        throw new AppError(`Cannot create connection: Vacancy is ${vacancy.status}`, 400);
      }
      if (vacancy.filledSlots >= vacancy.totalSlots) {
        throw new AppError('Cannot create connection: Vacancy is full', 400);
      }
    }

    // 3. Create the Connection
    const connData = {
      worker: workerProfile._id,
      workerUser: workerUserId,
      shop: shopProfile._id,
      shopUser: shopUserId,
      vacancy: vacancyId || undefined,
      workerRequest: workerRequestId,
      status: 'active',
    };
    // shopRequest is optional — only present in mutual-match scenario
    if (shopRequestId) {
      connData.shopRequest = shopRequestId;
    }

    const [conn] = await Connection.create([connData], { session });
    newConnection = conn;

    // 4. Update the Vacancy filledSlots (pre-save middleware handles 'filled' status if slots max)
    if (vacancy) {
      vacancy.filledSlots += 1;
      await vacancy.save({ session });
    }

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    if (err.code === 11000) {
      throw new AppError('An active connection already exists between this worker and shop.', 409);
    }
    throw err;
  } finally {
    session.endSession();
  }

  return newConnection;
};

/**
 * Get all connections for a user (worker or shop)
 */
const getConnections = async (userId, role) => {
  const filter = {};
  if (role === 'worker') {
    filter.workerUser = userId;
  } else if (role === 'shop') {
    filter.shopUser = userId;
  } else {
    throw new AppError('Invalid role', 400);
  }

  const connections = await Connection.find(filter)
    .populate('worker', 'firstName lastName avatarUrl skills location experienceYears availability')
    .populate('shop', 'businessName logoUrl location industry')
    .populate('vacancy', 'title location payRate employmentType')
    .sort({ createdAt: -1 });

  return connections;
};

module.exports = {
  createConnection,
  getConnections,
};
