import config from '../config/index.js';
import { CandidateModel } from '../models/index.js';

/**
 * Ranking Service
 * 
 * Handles candidate ranking and classification based on scores and thresholds.
 * Provides shortlisting, borderline, and rejection categorization.
 */
class RankingService {
    constructor() {
        this.defaultThreshold = config.scoring.defaultThreshold;
        this.borderlineRange = config.scoring.borderlineRange;
    }

    /**
     * Classify a candidate based on their score and threshold
     * 
     * @param {number} score - Candidate's total score (0-100)
     * @param {number} threshold - Shortlisting threshold
     * @returns {string} - Classification: 'shortlisted', 'borderline', or 'rejected'
     */
    classifyCandidate(score, threshold = this.defaultThreshold) {
        if (score >= threshold) {
            return 'shortlisted';
        } else if (score >= threshold - this.borderlineRange) {
            return 'borderline';
        } else {
            return 'rejected';
        }
    }

    /**
     * Get classification label with emoji for display
     * 
     * @param {string} classification - Classification string
     * @returns {object} - Label and emoji
     */
    getClassificationDisplay(classification) {
        const displays = {
            shortlisted: { label: 'Shortlisted', emoji: '✅', color: 'green' },
            borderline: { label: 'Borderline', emoji: '⚠️', color: 'yellow' },
            rejected: { label: 'Rejected', emoji: '❌', color: 'red' },
        };
        return displays[classification] || displays.rejected;
    }

    /**
     * Rank candidates by score (descending)
     * 
     * @param {Array} candidates - Array of candidate objects with scores
     * @returns {Array} - Ranked candidates with position
     */
    rankCandidates(candidates) {
        // Sort by total score descending
        const sorted = [...candidates].sort((a, b) => {
            const scoreA = a.score_total ?? a.scores?.total ?? 0;
            const scoreB = b.score_total ?? b.scores?.total ?? 0;
            return scoreB - scoreA;
        });

        // Add rank position
        return sorted.map((candidate, index) => ({
            ...candidate,
            rank: index + 1,
        }));
    }

    /**
     * Apply threshold to candidates and update classifications
     * 
     * @param {string} jobId - Job ID
     * @param {number} threshold - New threshold value
     * @returns {Promise<object>} - Updated statistics
     */
    async applyThreshold(jobId, threshold) {
        const candidates = await CandidateModel.findByJobId(jobId);

        let shortlisted = 0;
        let borderline = 0;
        let rejected = 0;

        for (const candidate of candidates) {
            const classification = this.classifyCandidate(candidate.score_total, threshold);
            await CandidateModel.updateClassification(candidate.id, classification);

            switch (classification) {
                case 'shortlisted':
                    shortlisted++;
                    break;
                case 'borderline':
                    borderline++;
                    break;
                case 'rejected':
                    rejected++;
                    break;
            }
        }

        return {
            total: candidates.length,
            shortlisted,
            borderline,
            rejected,
            threshold,
        };
    }

    /**
     * Get ranked results for a job with classification
     * 
     * @param {string} jobId - Job ID
     * @param {number} threshold - Threshold for classification
     * @param {object} filters - Optional filters
     * @returns {Promise<object>} - Ranked results with stats
     */
    async getRankedResults(jobId, threshold, filters = {}) {
        let candidates = await CandidateModel.findByJobId(jobId);

        // Apply filters if specified
        if (filters.classification) {
            candidates = candidates.filter(c => c.classification === filters.classification);
        }

        if (filters.minScore !== undefined) {
            candidates = candidates.filter(c => c.score_total >= filters.minScore);
        }

        if (filters.maxScore !== undefined) {
            candidates = candidates.filter(c => c.score_total <= filters.maxScore);
        }

        // Rank candidates
        const rankedCandidates = this.rankCandidates(candidates);

        // Format for response
        const formattedCandidates = rankedCandidates.map(c => ({
            id: c.id,
            rank: c.rank,
            name: c.name,
            email: c.email,
            scores: {
                total: c.score_total,
                skills: c.score_skills,
                experience: c.score_experience,
                projects: c.score_projects,
                education: c.score_education,
            },
            classification: c.classification,
            classificationDisplay: this.getClassificationDisplay(c.classification),
            explanation: typeof c.explanation === 'string'
                ? JSON.parse(c.explanation)
                : c.explanation,
            processedAt: c.processed_at,
        }));

        // Get statistics
        const stats = await CandidateModel.getStats(jobId);

        return {
            candidates: formattedCandidates,
            stats: {
                ...stats,
                threshold,
                averageScore: candidates.length > 0
                    ? Math.round(candidates.reduce((sum, c) => sum + c.score_total, 0) / candidates.length)
                    : 0,
                highestScore: candidates.length > 0
                    ? Math.max(...candidates.map(c => c.score_total))
                    : 0,
                lowestScore: candidates.length > 0
                    ? Math.min(...candidates.map(c => c.score_total))
                    : 0,
            },
        };
    }

    /**
     * Get comparison between candidates
     * 
     * @param {Array<string>} candidateIds - IDs of candidates to compare
     * @returns {Promise<object>} - Comparison data
     */
    async compareCandidates(candidateIds) {
        const candidates = await Promise.all(
            candidateIds.map(id => CandidateModel.findById(id))
        );

        // Filter out any not found
        const validCandidates = candidates.filter(Boolean);

        if (validCandidates.length < 2) {
            throw new Error('Need at least 2 valid candidates to compare');
        }

        // Create comparison matrix
        const comparison = {
            candidates: validCandidates.map(c => ({
                id: c.id,
                name: c.name,
                scores: {
                    total: c.score_total,
                    skills: c.score_skills,
                    experience: c.score_experience,
                    projects: c.score_projects,
                    education: c.score_education,
                },
                classification: c.classification,
            })),
            dimensions: ['skills', 'experience', 'projects', 'education'].map(dim => ({
                dimension: dim,
                scores: validCandidates.map(c => ({
                    candidateId: c.id,
                    score: c[`score_${dim}`],
                })),
                winner: validCandidates.reduce((best, c) =>
                    (c[`score_${dim}`] || 0) > (best[`score_${dim}`] || 0) ? c : best
                ).id,
            })),
            overallWinner: validCandidates.reduce((best, c) =>
                (c.score_total || 0) > (best.score_total || 0) ? c : best
            ).id,
        };

        return comparison;
    }
}

// Export singleton instance
export const rankingService = new RankingService();
export default rankingService;
