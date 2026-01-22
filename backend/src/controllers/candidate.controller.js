import { JobModel, CandidateModel } from '../models/index.js';
import {
    fileProcessingService,
    resumeIntelligenceService,
    matchingService,
    rankingService,
} from '../services/index.js';
import config from '../config/index.js';

/**
 * Candidate Controller
 * 
 * Thin controller for candidate-related endpoints.
 * Orchestrates the resume analysis and matching pipeline.
 */
class CandidateController {
    /**
     * POST /api/jobs/:jobId/candidates
     * Upload and analyze resumes for a job
     */
    async uploadResumes(req, res) {
        const processedFiles = [];

        try {
            const { jobId } = req.params;

            // Validate job exists
            const job = await JobModel.findById(jobId);
            if (!job) {
                return res.status(404).json({
                    success: false,
                    error: 'Job not found',
                });
            }

            if (!job.structured_jd) {
                return res.status(400).json({
                    success: false,
                    error: 'Job description has not been analyzed yet',
                });
            }

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No files uploaded. Please upload resume files.',
                });
            }

            console.log(`📄 Processing ${req.files.length} resumes for job: ${job.structured_jd.title}`);

            const results = [];
            const errors = [];

            // Process each resume
            for (const file of req.files) {
                try {
                    const result = await this.processResume(file, job);
                    results.push(result);
                    processedFiles.push(file.path);
                } catch (error) {
                    console.error(`Failed to process ${file.originalname}:`, error.message);
                    errors.push({
                        filename: file.originalname,
                        error: error.message,
                    });
                    // Clean up failed file
                    await fileProcessingService.deleteFile(file.path);
                }
            }

            // Update job candidate counts
            const stats = await CandidateModel.getStats(jobId);
            await JobModel.updateCounts(jobId, stats.total, stats.shortlisted);

            // Clean up processed files
            for (const filePath of processedFiles) {
                await fileProcessingService.deleteFile(filePath);
            }

            console.log(`✅ Processed ${results.length}/${req.files.length} resumes`);

            res.status(201).json({
                success: true,
                data: {
                    processed: results.length,
                    failed: errors.length,
                    candidates: results.map(r => ({
                        id: r.id,
                        name: r.name,
                        score: r.scores.total,
                        classification: r.classification,
                    })),
                    errors: errors.length > 0 ? errors : undefined,
                },
                message: `Successfully processed ${results.length} resume(s)`,
            });
        } catch (error) {
            console.error('Upload resumes failed:', error);

            // Clean up all files on error
            if (req.files) {
                for (const file of req.files) {
                    await fileProcessingService.deleteFile(file.path);
                }
            }

            res.status(500).json({
                success: false,
                error: error.message || 'Failed to process resumes',
            });
        }
    }

    /**
     * Process a single resume file
     * 
     * @param {object} file - Multer file object
     * @param {object} job - Job record with structured JD
     * @returns {Promise<object>} - Candidate result
     */
    async processResume(file, job) {
        const filePath = file.path;
        const filename = file.originalname;

        console.log(`  📝 Processing: ${filename}`);

        // Step 1: Validate file
        await fileProcessingService.validateFile(filePath, config.upload.maxFileSizeBytes);

        // Step 2: Extract text
        const resumeText = await fileProcessingService.extractText(filePath);

        if (!resumeText || resumeText.length < 100) {
            throw new Error('Could not extract sufficient text from resume');
        }

        // Step 3: Analyze resume with AI
        const structuredResume = await resumeIntelligenceService.analyze(resumeText);

        // Step 4: Extract contact info
        const contactInfo = resumeIntelligenceService.getContactInfo(structuredResume);

        // Step 5: Create candidate record
        const candidateId = await CandidateModel.create({
            jobId: job.id,
            filename,
            name: contactInfo.name,
            email: contactInfo.email,
            phone: contactInfo.phone,
        });

        // Step 6: Calculate match score
        const matchResult = await matchingService.calculateMatch(
            job.structured_jd,
            structuredResume
        );

        // Step 7: Classify candidate
        const classification = rankingService.classifyCandidate(
            matchResult.scores.total,
            job.threshold
        );

        // Step 8: Update candidate with results
        await CandidateModel.updateAnalysis(candidateId, {
            structuredResume,
            scoreTotal: matchResult.scores.total,
            scoreSkills: matchResult.scores.skills,
            scoreExperience: matchResult.scores.experience,
            scoreProjects: matchResult.scores.projects,
            scoreEducation: matchResult.scores.education,
            explanation: JSON.stringify(matchResult.explanation),
            classification,
        });

        console.log(`  ✅ ${contactInfo.name}: ${matchResult.scores.total}/100 (${classification})`);

        return {
            id: candidateId,
            name: contactInfo.name,
            email: contactInfo.email,
            scores: matchResult.scores,
            classification,
            explanation: matchResult.explanation,
        };
    }

    /**
     * GET /api/jobs/:jobId/candidates
     * Get ranked candidates for a job
     */
    async getCandidates(req, res) {
        try {
            const { jobId } = req.params;
            const { classification, minScore, maxScore } = req.query;

            const job = await JobModel.findById(jobId);
            if (!job) {
                return res.status(404).json({
                    success: false,
                    error: 'Job not found',
                });
            }

            const filters = {};
            if (classification) filters.classification = classification;
            if (minScore) filters.minScore = parseInt(minScore, 10);
            if (maxScore) filters.maxScore = parseInt(maxScore, 10);

            const results = await rankingService.getRankedResults(
                jobId,
                job.threshold,
                filters
            );

            res.json({
                success: true,
                data: {
                    jobId,
                    jobTitle: job.structured_jd?.title,
                    threshold: job.threshold,
                    ...results,
                },
            });
        } catch (error) {
            console.error('Get candidates failed:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve candidates',
            });
        }
    }

    /**
     * GET /api/jobs/:jobId/candidates/:candidateId
     * Get detailed candidate info
     */
    async getCandidate(req, res) {
        try {
            const { jobId, candidateId } = req.params;

            const candidate = await CandidateModel.findById(candidateId);

            if (!candidate || candidate.job_id !== jobId) {
                return res.status(404).json({
                    success: false,
                    error: 'Candidate not found',
                });
            }

            const job = await JobModel.findById(jobId);

            res.json({
                success: true,
                data: {
                    id: candidate.id,
                    jobId: candidate.job_id,
                    jobTitle: job?.structured_jd?.title,
                    name: candidate.name,
                    email: candidate.email,
                    phone: candidate.phone,
                    scores: {
                        total: candidate.score_total,
                        skills: candidate.score_skills,
                        experience: candidate.score_experience,
                        projects: candidate.score_projects,
                        education: candidate.score_education,
                    },
                    classification: candidate.classification,
                    classificationDisplay: rankingService.getClassificationDisplay(candidate.classification),
                    structuredResume: candidate.structured_resume,
                    explanation: typeof candidate.explanation === 'string'
                        ? JSON.parse(candidate.explanation)
                        : candidate.explanation,
                    processedAt: candidate.processed_at,
                },
            });
        } catch (error) {
            console.error('Get candidate failed:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve candidate',
            });
        }
    }

    /**
     * POST /api/jobs/:jobId/candidates/compare
     * Compare multiple candidates
     */
    async compareCandidates(req, res) {
        try {
            const { jobId } = req.params;
            const { candidateIds } = req.body;

            if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length < 2) {
                return res.status(400).json({
                    success: false,
                    error: 'Please provide at least 2 candidate IDs to compare',
                });
            }

            const job = await JobModel.findById(jobId);
            if (!job) {
                return res.status(404).json({
                    success: false,
                    error: 'Job not found',
                });
            }

            const comparison = await rankingService.compareCandidates(candidateIds);

            res.json({
                success: true,
                data: {
                    jobId,
                    jobTitle: job.structured_jd?.title,
                    comparison,
                },
            });
        } catch (error) {
            console.error('Compare candidates failed:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to compare candidates',
            });
        }
    }

    /**
     * DELETE /api/jobs/:jobId/candidates/:candidateId
     * Delete a candidate
     */
    async deleteCandidate(req, res) {
        try {
            const { jobId, candidateId } = req.params;

            const candidate = await CandidateModel.findById(candidateId);

            if (!candidate || candidate.job_id !== jobId) {
                return res.status(404).json({
                    success: false,
                    error: 'Candidate not found',
                });
            }

            await CandidateModel.delete(candidateId);

            // Update job counts
            const stats = await CandidateModel.getStats(jobId);
            await JobModel.updateCounts(jobId, stats.total, stats.shortlisted);

            res.json({
                success: true,
                message: 'Candidate deleted',
            });
        } catch (error) {
            console.error('Delete candidate failed:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete candidate',
            });
        }
    }
}

export const candidateController = new CandidateController();
export default candidateController;
