import { Router } from 'express';
import { candidateController } from '../controllers/index.js';
import { uploadMultiple, handleUploadError } from '../middleware/upload.middleware.js';

const router = Router({ mergeParams: true }); // mergeParams to access :jobId from parent route

/**
 * Candidate Routes (nested under /api/jobs/:jobId)
 * 
 * POST   /api/jobs/:jobId/candidates          - Upload and analyze resumes
 * GET    /api/jobs/:jobId/candidates          - Get ranked candidates
 * GET    /api/jobs/:jobId/candidates/:id      - Get candidate details
 * POST   /api/jobs/:jobId/candidates/compare  - Compare candidates
 * DELETE /api/jobs/:jobId/candidates/:id      - Delete candidate
 */

// Upload and analyze resumes (bulk)
router.post(
    '/',
    uploadMultiple,
    handleUploadError,
    (req, res) => candidateController.uploadResumes(req, res)
);

// Get ranked candidates
router.get('/', (req, res) => candidateController.getCandidates(req, res));

// Compare candidates (must be before /:candidateId to avoid conflict)
router.post('/compare', (req, res) => candidateController.compareCandidates(req, res));

// Get candidate details
router.get('/:candidateId', (req, res) => candidateController.getCandidate(req, res));

// Delete candidate
router.delete('/:candidateId', (req, res) => candidateController.deleteCandidate(req, res));

export default router;
