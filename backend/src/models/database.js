import mongoose from 'mongoose';
import config from '../config/index.js';

/**
 * MongoDB Connection Manager
 * Handles database connection lifecycle
 */
class Database {
    constructor() {
        this.isConnected = false;
    }

    /**
     * Connect to MongoDB
     */
    async connect() {
        if (this.isConnected) {
            console.log('Already connected to MongoDB');
            return;
        }

        try {
            await mongoose.connect(config.mongodb.uri, {
                // Mongoose 8+ uses these defaults, but being explicit
                autoIndex: true,
            });

            this.isConnected = true;
            console.log('✅ Connected to MongoDB');

            // Connection event handlers
            mongoose.connection.on('error', (err) => {
                console.error('MongoDB connection error:', err);
            });

            mongoose.connection.on('disconnected', () => {
                console.log('MongoDB disconnected');
                this.isConnected = false;
            });

        } catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            throw error;
        }
    }

    /**
     * Disconnect from MongoDB
     */
    async disconnect() {
        if (!this.isConnected) return;

        try {
            await mongoose.disconnect();
            this.isConnected = false;
            console.log('Disconnected from MongoDB');
        } catch (error) {
            console.error('Error disconnecting from MongoDB:', error);
            throw error;
        }
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            readyState: mongoose.connection.readyState,
            // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
        };
    }
}

// Export singleton instance
const database = new Database();
export default database;
