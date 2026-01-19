/**
 * Migration Script: Move base64 images from PostgreSQL to Cloudflare R2
 * 
 * Run this script once after deploying the R2 integration:
 * node scripts/migrate-images-to-r2.js
 */

require('dotenv').config();
const pool = require('../src/db/pool');
const { r2Client, R2_CONFIG } = require('../src/config/r2');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

const stats = {
    usersProcessed: 0,
    linksProcessed: 0,
    profileImages: { success: 0, failed: 0, skipped: 0 },
    backgroundImages: { success: 0, failed: 0, skipped: 0 },
    coverImages: { success: 0, failed: 0, skipped: 0 },
};

function log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
        info: '[INFO]',
        success: '[OK]',
        error: '[ERROR]',
        warn: '[WARN]',
        debug: '[DEBUG]',
    };
    if (level === 'debug' && !VERBOSE) return;
    console.log(`${timestamp} ${prefix[level] || '[LOG]'} ${message}`);
}

/**
 * Check if a URL is a base64 data URL
 */
function isBase64(url) {
    return url && url.startsWith('data:');
}

/**
 * Extract image buffer from base64 data URL
 */
function base64ToBuffer(dataUrl) {
    const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
        throw new Error('Invalid base64 data URL');
    }
    return Buffer.from(matches[2], 'base64');
}

/**
 * Process and upload image to R2
 */
async function uploadImageToR2(buffer, type, userId) {
    const specs = R2_CONFIG.imageSpecs[type];
    
    // Process with Sharp
    const processedBuffer = await sharp(buffer)
        .resize(specs.width, specs.height, {
            fit: 'cover',
            position: 'center',
        })
        .webp({ quality: specs.quality })
        .toBuffer();

    // Generate unique filename
    const filename = `${uuidv4()}.webp`;
    const key = `${specs.folder}/${userId}/${filename}`;

    if (DRY_RUN) {
        log(`[DRY-RUN] Would upload: ${key} (${processedBuffer.length} bytes)`, 'debug');
        return `${R2_CONFIG.publicUrl}/${key}`;
    }

    // Upload to R2
    const command = new PutObjectCommand({
        Bucket: R2_CONFIG.bucketName,
        Key: key,
        Body: processedBuffer,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000',
    });

    await r2Client.send(command);

    return `${R2_CONFIG.publicUrl}/${key}`;
}

/**
 * Migrate user images (profile and background)
 */
async function migrateUserImages() {
    log('Starting user images migration...', 'info');

    const result = await pool.query(`
        SELECT id, username, profile_image_url, background_image_url 
        FROM users 
        WHERE profile_image_url IS NOT NULL 
           OR background_image_url IS NOT NULL
    `);

    log(`Found ${result.rows.length} users with images`, 'info');

    for (const user of result.rows) {
        stats.usersProcessed++;
        log(`Processing user: ${user.username} (ID: ${user.id})`, 'debug');

        // Migrate profile image
        if (isBase64(user.profile_image_url)) {
            try {
                const buffer = base64ToBuffer(user.profile_image_url);
                const newUrl = await uploadImageToR2(buffer, 'avatar', user.id.toString());

                if (!DRY_RUN) {
                    await pool.query(
                        'UPDATE users SET profile_image_url = $1 WHERE id = $2',
                        [newUrl, user.id]
                    );
                }

                stats.profileImages.success++;
                log(`Migrated profile image for ${user.username}: ${newUrl}`, 'success');
            } catch (error) {
                stats.profileImages.failed++;
                log(`Failed to migrate profile image for ${user.username}: ${error.message}`, 'error');
            }
        } else if (user.profile_image_url) {
            stats.profileImages.skipped++;
            log(`Skipped profile image for ${user.username} (already URL or null)`, 'debug');
        }

        // Migrate background image
        if (isBase64(user.background_image_url)) {
            try {
                const buffer = base64ToBuffer(user.background_image_url);
                const newUrl = await uploadImageToR2(buffer, 'background', user.id.toString());

                if (!DRY_RUN) {
                    await pool.query(
                        'UPDATE users SET background_image_url = $1 WHERE id = $2',
                        [newUrl, user.id]
                    );
                }

                stats.backgroundImages.success++;
                log(`Migrated background image for ${user.username}: ${newUrl}`, 'success');
            } catch (error) {
                stats.backgroundImages.failed++;
                log(`Failed to migrate background image for ${user.username}: ${error.message}`, 'error');
            }
        } else if (user.background_image_url) {
            stats.backgroundImages.skipped++;
            log(`Skipped background image for ${user.username} (already URL or null)`, 'debug');
        }
    }
}

