import { JobModel } from '../models/index.js';
import {
    fileProcessingService,
    jdIntelligenceService,
} from '../services/index.js';
import config from '../config/index.js';

/**
 * Job Controller
 * 
 * Thin controller for job-related endpoints.
 * Orchestrates flow between services - NO business logic here.
 */
class JobController {
    /**
     * POST /api/jobs
     * Upload and analyze a job description
     */
    async createJob(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded. Please upload a .docx or .pdf file.',
                });
            }

            const filePath = req.file.path;
            const filename = req.file.originalname;

            console.log(`📄 Processing JD: ${filename}`);

            // Step 1: Validate file
            await fileProcessingService.validateFile(filePath, config.upload.maxFileSizeBytes);

            // Step 2: Extract text from file
            const jdText = await fileProcessingService.extractText(filePath);

            if (!jdText || jdText.length < 50) {
                await fileProcessingService.deleteFile(filePath);
                return res.status(400).json({
                    success: false,
                    error: 'Could not extract sufficient text from the file. Please ensure it contains a valid job description.',
                });
            }

            // Step 3: Create job record
            const jobId = await JobModel.create({
                filename,
                title: 'Analyzing...',
            });

            // Step 4: Analyze JD with AI
            console.log(`🤖 Analyzing JD with AI...`);
            const structuredJD = await jdIntelligenceService.analyze(jdText);

            // Step 5: Update job with analysis
            await JobModel.updateStructuredJD(jobId, structuredJD);

            // Step 6: Clean up uploaded file (we don't store raw files)
            await fileProcessingService.deleteFile(filePath);

            // Step 7: Fetch complete job record
            const job = await JobModel.findById(jobId);

            console.log(`✅ JD analyzed: ${structuredJD.title}`);

            res.status(201).json({
                success: true,
                data: {
                    id: job.id,
                    title: structuredJD.title,
                    seniorityLevel: structuredJD.seniority_level,
                    requiredSkills: structuredJD.required_skills?.map(s => s.name) || [],
                    preferredSkills: structuredJD.preferred_skills?.map(s => s.name) || [],
                    experience: structuredJD.experience,
                    education: structuredJD.education,
                    threshold: job.threshold,
                    createdAt: job.created_at,
                },
                message: 'Job description analyzed successfully',
            });
        } catch (error) {
            console.error('Create job failed:', error);

            // Clean up file on error
            if (req.file?.path) {
                await fileProcessingService.deleteFile(req.file.path);
            }

            res.status(500).json({
                success: false,
                error: error.message || 'Failed to process job description',
            });
        }
    }

    /**
     * GET /api/jobs
     * Get all jobs
     */
    async getAllJobs(req, res) {
        try {
            const jobs = await JobModel.findAll();

            const formattedJobs = jobs.map(job => ({
                id: job.id,
                title: job.structured_jd?.title || job.title || 'Untitled',
                totalCandidates: job.total_candidates,
                shortlistedCount: job.shortlisted_count,
                threshold: job.threshold,
                createdAt: job.created_at,
                status: job.status,
            }));

            res.json({
                success: true,
                data: formattedJobs,
            });
        } catch (error) {
            console.error('Get all jobs failed:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve jobs',
            });
        }
    }

    /**
     * GET /api/jobs/:id
     * Get job details
     */
    async getJob(req, res) {
        try {
            const { id } = req.params;
            const job = await JobModel.findById(id);

            if (!job) {
                return res.status(404).json({
                    success: false,
                    error: 'Job not found',
                });
            }

            res.json({
                success: true,
                data: {
                    id: job.id,
                    title: job.structured_jd?.title || 'Untitled',
                    originalFilename: job.original_filename,
                    structuredJD: job.structured_jd,
                    threshold: job.threshold,
                    totalCandidates: job.total_candidates,
                    shortlistedCount: job.shortlisted_count,
                    createdAt: job.created_at,
                    processedAt: job.processed_at,
                },
            });
        } catch (error) {
            console.error('Get job failed:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve job',
            });
        }
    }

    /**
     * PUT /api/jobs/:id/threshold
     * Update shortlist threshold
     */
    async updateThreshold(req, res) {
        try {
            const { id } = req.params;
            const { threshold } = req.body;

            if (threshold === undefined || threshold < 0 || threshold > 100) {
                return res.status(400).json({
                    success: false,
                    error: 'Threshold must be a number between 0 and 100',
                });
            }

            const job = await JobModel.findById(id);
            if (!job) {
                return res.status(404).json({
                    success: false,
                    error: 'Job not found',
                });
            }

            await JobModel.updateThreshold(id, threshold);

            // Import ranking service dynamically to avoid circular deps
            const { rankingService } = await import('../services/index.js');

            // Reapply threshold to all candidates
            const stats = await rankingService.applyThreshold(id, threshold);

            // Update job counts
            await JobModel.updateCounts(id, stats.total, stats.shortlisted);

            res.json({
                success: true,
                data: {
                    jobId: id,
                    threshold,
                    stats,
                },
                message: 'Threshold updated and candidates reclassified',
            });
        } catch (error) {
            console.error('Update threshold failed:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update threshold',
            });
        }
    }

    /**
     * DELETE /api/jobs/:id
     * Delete a job and all associated candidates
     */
    async deleteJob(req, res) {
        try {
            const { id } = req.params;

            const job = await JobModel.findById(id);
            if (!job) {
                return res.status(404).json({
                    success: false,
                    error: 'Job not found',
                });
            }

            await JobModel.delete(id);

            res.json({
                success: true,
                message: 'Job and all associated candidates deleted',
            });
        } catch (error) {
            console.error('Delete job failed:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete job',
            });
        }
    }
}

export const jobController = new JobController();
export default jobController;
