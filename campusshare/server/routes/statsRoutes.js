import express from 'express';
import { getTopContributors } from '../controllers/statsController.js';

const router = express.Router();

router.get('/top-contributors', getTopContributors);

export default router;


