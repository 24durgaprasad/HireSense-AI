import config from '../config/index.js';
import perplexityClient from '../utils/perplexityClient.js';
import { MATCH_EXPLANATION_PROMPT } from '../prompts/index.js';

/**
 * Matching Service
 * 
 * The core scoring engine that compares structured JD against structured resume.
 * Uses weighted scoring with explainability.
 * 
 * Scoring Weights:
 * - Skills: 50%
 * - Experience: 25%
 * - Projects: 15%
 * - Education: 10%
 */
class MatchingService {
    constructor() {
        this.weights = config.scoring.weights;
    }

    /**
     * Calculate match score between JD and Resume
     * 
     * @param {object} structuredJD - Analyzed job description
     * @param {object} structuredResume - Analyzed resume
     * @returns {Promise<object>} - Scoring results with explanation
     */
    async calculateMatch(structuredJD, structuredResume) {
        // Calculate individual dimension scores
        const skillsScore = this.calculateSkillsScore(structuredJD, structuredResume);
        const experienceScore = this.calculateExperienceScore(structuredJD, structuredResume);
        const projectsScore = this.calculateProjectsScore(structuredJD, structuredResume);
        const educationScore = this.calculateEducationScore(structuredJD, structuredResume);

        // Calculate weighted total
        const totalScore = Math.round(
            skillsScore * this.weights.skills +
            experienceScore * this.weights.experience +
            projectsScore * this.weights.projects +
            educationScore * this.weights.education
        );

        // Generate explanation using LLM
        const explanation = await this.generateExplanation(
            structuredJD,
            structuredResume,
            { skillsScore, experienceScore, projectsScore, educationScore, totalScore }
        );

        return {
            scores: {
                total: totalScore,
                skills: skillsScore,
                experience: experienceScore,
                projects: projectsScore,
                education: educationScore,
            },
            explanation,
            matchDetails: {
                skillsAnalysis: this.getSkillsAnalysis(structuredJD, structuredResume),
                experienceAnalysis: this.getExperienceAnalysis(structuredJD, structuredResume),
            },
        };
    }

    /**
     * Calculate skills match score (0-100)
     * 
     * Required skills are weighted 70%, preferred 30%
     * Individual skill importance affects weighting
     */
    calculateSkillsScore(jd, resume) {
        const candidateSkills = new Set([
            ...(resume._computed?.skill_set || []),
            ...(resume._computed?.technology_set || []),
        ]);

        // Calculate required skills match
        const requiredSkills = jd.required_skills || [];
        let requiredScore = 0;
        let requiredMaxScore = 0;

        for (const skill of requiredSkills) {
            const importance = skill.importance || 3;
            requiredMaxScore += importance;

            if (this.hasSkill(candidateSkills, skill.normalized || skill.name)) {
                requiredScore += importance;
            }
        }

        const requiredMatchRate = requiredMaxScore > 0
            ? (requiredScore / requiredMaxScore)
            : 1;

        // Calculate preferred skills match
        const preferredSkills = jd.preferred_skills || [];
        let preferredScore = 0;
        let preferredMaxScore = 0;

        for (const skill of preferredSkills) {
            const importance = skill.importance || 2;
            preferredMaxScore += importance;

            if (this.hasSkill(candidateSkills, skill.normalized || skill.name)) {
                preferredScore += importance;
            }
        }

        const preferredMatchRate = preferredMaxScore > 0
            ? (preferredScore / preferredMaxScore)
            : 1;

        // Weighted combination: 70% required, 30% preferred
        const combinedScore = (requiredMatchRate * 0.7 + preferredMatchRate * 0.3) * 100;

        return Math.round(combinedScore);
    }

