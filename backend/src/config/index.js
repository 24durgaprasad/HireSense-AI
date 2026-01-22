import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Application Configuration
 * Centralized configuration management with sensible defaults
 */
const config = {
  // Server
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  // Perplexity API
  perplexity: {
    apiKey: process.env.PERPLEXITY_API_KEY,
    baseUrl: 'https://api.perplexity.ai',
    model: 'sonar', // Using sonar for structured output
    maxTokens: 4096,
    temperature: 0.1, // Low temperature for consistent structured output
  },

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ats',
  },

  // File Upload
  upload: {
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10,
    maxFileSizeBytes: (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10) * 1024 * 1024,
    dir: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    ],
  },

  // Scoring Weights (must sum to 1.0)
  scoring: {
    weights: {
      skills: 0.50,       // 50%
      experience: 0.25,   // 25%
      projects: 0.15,     // 15%
      education: 0.10,    // 10%
    },
    // Threshold defaults
    defaultThreshold: 70,
    borderlineRange: 10, // Scores within 10 points below threshold are "borderline"
  },
};

// Validate critical configuration
if (!config.perplexity.apiKey) {
  console.warn('⚠️  Warning: PERPLEXITY_API_KEY is not set. AI features will not work.');
}

// Validate weights sum to 1
const weightSum = Object.values(config.scoring.weights).reduce((a, b) => a + b, 0);
if (Math.abs(weightSum - 1.0) > 0.001) {
  throw new Error(`Scoring weights must sum to 1.0, got ${weightSum}`);
}

export default config;
