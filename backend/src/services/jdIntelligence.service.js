import perplexityClient from '../utils/perplexityClient.js';
import { JD_EXTRACTION_PROMPT } from '../prompts/index.js';

/**
 * JD Intelligence Service
 * 
 * Uses LLM to analyze job descriptions and extract structured requirements.
 * This enables semantic matching rather than keyword matching.
 */
class JDIntelligenceService {
    /**
     * Analyze a job description and extract structured data
     * 
     * @param {string} jdText - Plain text job description
     * @returns {Promise<object>} - Structured JD analysis
     */
    async analyze(jdText) {
        if (!jdText || jdText.trim().length < 50) {
            throw new Error('Job description is too short to analyze. Minimum 50 characters required.');
        }

        try {
            const structuredJD = await perplexityClient.complete(
                JD_EXTRACTION_PROMPT,
                jdText
            );

            // Validate the response structure
            this.validateStructure(structuredJD);

            // Enrich with computed fields
            return this.enrichAnalysis(structuredJD);
        } catch (error) {
            console.error('JD analysis failed:', error);
            throw new Error(`Failed to analyze job description: ${error.message}`);
        }
    }

    /**
     * Validate the LLM response has required fields
     * 
     * @param {object} jd - Structured JD from LLM
     */
    validateStructure(jd) {
        const requiredFields = ['title', 'required_skills', 'experience', 'education'];

        for (const field of requiredFields) {
            if (!jd[field]) {
                throw new Error(`Invalid JD analysis: missing ${field}`);
            }
        }

        if (!Array.isArray(jd.required_skills)) {
            throw new Error('Invalid JD analysis: required_skills must be an array');
        }
    }

    /**
     * Enrich analysis with computed fields for easier matching
     * 
     * @param {object} jd - Structured JD
     * @returns {object} - Enriched JD
     */
    enrichAnalysis(jd) {
        // Create skill lookup maps for faster matching
        const allSkills = [
            ...(jd.required_skills || []),
            ...(jd.preferred_skills || []),
        ];

        // Normalize skill names for matching
        const normalizedRequiredSkills = (jd.required_skills || []).map(s => ({
            ...s,
            normalized: this.normalizeSkillName(s.name),
        }));

        const normalizedPreferredSkills = (jd.preferred_skills || []).map(s => ({
            ...s,
            normalized: this.normalizeSkillName(s.name),
        }));

        // Calculate skill importance weights
        const maxImportance = Math.max(
            ...allSkills.map(s => s.importance || 3)
        );

        return {
            ...jd,
            required_skills: normalizedRequiredSkills,
            preferred_skills: normalizedPreferredSkills,
            _computed: {
                total_required_skills: normalizedRequiredSkills.length,
                total_preferred_skills: normalizedPreferredSkills.length,
                max_importance: maxImportance,
                min_experience_years: jd.experience?.min_years || 0,
                max_experience_years: jd.experience?.max_years || null,
                analyzed_at: new Date().toISOString(),
            },
        };
    }

    /**
     * Normalize skill names for consistent matching
     * 
     * @param {string} skillName - Original skill name
     * @returns {string} - Normalized skill name
     */
    normalizeSkillName(skillName) {
        if (!skillName) return '';

        return skillName
            .toLowerCase()
            .replace(/[.\-_]/g, '')  // Remove dots, dashes, underscores
            .replace(/\s+/g, '')     // Remove spaces
            .replace(/js$/i, 'javascript')  // js -> javascript
            .replace(/^js/i, 'javascript')  // js -> javascript
            .replace(/reactjs/i, 'react')
            .replace(/nodejs/i, 'node')
            .replace(/vuejs/i, 'vue')
            .replace(/angularjs/i, 'angular')
            .trim();
    }

    /**
     * Get a simple text representation of requirements for display
     * 
     * @param {object} structuredJD - Structured JD analysis
     * @returns {string} - Human-readable summary
     */
    getSummary(structuredJD) {
        const parts = [];

        if (structuredJD.title) {
            parts.push(`**Position:** ${structuredJD.title}`);
        }

        if (structuredJD.seniority_level) {
            parts.push(`**Level:** ${structuredJD.seniority_level}`);
        }

        if (structuredJD.experience?.min_years) {
            const exp = structuredJD.experience;
            const expText = exp.max_years
                ? `${exp.min_years}-${exp.max_years} years`
                : `${exp.min_years}+ years`;
            parts.push(`**Experience:** ${expText}`);
        }

        if (structuredJD.required_skills?.length) {
            const skills = structuredJD.required_skills.map(s => s.name).join(', ');
            parts.push(`**Required Skills:** ${skills}`);
        }

        return parts.join('\n');
    }
}

// Export singleton instance
export const jdIntelligenceService = new JDIntelligenceService();
export default jdIntelligenceService;
