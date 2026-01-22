import { Router } from 'express';
import { jobController } from '../controllers/index.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.middleware.js';

const router = Router();

/**
 * Job Routes
 * 
 * POST   /api/jobs              - Upload and analyze a job description
 * GET    /api/jobs              - Get all jobs
 * GET    /api/jobs/:id          - Get job details
 * PUT    /api/jobs/:id/threshold - Update shortlist threshold
 * DELETE /api/jobs/:id          - Delete a job
 */

// Upload and analyze JD
router.post(
    '/',
    uploadSingle,
    handleUploadError,
    (req, res) => jobController.createJob(req, res)
);

// Get all jobs
router.get('/', (req, res) => jobController.getAllJobs(req, res));

// Get job by ID
router.get('/:id', (req, res) => jobController.getJob(req, res));

// Update threshold
router.put('/:id/threshold', (req, res) => jobController.updateThreshold(req, res));

// Delete job
router.delete('/:id', (req, res) => jobController.deleteJob(req, res));

export default router;
