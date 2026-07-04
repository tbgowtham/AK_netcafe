import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import serverless from 'serverless-http';

dotenv.config();

const app = express();

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

export const handler = serverless(app);
