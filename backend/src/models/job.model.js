import mongoose from 'mongoose';

/**
 * Job Schema
 * Stores job descriptions and their structured analysis
 */
const jobSchema = new mongoose.Schema({
    // Original file info
    originalFilename: {
        type: String,
        required: true,
    },

    // Extracted/analyzed data
    title: {
        type: String,
        default: 'Untitled Position',
    },

    // Structured JD from AI analysis (stored as JSON)
    structuredJD: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },

    // Threshold for shortlisting
    threshold: {
        type: Number,
        default: 70,
        min: 0,
        max: 100,
    },

    // Statistics
    totalCandidates: {
        type: Number,
        default: 0,
    },
    shortlistedCount: {
        type: Number,
        default: 0,
    },

    // Status
    status: {
        type: String,
        enum: ['active', 'closed', 'archived'],
        default: 'active',
    },

    // Timestamps
    processedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt
});

// Indexes
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ title: 'text' });

const Job = mongoose.model('Job', jobSchema);

/**
 * Job Model Helper Methods
 */
class JobModel {
    /**
     * Create a new job
     */
    static async create({ filename, title }) {
        const job = new Job({
            originalFilename: filename,
            title: title || 'Analyzing...',
        });
        await job.save();
        return job._id.toString();
    }

    /**
     * Find job by ID
     */
    static async findById(id) {
        try {
            const job = await Job.findById(id).lean();
            if (!job) return null;

            return {
                id: job._id.toString(),
                original_filename: job.originalFilename,
                title: job.title,
                structured_jd: job.structuredJD,
                threshold: job.threshold,
                total_candidates: job.totalCandidates,
                shortlisted_count: job.shortlistedCount,
                status: job.status,
                created_at: job.createdAt,
                processed_at: job.processedAt,
            };
        } catch (error) {
            if (error.name === 'CastError') return null;
            throw error;
        }
    }

    /**
     * Update structured JD
     */
    static async updateStructuredJD(id, structuredJD) {
        await Job.findByIdAndUpdate(id, {
            structuredJD,
            title: structuredJD.title || 'Untitled Position',
            processedAt: new Date(),
        });
    }

    /**
     * Update threshold
     */
    static async updateThreshold(id, threshold) {
        await Job.findByIdAndUpdate(id, { threshold });
    }

    /**
     * Update candidate counts
     */
    static async updateCounts(id, totalCandidates, shortlistedCount) {
        await Job.findByIdAndUpdate(id, {
            totalCandidates,
            shortlistedCount,
        });
    }

    /**
     * Find all active jobs
     */
    static async findAll() {
        const jobs = await Job.find({ status: 'active' })
            .sort({ createdAt: -1 })
            .lean();

        return jobs.map(job => ({
            id: job._id.toString(),
            original_filename: job.originalFilename,
            title: job.title,
            structured_jd: job.structuredJD,
            threshold: job.threshold,
            total_candidates: job.totalCandidates,
            shortlisted_count: job.shortlistedCount,
            status: job.status,
            created_at: job.createdAt,
            processed_at: job.processedAt,
        }));
    }

    /**
     * Delete job
     */
    static async delete(id) {
        await Job.findByIdAndDelete(id);
    }
}

export { Job };
export default JobModel;
