import config from '../config/index.js';

/**
 * Perplexity API Client
 * 
 * Handles all LLM interactions with proper error handling and response parsing.
 * Uses Perplexity's sonar model for structured JSON output.
 */
class PerplexityClient {
    constructor() {
        this.baseUrl = config.perplexity.baseUrl;
        this.apiKey = config.perplexity.apiKey;
        this.model = config.perplexity.model;
        this.maxTokens = config.perplexity.maxTokens;
        this.temperature = config.perplexity.temperature;
    }

    /**
     * Validate API key is configured
     */
    validateConfig() {
        if (!this.apiKey) {
            throw new Error('Perplexity API key is not configured. Set PERPLEXITY_API_KEY in .env');
        }
    }

    /**
     * Send a completion request to Perplexity
     * 
     * @param {string} systemPrompt - The system/instruction prompt
     * @param {string} userContent - The user content to process
     * @returns {Promise<object>} - Parsed JSON response
     */
    async complete(systemPrompt, userContent) {
        this.validateConfig();

        const requestBody = {
            model: this.model,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: userContent,
                },
            ],
            max_tokens: this.maxTokens,
            temperature: this.temperature,
        };

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Perplexity API error (${response.status}): ${errorData}`);
            }

            const data = await response.json();

            if (!data.choices || data.choices.length === 0) {
                throw new Error('No response from Perplexity API');
            }

            const content = data.choices[0].message.content;

            // Parse JSON from response, handling potential markdown code blocks
            return this.parseJsonResponse(content);
        } catch (error) {
            console.error('Perplexity API call failed:', error);
            throw error;
        }
    }

    /**
     * Parse JSON from LLM response, handling various formats
     * 
     * @param {string} content - Raw LLM response
     * @returns {object} - Parsed JSON object
     */
    parseJsonResponse(content) {
        let jsonString = content.trim();

        // Remove markdown code blocks if present
        if (jsonString.startsWith('```json')) {
            jsonString = jsonString.slice(7);
        } else if (jsonString.startsWith('```')) {
            jsonString = jsonString.slice(3);
        }

        if (jsonString.endsWith('```')) {
            jsonString = jsonString.slice(0, -3);
        }

        jsonString = jsonString.trim();

        try {
            return JSON.parse(jsonString);
        } catch (parseError) {
            console.error('Failed to parse JSON response:', jsonString);
            throw new Error(`Failed to parse LLM response as JSON: ${parseError.message}`);
        }
    }
}

// Export singleton instance
export const perplexityClient = new PerplexityClient();
export default perplexityClient;
