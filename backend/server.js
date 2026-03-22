const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const mongoose = require('mongoose');

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/amal', require('./routes/amalRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/reminder', require('./routes/reminderRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/tips', require('./routes/tipRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'My Amal API Running', version: '0.1.0' });
});

// ✅ Health Check Route (UptimeRobot এর জন্য)
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;

  const dbState = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  }[dbStatus];

  const isHealthy = dbStatus === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + 's',
    database: dbState,
    version: '1.0.0',
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ success: false, message: 'Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ My Amal Server running on port ${PORT}`),
);
