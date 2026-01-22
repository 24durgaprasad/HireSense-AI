import perplexityClient from '../utils/perplexityClient.js';
import { RESUME_EXTRACTION_PROMPT } from '../prompts/index.js';

/**
 * Resume Intelligence Service
 * 
 * Uses LLM to analyze resumes and extract structured candidate profiles.
 * Extracts skills, experience, projects, and education for matching.
 */
class ResumeIntelligenceService {
    /**
     * Analyze a resume and extract structured data
     * 
     * @param {string} resumeText - Plain text resume
     * @returns {Promise<object>} - Structured resume analysis
     */
    async analyze(resumeText) {
        if (!resumeText || resumeText.trim().length < 100) {
            throw new Error('Resume is too short to analyze. Minimum 100 characters required.');
        }

        try {
            const structuredResume = await perplexityClient.complete(
                RESUME_EXTRACTION_PROMPT,
                resumeText
            );

            // Validate the response structure
            this.validateStructure(structuredResume);

            // Enrich with computed fields
            return this.enrichAnalysis(structuredResume);
        } catch (error) {
            console.error('Resume analysis failed:', error);
            throw new Error(`Failed to analyze resume: ${error.message}`);
        }
    }

    /**
     * Validate the LLM response has required fields
     * 
     * @param {object} resume - Structured resume from LLM
     */
    validateStructure(resume) {
        const requiredFields = ['contact', 'skills', 'experience'];

        for (const field of requiredFields) {
            if (!resume[field]) {
                throw new Error(`Invalid resume analysis: missing ${field}`);
            }
        }

        if (!Array.isArray(resume.skills)) {
            throw new Error('Invalid resume analysis: skills must be an array');
        }
    }

    /**
     * Enrich analysis with computed fields for easier matching
     * 
     * @param {object} resume - Structured resume
     * @returns {object} - Enriched resume
     */
    enrichAnalysis(resume) {
        // Normalize skill names for matching
        const normalizedSkills = (resume.skills || []).map(s => ({
            ...s,
            normalized: this.normalizeSkillName(s.name),
        }));

        // Create skill set for quick lookup
        const skillSet = new Set(normalizedSkills.map(s => s.normalized));

        // Calculate experience metrics
        const positions = resume.experience?.positions || [];
        const totalMonths = positions.reduce((sum, p) => sum + (p.duration_months || 0), 0);

        // Extract all technologies used across positions and projects
        const allTechnologies = new Set();
        positions.forEach(p => {
            (p.technologies || []).forEach(t => allTechnologies.add(this.normalizeSkillName(t)));
        });
        (resume.projects || []).forEach(p => {
            (p.technologies || []).forEach(t => allTechnologies.add(this.normalizeSkillName(t)));
        });

        // Extract domains from experience
        const domains = new Set(
            positions.map(p => p.domain).filter(Boolean)
        );

        return {
            ...resume,
            skills: normalizedSkills,
            _computed: {
                skill_set: Array.from(skillSet),
                technology_set: Array.from(allTechnologies),
                total_experience_months: totalMonths,
                total_experience_years: Math.round(totalMonths / 12 * 10) / 10,
                position_count: positions.length,
                project_count: (resume.projects || []).length,
                domains: Array.from(domains),
                highest_degree: this.getHighestDegree(resume.education || []),
                analyzed_at: new Date().toISOString(),
            },
        };
    }

    /**
     * Normalize skill names for consistent matching
     * Same logic as JD service for consistency
     * 
     * @param {string} skillName - Original skill name
     * @returns {string} - Normalized skill name
     */
    normalizeSkillName(skillName) {
        if (!skillName) return '';

        return skillName
            .toLowerCase()
            .replace(/[.\-_]/g, '')
            .replace(/\s+/g, '')
            .replace(/js$/i, 'javascript')
            .replace(/^js/i, 'javascript')
            .replace(/reactjs/i, 'react')
            .replace(/nodejs/i, 'node')
            .replace(/vuejs/i, 'vue')
            .replace(/angularjs/i, 'angular')
            .trim();
    }

    /**
     * Determine the highest degree from education array
     * 
     * @param {Array} education - Education entries
     * @returns {string} - Highest degree level
     */
    getHighestDegree(education) {
        const degreeRanking = {
            'phd': 5,
            'master': 4,
            'bachelor': 3,
            'associate': 2,
            'certification': 1,
            'high_school': 0,
        };

        let highest = null;
        let highestRank = -1;

        for (const edu of education) {
            const degree = (edu.degree || '').toLowerCase();
            const rank = degreeRanking[degree] ?? 0;

            if (rank > highestRank) {
                highestRank = rank;
                highest = degree;
            }
        }

        return highest || 'unknown';
    }

    /**
     * Extract basic contact info for database storage
     * 
     * @param {object} structuredResume - Structured resume
     * @returns {object} - Contact info
     */
    getContactInfo(structuredResume) {
        const contact = structuredResume.contact || {};
        return {
            name: contact.name || 'Unknown',
            email: contact.email || null,
            phone: contact.phone || null,
        };
    }
}

// Export singleton instance
export const resumeIntelligenceService = new ResumeIntelligenceService();
export default resumeIntelligenceService;
