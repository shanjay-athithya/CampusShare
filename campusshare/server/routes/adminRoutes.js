import express from 'express';
import { requireAdmin } from '../middleware/adminMiddleware.js';
import {
  getAllResources,
  deleteResource,
  getResourceDetails,
  getDashboardStats,
  getAllUsers,
  updateUserRole
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require admin authentication
router.use(requireAdmin);

// Dashboard stats
router.get('/dashboard', getDashboardStats);

// Resource management
router.get('/resources', getAllResources);
router.get('/resources/:id', getResourceDetails);
router.delete('/resources/:id', deleteResource);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);

export default router;
