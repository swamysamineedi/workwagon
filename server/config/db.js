const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI from environment variables.
 * Exits the process on failure — the app should not run without a database.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌  MONGODB_URI is not defined in environment variables.');
    console.error('    Add it to server/.env and restart.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌  MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

// Log disconnect events so they are never silent
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️   MongoDB disconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌  MongoDB error: ${err.message}`);
});

module.exports = connectDB;
