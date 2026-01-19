const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { 
    PutObjectCommand, 
    DeleteObjectCommand, 
    ListObjectsV2Command,
    HeadBucketCommand 
} = require('@aws-sdk/client-s3');
const { r2Client, R2_CONFIG } = require('../config/r2');
const logger = require('../utils/logger');

/**
 * Image Service for Cloudflare R2
 * Handles image processing, upload, and storage management
 */

/**
 * Get total storage used in R2 bucket
 * @returns {Promise<number>} Total bytes used
 */
async function getStorageUsed() {
    let totalSize = 0;
    let continuationToken = undefined;

    try {
        do {
            const command = new ListObjectsV2Command({
                Bucket: R2_CONFIG.bucketName,
                ContinuationToken: continuationToken,
            });

            const response = await r2Client.send(command);
            
            if (response.Contents) {
                for (const obj of response.Contents) {
                    totalSize += obj.Size || 0;
                }
            }

            continuationToken = response.NextContinuationToken;
        } while (continuationToken);

        return totalSize;
    } catch (error) {
        logger.error('Error getting storage used:', error);
        throw error;
    }
}

/**
 * Check if adding a new file would exceed storage limit
 * @param {number} newFileSize - Size of new file in bytes
 * @returns {Promise<{allowed: boolean, currentUsage: number, limit: number, usagePercent: number}>}
 */
async function checkStorageLimit(newFileSize) {
    const currentUsage = await getStorageUsed();
    const projectedUsage = currentUsage + newFileSize;
    const allowed = projectedUsage <= R2_CONFIG.maxStorageBytes;
    
    return {
        allowed,
        currentUsage,
        limit: R2_CONFIG.maxStorageBytes,
        usagePercent: Math.round((currentUsage / R2_CONFIG.maxStorageBytes) * 100),
        projectedUsagePercent: Math.round((projectedUsage / R2_CONFIG.maxStorageBytes) * 100),
        remainingBytes: R2_CONFIG.maxStorageBytes - currentUsage,
    };
}

/**
 * Get storage statistics
 * @returns {Promise<object>} Storage stats
 */
async function getStorageStats() {
    const currentUsage = await getStorageUsed();
    const limitGB = R2_CONFIG.maxStorageBytes / (1024 * 1024 * 1024);
    const usedGB = currentUsage / (1024 * 1024 * 1024);
    
    return {
        usedBytes: currentUsage,
        usedGB: usedGB.toFixed(2),
        limitBytes: R2_CONFIG.maxStorageBytes,
        limitGB: limitGB.toFixed(2),
        usagePercent: Math.round((currentUsage / R2_CONFIG.maxStorageBytes) * 100),
        remainingBytes: R2_CONFIG.maxStorageBytes - currentUsage,
        remainingGB: (limitGB - usedGB).toFixed(2),
    };
}

/**
 * Process image: resize and convert to WebP
 * @param {Buffer} buffer - Image buffer
 * @param {string} type - Image type: 'avatar', 'background', 'linkCover'
 * @returns {Promise<Buffer>} Processed image buffer
 */
async function processImage(buffer, type) {
    const specs = R2_CONFIG.imageSpecs[type];
    
    if (!specs) {
        throw new Error(`Invalid image type: ${type}`);
    }

    try {
        const processedBuffer = await sharp(buffer)
            .resize(specs.width, specs.height, {
                fit: 'cover',
                position: 'center',
            })
            .webp({ quality: specs.quality })
            .toBuffer();

        return processedBuffer;
    } catch (error) {
        logger.error('Error processing image:', error);
        throw error;
    }
}

/**
 * Upload image to R2
 * @param {Buffer} buffer - Image buffer
 * @param {string} type - Image type: 'avatar', 'background', 'linkCover'
 * @param {string} userId - User ID for organizing files
 * @param {string|null} oldUrl - Old image URL to delete (optional)
 * @returns {Promise<{url: string, key: string}>} Upload result
 */
async function uploadToR2(buffer, type, userId, oldUrl = null) {
    const specs = R2_CONFIG.imageSpecs[type];
    
    if (!specs) {
        throw new Error(`Invalid image type: ${type}`);
    }

    // Check storage limit before uploading
    const storageCheck = await checkStorageLimit(buffer.length);
    if (!storageCheck.allowed) {
        const stats = await getStorageStats();
        throw new Error(
            `Storage limit exceeded. Used: ${stats.usedGB}GB / ${stats.limitGB}GB (${stats.usagePercent}%). ` +
            `Cannot upload file of ${(buffer.length / 1024 / 1024).toFixed(2)}MB.`
        );
    }

    // Generate unique filename
    const filename = `${uuidv4()}.webp`;
    const key = `${specs.folder}/${userId}/${filename}`;

    try {
        // Delete old image if exists
        if (oldUrl) {
            await deleteFromR2(oldUrl);
        }

        // Upload new image
        const command = new PutObjectCommand({
            Bucket: R2_CONFIG.bucketName,
            Key: key,
            Body: buffer,
            ContentType: 'image/webp',
            CacheControl: 'public, max-age=31536000', // 1 year cache
        });

        await r2Client.send(command);

        const publicUrl = `${R2_CONFIG.publicUrl}/${key}`;

        logger.info('Image uploaded to R2', {
            key,
            size: buffer.length,
            type,
            userId,
            url: publicUrl,
        });

        return { url: publicUrl, key };
    } catch (error) {
        logger.error('Error uploading to R2:', error);
        throw error;
    }
}

/**
 * Delete image from R2
 * @param {string} url - Image URL or key
 * @returns {Promise<boolean>} Success status
 */
async function deleteFromR2(url) {
    if (!url) return false;

    // Skip if it's a data URL (base64)
    if (url.startsWith('data:')) {
        return false;
    }

    try {
        // Extract key from URL
        let key = url;
        if (url.startsWith(R2_CONFIG.publicUrl)) {
            key = url.replace(`${R2_CONFIG.publicUrl}/`, '');
        }

        const command = new DeleteObjectCommand({
            Bucket: R2_CONFIG.bucketName,
            Key: key,
        });

        await r2Client.send(command);

        logger.info('Image deleted from R2', { key });
        return true;
    } catch (error) {
        logger.error('Error deleting from R2:', error);
        return false;
    }
}

/**
 * Get public URL for an image key
 * @param {string} key - Image key in R2
 * @returns {string} Public URL
 */
function getPublicUrl(key) {
    return `${R2_CONFIG.publicUrl}/${key}`;
}

/**
 * Validate and process uploaded image
 * @param {object} file - Multer file object
 * @param {string} type - Image type
 * @param {string} userId - User ID
 * @param {string|null} oldUrl - Old URL to replace
 * @returns {Promise<{url: string, key: string}>}
 */
async function handleImageUpload(file, type, userId, oldUrl = null) {
    if (!file || !file.buffer) {
        throw new Error('No file provided');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
        throw new Error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP');
    }

    // Check file size (max 20MB)
    const maxSize = R2_CONFIG.maxFileSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
        throw new Error(`File too large. Maximum size: ${R2_CONFIG.maxFileSizeMB}MB`);
    }

    // Process image (resize + convert to WebP)
    const processedBuffer = await processImage(file.buffer, type);

    // Upload to R2
    const result = await uploadToR2(processedBuffer, type, userId, oldUrl);

    return result;
}

module.exports = {
    processImage,
    uploadToR2,
    deleteFromR2,
    getPublicUrl,
    handleImageUpload,
    getStorageUsed,
    getStorageStats,
    checkStorageLimit,
};
