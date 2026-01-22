import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import database from './models/database.js';
import routes from './routes/index.js';

/**
 * ATS Backend Server
 * 
 * Main entry point for the AI-powered Applicant Tracking System.
 */
const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development only)
if (config.isDev) {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
        next();
    });
}

// API Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'AI-Powered ATS API',
        version: '1.0.0',
        description: 'Applicant Tracking System with semantic matching',
        database: 'MongoDB',
        endpoints: {
            health: 'GET /api/health',
            jobs: {
                create: 'POST /api/jobs (multipart/form-data)',
                list: 'GET /api/jobs',
                get: 'GET /api/jobs/:id',
                updateThreshold: 'PUT /api/jobs/:id/threshold',
                delete: 'DELETE /api/jobs/:id',
            },
            candidates: {
                upload: 'POST /api/jobs/:jobId/candidates (multipart/form-data)',
                list: 'GET /api/jobs/:jobId/candidates',
                get: 'GET /api/jobs/:jobId/candidates/:candidateId',
                compare: 'POST /api/jobs/:jobId/candidates/compare',
                delete: 'DELETE /api/jobs/:jobId/candidates/:candidateId',
            },
        },
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path,
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: config.isDev ? err.message : 'Internal server error',
    });
});

/**
 * Start the server
 */
async function start() {
    try {
        // Connect to MongoDB
        console.log('🔄 Connecting to MongoDB...');
        await database.connect();

        // Start server
        app.listen(config.port, () => {
            console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 AI-Powered ATS Backend                               ║
║                                                            ║
║   Server running at: http://localhost:${config.port}               ║
║   Environment: ${config.nodeEnv.padEnd(41)}║
║   Database: MongoDB                                        ║
║                                                            ║
║   API Endpoints:                                           ║
║   • POST /api/jobs              - Upload JD                ║
║   • POST /api/jobs/:id/candidates - Upload Resumes         ║
║   • GET  /api/jobs/:id/candidates - Get Results            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);

            if (!config.perplexity.apiKey) {
                console.warn('⚠️  Warning: PERPLEXITY_API_KEY not set. AI features disabled.');
            }
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    await database.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down...');
    await database.disconnect();
    process.exit(0);
});

// Start the application
start();

export default app;