/**
 * Migrate link cover images
 */
async function migrateLinkImages() {
    log('Starting link cover images migration...', 'info');

    const result = await pool.query(`
        SELECT l.id, l.title, l.cover_image_url, l.user_id, u.username
        FROM links l
        JOIN users u ON l.user_id = u.id
        WHERE l.cover_image_url IS NOT NULL
    `);

    log(`Found ${result.rows.length} links with cover images`, 'info');

    for (const link of result.rows) {
        stats.linksProcessed++;

        if (isBase64(link.cover_image_url)) {
            try {
                const buffer = base64ToBuffer(link.cover_image_url);
                const newUrl = await uploadImageToR2(buffer, 'linkCover', link.user_id.toString());

                if (!DRY_RUN) {
                    await pool.query(
                        'UPDATE links SET cover_image_url = $1 WHERE id = $2',
                        [newUrl, link.id]
                    );
                }

                stats.coverImages.success++;
                log(`Migrated cover for "${link.title}" (${link.username}): ${newUrl}`, 'success');
            } catch (error) {
                stats.coverImages.failed++;
                log(`Failed to migrate cover for "${link.title}": ${error.message}`, 'error');
            }
        } else {
            stats.coverImages.skipped++;
            log(`Skipped cover for "${link.title}" (already URL or null)`, 'debug');
        }
    }
}

/**
 * Print final statistics
 */
function printStats() {
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION COMPLETE' + (DRY_RUN ? ' (DRY RUN)' : ''));
    console.log('='.repeat(60));
    console.log(`Users processed:      ${stats.usersProcessed}`);
    console.log(`Links processed:      ${stats.linksProcessed}`);
    console.log('');
    console.log('Profile Images:');
    console.log(`  - Migrated:         ${stats.profileImages.success}`);
    console.log(`  - Failed:           ${stats.profileImages.failed}`);
    console.log(`  - Skipped:          ${stats.profileImages.skipped}`);
    console.log('');
    console.log('Background Images:');
    console.log(`  - Migrated:         ${stats.backgroundImages.success}`);
    console.log(`  - Failed:           ${stats.backgroundImages.failed}`);
    console.log(`  - Skipped:          ${stats.backgroundImages.skipped}`);
    console.log('');
    console.log('Link Cover Images:');
    console.log(`  - Migrated:         ${stats.coverImages.success}`);
    console.log(`  - Failed:           ${stats.coverImages.failed}`);
    console.log(`  - Skipped:          ${stats.coverImages.skipped}`);
    console.log('='.repeat(60));

    const totalMigrated = stats.profileImages.success + stats.backgroundImages.success + stats.coverImages.success;
    const totalFailed = stats.profileImages.failed + stats.backgroundImages.failed + stats.coverImages.failed;

    if (totalFailed > 0) {
        console.log(`\n⚠️  ${totalFailed} images failed to migrate. Check logs above.`);
    }

    if (DRY_RUN) {
        console.log('\n📋 This was a DRY RUN. No changes were made.');
        console.log('   Run without --dry-run to perform actual migration.');
    } else {
        console.log(`\n✅ Successfully migrated ${totalMigrated} images to R2.`);
    }
}

/**
 * Main function
 */
async function main() {
    console.log('');
    console.log('='.repeat(60));
    console.log('IMAGE MIGRATION: PostgreSQL Base64 -> Cloudflare R2');
    console.log('='.repeat(60));
    console.log(`Mode:     ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE'}`);
    console.log(`Verbose:  ${VERBOSE ? 'Yes' : 'No'}`);
    console.log(`Bucket:   ${R2_CONFIG.bucketName}`);
    console.log(`CDN URL:  ${R2_CONFIG.publicUrl}`);
    console.log('='.repeat(60));
    console.log('');

    try {
        await migrateUserImages();
        console.log('');
        await migrateLinkImages();
        printStats();
    } catch (error) {
        log(`Migration failed: ${error.message}`, 'error');
        console.error(error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run migration
main();
