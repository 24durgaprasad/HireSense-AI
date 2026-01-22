import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/index.js';

// Ensure upload directory exists
if (!fs.existsSync(config.upload.dir)) {
    fs.mkdirSync(config.upload.dir, { recursive: true });
}

/**
 * Multer Storage Configuration
 * Files are temporarily stored with unique names
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.upload.dir);
    },
    filename: (req, file, cb) => {
        const uniqueId = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueId}${ext}`);
    },
});

/**
 * File Filter - Only allow PDF and DOCX
 */
const fileFilter = (req, file, cb) => {
    const allowedMimes = config.upload.allowedMimeTypes;

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Only PDF and DOCX files are allowed. Got: ${file.mimetype}`), false);
    }
};

/**
 * Multer Upload Middleware
 */
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: config.upload.maxFileSizeBytes,
    },
});

/**
 * Single file upload middleware (for JD)
 */
export const uploadSingle = upload.single('file');

/**
 * Multiple file upload middleware (for resumes, max 50)
 */
export const uploadMultiple = upload.array('files', 50);

/**
 * Error handling middleware for multer errors
 */
export const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: `File too large. Maximum size is ${config.upload.maxFileSizeMB}MB`,
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Too many files. Maximum is 50 files per upload.',
            });
        }
        return res.status(400).json({
            success: false,
            error: err.message,
        });
    }

    if (err) {
        return res.status(400).json({
            success: false,
            error: err.message,
        });
    }

    next();
};

export default { uploadSingle, uploadMultiple, handleUploadError };
