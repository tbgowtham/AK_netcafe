import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import { initializeDatabase } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so the React app can communicate with the server
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Main API routes
app.use('/api', apiRouter);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

// Initialize database and start the server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`AK Netcafe backend running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}).catch((err) => {
  console.error('Failed to initialize database, shutting down server:', err);
  process.exit(1);
});

