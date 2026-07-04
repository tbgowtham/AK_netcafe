import express from 'express';
import { 
  getAllRequests,
  createRequest,
  updateRequestStatus,
  deleteRequest,
  getStats,
  getAllChats,
  createChatMessage,
  clearAllChats,
  registerCustomer,
  getAllCustomers
} from '../controllers/netcafeController.js';
import { login } from '../controllers/authController.js';

const router = express.Router();

// Auth route
router.post('/auth/login', login);

// Service Requests routes
router.get('/requests', getAllRequests);
router.post('/requests', createRequest);
router.put('/requests/:id/status', updateRequestStatus);
router.delete('/requests/:id', deleteRequest);
router.get('/stats', getStats);

// Chats routes
router.get('/chats', getAllChats);
router.post('/chats', createChatMessage);
router.delete('/chats', clearAllChats);

// Customers routes
router.post('/customers', registerCustomer);
router.get('/customers', getAllCustomers);

export default router;
