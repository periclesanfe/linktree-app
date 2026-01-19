const { S3Client } = require('@aws-sdk/client-s3');

/**
 * Cloudflare R2 Configuration
 * R2 is S3-compatible, so we use the AWS SDK
 */
const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const R2_CONFIG = {
    bucketName: process.env.R2_BUCKET_NAME || 'linktree-images',
    publicUrl: process.env.R2_PUBLIC_URL || 'https://cdn.meuhub.app.br',
    // Storage limit: 10GB in bytes
    maxStorageBytes: 10 * 1024 * 1024 * 1024, // 10GB
    // Individual file limits
    maxFileSizeMB: 20,
    // Image specifications
    imageSpecs: {
        avatar: {
            width: 400,
            height: 400,
            quality: 80,
            folder: 'avatars',
        },
        background: {
            width: 1280,
            height: 720,
            quality: 80,
            folder: 'backgrounds',
        },
        linkCover: {
            width: 400,
            height: 400,
            quality: 80,
            folder: 'covers',
        },
    },
};

module.exports = { r2Client, R2_CONFIG };
