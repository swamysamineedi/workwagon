require('dotenv').config();

const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');
const apiRoutes = require('./routes/index');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
// connectDB exits the process if MONGODB_URI is missing or connection fails.
// The server will not start without a database connection.
connectDB();

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ─── 404 Handler (unmatched routes) ──────────────────────────────────────────
app.use(notFound);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅  Work Wagon backend running on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health API  : http://localhost:${PORT}/api/health`);
});
