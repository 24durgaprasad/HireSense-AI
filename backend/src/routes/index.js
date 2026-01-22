import { Router } from 'express';
import jobRoutes from './job.routes.js';
import candidateRoutes from './candidate.routes.js';

const router = Router();

/**
 * API Routes
 * 
 * /api/jobs                       - Job management
 * /api/jobs/:jobId/candidates     - Candidate management
 * /api/health                     - Health check
 */

// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Job routes
router.use('/jobs', jobRoutes);

// Candidate routes (nested under jobs)
router.use('/jobs/:jobId/candidates', candidateRoutes);

export default router;
