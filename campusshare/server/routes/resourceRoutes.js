import express from 'express';
import { createResource, getResources, getResource, deleteResource, voteResource, downloadResource, getDownloadUrl } from '../controllers/resourceController.js';
import { authenticate, isAdmin, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/resources - Create resource (protected)
router.post('/', authenticate, createResource);

// GET /api/resources - List resources with pagination and filtering (optional auth for vote status)
router.get('/', optionalAuth, getResources);

// GET /api/resources/:id - Get single resource
router.get('/:id', getResource);

// DELETE /api/resources/:id - Delete resource (protected, owner or admin)
router.delete('/:id', authenticate, deleteResource);

// POST /api/resources/:id/vote - Vote on resource (protected)
router.post('/:id/vote', authenticate, voteResource);

// GET /api/resources/:id/download - Download resource (public with security)
router.get('/:id/download', downloadResource);

// GET /api/resources/:id/download-url - Get signed download URL (protected)
router.get('/:id/download-url', authenticate, getDownloadUrl);

export default router;
