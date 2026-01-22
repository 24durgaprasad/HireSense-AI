/**
 * API Service
 * Handles all API calls to the backend
 */

// Use environment variable for production, fallback to /api for local dev
const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Make an API request
 */
async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;

    const config = {
        ...options,
        headers: {
            ...options.headers,
        },
    };

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(options.body instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
        if (options.body) {
            config.body = JSON.stringify(options.body);
        }
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

/**
 * Job API
 */
export const jobApi = {
    /**
     * Upload and analyze a job description
     */
    async create(file) {
        const formData = new FormData();
        formData.append('file', file);

        return request('/jobs', {
            method: 'POST',
            body: formData,
        });
    },

    /**
     * Get all jobs
     */
    async getAll() {
        return request('/jobs');
    },

    /**
     * Get job by ID
     */
    async getById(id) {
        return request(`/jobs/${id}`);
    },

    /**
     * Update threshold
     */
    async updateThreshold(id, threshold) {
        return request(`/jobs/${id}/threshold`, {
            method: 'PUT',
            body: { threshold },
        });
    },

    /**
     * Delete job
     */
    async delete(id) {
        return request(`/jobs/${id}`, {
            method: 'DELETE',
        });
    },
};

/**
 * Candidate API
 */
export const candidateApi = {
    /**
     * Upload and analyze resumes
     */
    async upload(jobId, files) {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        return request(`/jobs/${jobId}/candidates`, {
            method: 'POST',
            body: formData,
        });
    },

    /**
     * Get all candidates for a job
     */
    async getAll(jobId, filters = {}) {
        const params = new URLSearchParams();
        if (filters.classification) params.append('classification', filters.classification);
        if (filters.minScore) params.append('minScore', filters.minScore);
        if (filters.maxScore) params.append('maxScore', filters.maxScore);

        const query = params.toString();
        return request(`/jobs/${jobId}/candidates${query ? `?${query}` : ''}`);
    },

    /**
     * Get candidate by ID
     */
    async getById(jobId, candidateId) {
        return request(`/jobs/${jobId}/candidates/${candidateId}`);
    },

    /**
     * Compare candidates
     */
    async compare(jobId, candidateIds) {
        return request(`/jobs/${jobId}/candidates/compare`, {
            method: 'POST',
            body: { candidateIds },
        });
    },

    /**
     * Delete candidate
     */
    async delete(jobId, candidateId) {
        return request(`/jobs/${jobId}/candidates/${candidateId}`, {
            method: 'DELETE',
        });
    },
};

export default { jobApi, candidateApi };
