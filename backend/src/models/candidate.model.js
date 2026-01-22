import mongoose from 'mongoose';

/**
 * Candidate Schema
 * Stores candidate analysis results (NOT raw resumes for privacy)
 */
const candidateSchema = new mongoose.Schema({
    // Reference to job
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true,
        index: true,
    },

    // Basic contact info (minimal PII)
    name: {
        type: String,
        default: 'Unknown',
    },
    email: {
        type: String,
        default: null,
    },
    phone: {
        type: String,
        default: null,
    },

    // Original file info
    originalFilename: {
        type: String,
        required: true,
    },

    // Structured resume from AI analysis (stored as JSON)
    structuredResume: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },

    // Scores
    scoreTotal: {
        type: Number,
        default: 0,
    },
    scoreSkills: {
        type: Number,
        default: 0,
    },
    scoreExperience: {
        type: Number,
        default: 0,
    },
    scoreProjects: {
        type: Number,
        default: 0,
    },
    scoreEducation: {
        type: Number,
        default: 0,
    },

    // AI-generated explanation
    explanation: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },

    // Status
    status: {
        type: String,
        enum: ['pending', 'processing', 'processed', 'error'],
        default: 'pending',
    },

    // Classification based on threshold
    classification: {
        type: String,
        enum: ['shortlisted', 'borderline', 'rejected', null],
        default: null,
    },

    // Processing timestamp
    processedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

// Indexes for efficient querying
candidateSchema.index({ jobId: 1, scoreTotal: -1 });
candidateSchema.index({ jobId: 1, classification: 1 });
candidateSchema.index({ jobId: 1, status: 1 });

const Candidate = mongoose.model('Candidate', candidateSchema);

/**
 * Candidate Model Helper Methods
 */
class CandidateModel {
    /**
     * Create new candidate
     */
    static async create({ jobId, filename, name, email, phone }) {
        const candidate = new Candidate({
            jobId,
            originalFilename: filename,
            name: name || 'Unknown',
            email,
            phone,
        });
        await candidate.save();
        return candidate._id.toString();
    }

    /**
     * Find candidate by ID
     */
    static async findById(id) {
        try {
            const candidate = await Candidate.findById(id).lean();
            if (!candidate) return null;

            return {
                id: candidate._id.toString(),
                job_id: candidate.jobId.toString(),
                name: candidate.name,
                email: candidate.email,
                phone: candidate.phone,
                original_filename: candidate.originalFilename,
                structured_resume: candidate.structuredResume,
                score_total: candidate.scoreTotal,
                score_skills: candidate.scoreSkills,
                score_experience: candidate.scoreExperience,
                score_projects: candidate.scoreProjects,
                score_education: candidate.scoreEducation,
                explanation: candidate.explanation,
                status: candidate.status,
                classification: candidate.classification,
                created_at: candidate.createdAt,
                processed_at: candidate.processedAt,
            };
        } catch (error) {
            if (error.name === 'CastError') return null;
            throw error;
        }
    }

    /**
     * Find all candidates for a job, ordered by score
     */
    static async findByJobId(jobId) {
        const candidates = await Candidate.find({ jobId })
            .sort({ scoreTotal: -1, createdAt: 1 })
            .lean();

        return candidates.map(c => ({
            id: c._id.toString(),
            job_id: c.jobId.toString(),
            name: c.name,
            email: c.email,
            phone: c.phone,
            original_filename: c.originalFilename,
            structured_resume: c.structuredResume,
            score_total: c.scoreTotal,
            score_skills: c.scoreSkills,
            score_experience: c.scoreExperience,
            score_projects: c.scoreProjects,
            score_education: c.scoreEducation,
            explanation: c.explanation,
            status: c.status,
            classification: c.classification,
            created_at: c.createdAt,
            processed_at: c.processedAt,
        }));
    }

    /**
     * Update candidate analysis results
     */
    static async updateAnalysis(id, {
        structuredResume,
        scoreTotal,
        scoreSkills,
        scoreExperience,
        scoreProjects,
        scoreEducation,
        explanation,
        classification,
    }) {
        await Candidate.findByIdAndUpdate(id, {
            structuredResume,
            scoreTotal,
            scoreSkills,
            scoreExperience,
            scoreProjects,
            scoreEducation,
            explanation,
            classification,
            status: 'processed',
            processedAt: new Date(),
        });
    }

    /**
     * Update classification
     */
    static async updateClassification(id, classification) {
        await Candidate.findByIdAndUpdate(id, { classification });
    }

    /**
     * Get candidates by classification
     */
    static async findByClassification(jobId, classification) {
        const candidates = await Candidate.find({ jobId, classification })
            .sort({ scoreTotal: -1 })
            .lean();

        return candidates.map(c => ({
            id: c._id.toString(),
            job_id: c.jobId.toString(),
            name: c.name,
            email: c.email,
            score_total: c.scoreTotal,
            classification: c.classification,
        }));
    }

    /**
     * Get statistics for a job
     */
    static async getStats(jobId) {
        const [total, shortlisted, borderline, rejected] = await Promise.all([
            Candidate.countDocuments({ jobId }),
            Candidate.countDocuments({ jobId, classification: 'shortlisted' }),
            Candidate.countDocuments({ jobId, classification: 'borderline' }),
            Candidate.countDocuments({ jobId, classification: 'rejected' }),
        ]);

        return { total, shortlisted, borderline, rejected };
    }

    /**
     * Delete candidate
     */
    static async delete(id) {
        await Candidate.findByIdAndDelete(id);
    }

    /**
     * Delete all candidates for a job (called when job is deleted)
     */
    static async deleteByJobId(jobId) {
        await Candidate.deleteMany({ jobId });
    }
}

// Middleware to delete candidates when job is deleted
mongoose.model('Job').schema.pre('findOneAndDelete', async function (next) {
    const jobId = this.getQuery()._id;
    await Candidate.deleteMany({ jobId });
    next();
});

export { Candidate };
export default CandidateModel;
