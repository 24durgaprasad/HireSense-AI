import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * File Processing Service
 * 
 * Converts PDF and DOCX files to clean, normalized plain text.
 * This is the first step in the document analysis pipeline.
 */
class FileProcessingService {
    /**
     * Process a file and extract text content
     * 
     * @param {string} filePath - Path to the file
     * @returns {Promise<string>} - Extracted and normalized text
     */
    async extractText(filePath) {
        const extension = path.extname(filePath).toLowerCase();

        let rawText;
        switch (extension) {
            case '.pdf':
                rawText = await this.extractFromPdf(filePath);
                break;
            case '.docx':
                rawText = await this.extractFromDocx(filePath);
                break;
            default:
                throw new Error(`Unsupported file format: ${extension}. Only .pdf and .docx are supported.`);
        }

        return this.normalizeText(rawText);
    }

    /**
     * Extract text from PDF file
     * 
     * @param {string} filePath - Path to PDF file
     * @returns {Promise<string>} - Raw extracted text
     */
    async extractFromPdf(filePath) {
        try {
            const buffer = await fs.readFile(filePath);
            const data = await pdfParse(buffer);
            return data.text;
        } catch (error) {
            console.error(`PDF extraction failed for ${filePath}:`, error);
            throw new Error(`Failed to extract text from PDF: ${error.message}`);
        }
    }

    /**
     * Extract text from DOCX file
     * 
     * @param {string} filePath - Path to DOCX file
     * @returns {Promise<string>} - Raw extracted text
     */
    async extractFromDocx(filePath) {
        try {
            const buffer = await fs.readFile(filePath);
            const result = await mammoth.extractRawText({ buffer });

            if (result.messages && result.messages.length > 0) {
                console.warn('DOCX extraction warnings:', result.messages);
            }

            return result.value;
        } catch (error) {
            console.error(`DOCX extraction failed for ${filePath}:`, error);
            throw new Error(`Failed to extract text from DOCX: ${error.message}`);
        }
    }

    /**
     * Normalize extracted text for consistent processing
     * 
     * - Remove excessive whitespace
     * - Normalize line breaks
     * - Remove special characters that might confuse the LLM
     * - Preserve important structure (bullet points, sections)
     * 
     * @param {string} text - Raw extracted text
     * @returns {string} - Normalized text
     */
    normalizeText(text) {
        if (!text) return '';

        return text
            // Normalize line endings
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')

            // Replace multiple spaces with single space
            .replace(/[ \t]+/g, ' ')

            // Replace multiple newlines with double newline (preserve paragraphs)
            .replace(/\n{3,}/g, '\n\n')

            // Remove leading/trailing whitespace from each line
            .split('\n')
            .map(line => line.trim())
            .join('\n')

            // Remove common PDF artifacts
            .replace(/\f/g, '\n') // Form feed
            .replace(/\x00/g, '') // Null characters

            // Normalize bullet points
            .replace(/[•◦▪▸►]/g, '•')

            // Remove very long sequences of the same character (common in PDFs)
            .replace(/(.)\1{10,}/g, '$1$1$1')

            // Final trim
            .trim();
    }

    /**
     * Delete a file (used for cleanup after processing)
     * 
     * @param {string} filePath - Path to file to delete
     */
    async deleteFile(filePath) {
        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.warn(`Failed to delete file ${filePath}:`, error.message);
        }
    }

    /**
     * Validate file before processing
     * 
     * @param {string} filePath - Path to file
     * @param {number} maxSizeBytes - Maximum allowed file size
     * @returns {Promise<boolean>} - True if valid
     */
    async validateFile(filePath, maxSizeBytes) {
        try {
            const stats = await fs.stat(filePath);

            if (stats.size === 0) {
                throw new Error('File is empty');
            }

            if (stats.size > maxSizeBytes) {
                throw new Error(`File size (${(stats.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed (${maxSizeBytes / 1024 / 1024}MB)`);
            }

            const extension = path.extname(filePath).toLowerCase();
            if (!['.pdf', '.docx'].includes(extension)) {
                throw new Error(`Unsupported file format: ${extension}`);
            }

            return true;
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error('File not found');
            }
            throw error;
        }
    }
}

// Export singleton instance
export const fileProcessingService = new FileProcessingService();
export default fileProcessingService;