    /**
     * Check if candidate has a skill (with fuzzy matching)
     */
    hasSkill(candidateSkills, skillName) {
        const normalized = this.normalizeSkillName(skillName);

        // Direct match
        if (candidateSkills.has(normalized)) {
            return true;
        }

        // Partial match (for compound skills)
        for (const candidateSkill of candidateSkills) {
            if (candidateSkill.includes(normalized) || normalized.includes(candidateSkill)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Normalize skill name for comparison
     */
    normalizeSkillName(skillName) {
        if (!skillName) return '';
        return skillName
            .toLowerCase()
            .replace(/[.\-_\s]/g, '')
            .replace(/js$/i, 'javascript')
            .replace(/reactjs/i, 'react')
            .replace(/nodejs/i, 'node');
    }

    /**
     * Calculate experience match score (0-100)
     * 
     * Considers: years, seniority, domain relevance
     */
    calculateExperienceScore(jd, resume) {
        const requiredYears = jd.experience?.min_years || 0;
        const maxYears = jd.experience?.max_years;
        const candidateYears = resume._computed?.total_experience_years || 0;

        let yearsScore = 0;

        // Years scoring logic
        if (candidateYears >= requiredYears) {
            yearsScore = 100;

            // Slight penalty for overqualification (if max specified)
            if (maxYears && candidateYears > maxYears + 3) {
                yearsScore -= Math.min(20, (candidateYears - maxYears - 3) * 5);
            }
        } else {
            // Partial credit for close matches
            const ratio = candidateYears / requiredYears;
            yearsScore = Math.round(ratio * 100);
        }

        // Domain match bonus
        const requiredDomains = jd.experience?.required_domains || [];
        const candidateDomains = resume._computed?.domains || [];
        let domainBonus = 0;

        if (requiredDomains.length > 0) {
            const matchedDomains = requiredDomains.filter(d =>
                candidateDomains.some(cd =>
                    cd.toLowerCase().includes(d.toLowerCase()) ||
                    d.toLowerCase().includes(cd.toLowerCase())
                )
            );
            domainBonus = (matchedDomains.length / requiredDomains.length) * 10;
        }

        return Math.min(100, Math.round(yearsScore + domainBonus));
    }

    /**
     * Calculate project relevance score (0-100)
     * 
     * Looks at technologies used and project descriptions
     */
    calculateProjectsScore(jd, resume) {
        const projects = resume.projects || [];

        if (projects.length === 0) {
            // No projects is not a disqualifier, just lower score
            return 50;
        }

        const requiredSkillsNormalized = (jd.required_skills || [])
            .map(s => this.normalizeSkillName(s.normalized || s.name));

        let relevantProjects = 0;
        let totalRelevance = 0;

        for (const project of projects) {
            const projectTechs = (project.technologies || [])
                .map(t => this.normalizeSkillName(t));

            const matchedTechs = projectTechs.filter(t =>
                requiredSkillsNormalized.some(rs =>
                    t.includes(rs) || rs.includes(t)
                )
            );

            if (matchedTechs.length > 0) {
                relevantProjects++;
                totalRelevance += matchedTechs.length / Math.max(projectTechs.length, 1);
            }
        }

        // Score based on having relevant projects
        const hasRelevantProjects = relevantProjects > 0;
        const projectScore = hasRelevantProjects
            ? 60 + Math.min(40, (totalRelevance / projects.length) * 100)
            : 40;

        return Math.round(projectScore);
    }

    /**
     * Calculate education match score (0-100)
     * 
     * Considers degree level and field of study
     */
    calculateEducationScore(jd, resume) {
        const degreeRanking = {
            'phd': 5,
            'master': 4,
            'bachelor': 3,
            'associate': 2,
            'certification': 1,
            'high_school': 0,
            'none': 0,
            'unknown': 1,
        };

        const requiredDegree = jd.education?.min_degree || 'none';
        const preferredDegree = jd.education?.preferred_degree || requiredDegree;
        const candidateDegree = resume._computed?.highest_degree || 'unknown';

        const requiredRank = degreeRanking[requiredDegree] || 0;
        const preferredRank = degreeRanking[preferredDegree] || requiredRank;
        const candidateRank = degreeRanking[candidateDegree] || 0;

        let degreeScore = 0;

        if (candidateRank >= preferredRank) {
            degreeScore = 100;
        } else if (candidateRank >= requiredRank) {
            degreeScore = 80;
        } else {
            degreeScore = Math.round((candidateRank / Math.max(requiredRank, 1)) * 70);
        }

        // Field match bonus
        const requiredFields = (jd.education?.required_fields || [])
            .map(f => f.toLowerCase());

        if (requiredFields.length > 0 && resume.education) {
            const candidateFields = resume.education
                .map(e => (e.field || '').toLowerCase());

            const hasFieldMatch = requiredFields.some(rf =>
                candidateFields.some(cf => cf.includes(rf) || rf.includes(cf))
            );

            if (hasFieldMatch) {
                degreeScore = Math.min(100, degreeScore + 10);
            }
        }

        return Math.round(degreeScore);
    }

    /**
     * Get detailed skills analysis for reporting
     */
    getSkillsAnalysis(jd, resume) {
        const candidateSkills = new Set([
            ...(resume._computed?.skill_set || []),
            ...(resume._computed?.technology_set || []),
        ]);

        const matchedRequired = [];
        const missingRequired = [];
        const matchedPreferred = [];
        const bonusSkills = [];

        for (const skill of (jd.required_skills || [])) {
            if (this.hasSkill(candidateSkills, skill.normalized || skill.name)) {
                matchedRequired.push(skill.name);
            } else {
                missingRequired.push(skill.name);
            }
        }

        for (const skill of (jd.preferred_skills || [])) {
            if (this.hasSkill(candidateSkills, skill.normalized || skill.name)) {
                matchedPreferred.push(skill.name);
            }
        }

        // Find bonus skills (candidate has but not in JD)
        const jdSkillsNormalized = new Set([
            ...(jd.required_skills || []).map(s => s.normalized),
            ...(jd.preferred_skills || []).map(s => s.normalized),
        ]);

        for (const skill of (resume.skills || [])) {
            if (!jdSkillsNormalized.has(skill.normalized)) {
                bonusSkills.push(skill.name);
            }
        }

        return {
            matchedRequired,
            missingRequired,
            matchedPreferred,
            bonusSkills: bonusSkills.slice(0, 10), // Limit to top 10
        };
    }

    /**
     * Get experience analysis summary
     */
    getExperienceAnalysis(jd, resume) {
        return {
            required: jd.experience?.min_years || 0,
            candidate: resume._computed?.total_experience_years || 0,
            meetsRequirement: (resume._computed?.total_experience_years || 0) >= (jd.experience?.min_years || 0),
            relevantDomains: resume._computed?.domains || [],
        };
    }

    /**
     * Generate human-readable explanation using LLM
     */
    async generateExplanation(jd, resume, scores) {
        try {
            const context = `
Job Requirements:
${JSON.stringify({
                title: jd.title,
                required_skills: (jd.required_skills || []).map(s => s.name),
                preferred_skills: (jd.preferred_skills || []).map(s => s.name),
                experience: jd.experience,
                education: jd.education,
            }, null, 2)}

Candidate Profile:
${JSON.stringify({
                name: resume.contact?.name,
                skills: (resume.skills || []).slice(0, 15).map(s => s.name),
                total_experience_years: resume._computed?.total_experience_years,
                positions: (resume.experience?.positions || []).slice(0, 3).map(p => ({
                    title: p.title,
                    company: p.company,
                    duration_months: p.duration_months,
                })),
                projects: (resume.projects || []).slice(0, 3).map(p => p.name),
                education: resume._computed?.highest_degree,
            }, null, 2)}

Scores:
- Overall: ${scores.totalScore}/100
- Skills: ${scores.skillsScore}/100
- Experience: ${scores.experienceScore}/100
- Projects: ${scores.projectsScore}/100
- Education: ${scores.educationScore}/100
`;

            const explanation = await perplexityClient.complete(
                MATCH_EXPLANATION_PROMPT,
                context
            );

            return explanation;
        } catch (error) {
            console.error('Failed to generate explanation:', error);
            // Return basic explanation if LLM fails
            return {
                summary: `Candidate scored ${scores.totalScore}/100 based on weighted evaluation of skills, experience, projects, and education.`,
                strengths: [],
                gaps: [],
                recommendation: scores.totalScore >= 70 ? 'hire' : 'maybe',
            };
        }
    }
}

// Export singleton instance
export const matchingService = new MatchingService();
export default matchingService;
