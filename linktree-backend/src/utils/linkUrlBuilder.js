/**
 * Utility functions for building redirect URLs based on link types
 */

/**
 * Validates and formats a phone number (digits only, 10-15 characters)
 * @param {string} phone - The phone number to format
 * @returns {string|null} - Formatted phone number or null if invalid
 */
function formatPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');

  // Validate length (10-15 digits)
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return null;
  }

  return digitsOnly;
}

/**
 * Extracts video_id or channel_id from YouTube URLs
 * Supports: youtube.com/watch?v=, youtu.be/, youtube.com/channel/, youtube.com/@
 * @param {string} url - The YouTube URL
 * @returns {object|null} - { type: 'video'|'channel', id: string } or null if invalid
 */
function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    // Handle youtu.be short URLs
    const shortUrlMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortUrlMatch) {
      return { type: 'video', id: shortUrlMatch[1] };
    }

    // Handle youtube.com/watch?v= URLs
    const watchMatch = url.match(/youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) {
      return { type: 'video', id: watchMatch[1] };
    }

    // Handle youtube.com/channel/ URLs
    const channelMatch = url.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
    if (channelMatch) {
      return { type: 'channel', id: channelMatch[1] };
    }

    // Handle youtube.com/@ URLs (handle/username)
    const handleMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/);
    if (handleMatch) {
      return { type: 'channel', id: `@${handleMatch[1]}` };
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Builds redirect URL based on link type
 * @param {object} link - The link object { link_type, url, metadata }
 * @returns {string|null} - The redirect URL or null if invalid
 */
function buildRedirectUrl(link) {
  if (!link || !link.link_type) {
    return null;
  }

  const { link_type, url, metadata = {} } = link;

  switch (link_type) {
    case 'website':
      return url || null;

    case 'whatsapp': {
      const phone = formatPhone(metadata.phone);
      if (!phone) {
        return null;
      }
      let whatsappUrl = `https://wa.me/${phone}`;
      if (metadata.message) {
        whatsappUrl += `?text=${encodeURIComponent(metadata.message)}`;
      }
      return whatsappUrl;
    }

    case 'instagram': {
      const username = metadata.username;
      if (!username) {
        return null;
      }
      // Remove @ if present
      const cleanUsername = username.replace(/^@/, '');
      return `https://instagram.com/${cleanUsername}`;
    }

    case 'email': {
      const email = metadata.email;
      if (!email) {
        return null;
      }
      let mailtoUrl = `mailto:${email}`;
      const params = [];
      if (metadata.subject) {
        params.push(`subject=${encodeURIComponent(metadata.subject)}`);
      }
      if (metadata.body) {
        params.push(`body=${encodeURIComponent(metadata.body)}`);
      }
      if (params.length > 0) {
        mailtoUrl += `?${params.join('&')}`;
      }
      return mailtoUrl;
    }

    case 'phone': {
      const phone = formatPhone(metadata.phone);
      if (!phone) {
        return null;
      }
      return `tel:${phone}`;
    }

    case 'youtube': {
      // Try to extract from URL first
      if (url) {
        const extracted = extractYouTubeId(url);
        if (extracted) {
          if (extracted.type === 'video') {
            return `https://youtube.com/watch?v=${extracted.id}`;
          } else if (extracted.type === 'channel') {
            // Handle @ prefix for handles
            if (extracted.id.startsWith('@')) {
              return `https://youtube.com/${extracted.id}`;
            }
            return `https://youtube.com/channel/${extracted.id}`;
          }
        }
      }
      // Fall back to metadata
      if (metadata.video_id) {
        return `https://youtube.com/watch?v=${metadata.video_id}`;
      }
      if (metadata.channel_id) {
        return `https://youtube.com/channel/${metadata.channel_id}`;
      }
      return null;
    }

    case 'tiktok': {
      const username = metadata.username;
      if (!username) {
        return null;
      }
      // Remove @ if present
      const cleanUsername = username.replace(/^@/, '');
      return `https://tiktok.com/@${cleanUsername}`;
    }

    default:
      // For unknown types, try to return the URL directly
      return url || null;
  }
}

module.exports = {
  formatPhone,
  extractYouTubeId,
  buildRedirectUrl
};
