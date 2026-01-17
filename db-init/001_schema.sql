-- =====================================================
-- MeuHub Database Schema
-- Version: 1.0.0
-- Description: Complete database schema for MeuHub application
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    profile_image_url TEXT,
    background_image_url TEXT,
    theme VARCHAR(50) DEFAULT 'light',
    accent_color VARCHAR(50) DEFAULT '#E8A87C',
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for users updated_at
DROP TRIGGER IF EXISTS set_timestamp_users ON users;
CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Links table
CREATE TABLE IF NOT EXISTS links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    cover_image_url TEXT,
    color_hash VARCHAR(7),
    link_type VARCHAR(20) DEFAULT 'website',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for links updated_at
DROP TRIGGER IF EXISTS set_timestamp_links ON links;
CREATE TRIGGER set_timestamp_links
BEFORE UPDATE ON links
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Social icons table
CREATE TABLE IF NOT EXISTS social_icons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN (
        'instagram', 'twitter', 'facebook', 'tiktok', 
        'youtube', 'linkedin', 'github', 'whatsapp',
        'telegram', 'pinterest', 'twitch', 'discord',
        'spotify', 'snapchat', 'threads', 'email'
    )),
    url VARCHAR(2048) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for social_icons updated_at
DROP TRIGGER IF EXISTS set_timestamp_social_icons ON social_icons;
CREATE TRIGGER set_timestamp_social_icons
BEFORE UPDATE ON social_icons
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- =====================================================
-- INVITE CODES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS invite_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(14) UNIQUE NOT NULL, -- Format: XXXX-XXXX-XXXX
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    used_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ, -- NULL = never expires
    notes TEXT
);

-- =====================================================
-- ANALYTICS TABLES
-- =====================================================

-- Click analytics for links
CREATE TABLE IF NOT EXISTS analytics_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_hash VARCHAR(64),
    ip_address VARCHAR(45),
    country_code VARCHAR(2),
    country VARCHAR(2),
    city VARCHAR(100),
    user_agent TEXT,
    referrer TEXT,
    device_type VARCHAR(20),
    browser VARCHAR(50),
    os VARCHAR(50)
);

-- Profile views analytics
CREATE TABLE IF NOT EXISTS profile_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer TEXT,
    country VARCHAR(2),
    device_type VARCHAR(20),
    browser VARCHAR(50),
    os VARCHAR(50)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- Links indexes
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_display_order ON links(display_order);
CREATE INDEX IF NOT EXISTS idx_links_active ON links(active);
CREATE INDEX IF NOT EXISTS idx_links_type ON links(link_type);

-- Social icons indexes
CREATE INDEX IF NOT EXISTS idx_social_icons_user_id ON social_icons(user_id);

-- Invite codes indexes
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_is_used ON invite_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_invite_codes_created_by ON invite_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_invite_codes_expires_at ON invite_codes(expires_at);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_clicks_link_id ON analytics_clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_analytics_clicks_clicked_at ON analytics_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_profile_views_user_id ON profile_views(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to generate random invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS VARCHAR(14) AS $$
DECLARE
    chars VARCHAR := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Removed I, O, 0, 1 to avoid confusion
    part1 VARCHAR := '';
    part2 VARCHAR := '';
    part3 VARCHAR := '';
    i INTEGER;
BEGIN
    FOR i IN 1..4 LOOP
        part1 := part1 || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    FOR i IN 1..4 LOOP
        part2 := part2 || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    FOR i IN 1..4 LOOP
        part3 := part3 || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    RETURN part1 || '-' || part2 || '-' || part3;
END;
$$ LANGUAGE plpgsql;

-- Function to generate multiple invite codes at once
CREATE OR REPLACE FUNCTION generate_multiple_invite_codes(
    p_count INTEGER,
    p_created_by UUID,
    p_expires_at TIMESTAMPTZ DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS TABLE(code VARCHAR) AS $$
DECLARE
    new_code VARCHAR;
    codes_generated INTEGER := 0;
BEGIN
    WHILE codes_generated < p_count LOOP
        LOOP
            new_code := generate_invite_code();
            EXIT WHEN NOT EXISTS (SELECT 1 FROM invite_codes WHERE invite_codes.code = new_code);
        END LOOP;

        INSERT INTO invite_codes (code, created_by, expires_at, notes)
        VALUES (new_code, p_created_by, p_expires_at, p_notes);

        codes_generated := codes_generated + 1;
        code := new_code;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ANALYTICS VIEWS
-- =====================================================

-- User analytics summary view
CREATE OR REPLACE VIEW user_analytics_summary AS
SELECT
    u.id as user_id,
    u.username,
    COUNT(DISTINCT pv.id) as total_profile_views,
    COUNT(DISTINCT l.id) as total_links,
    COUNT(DISTINCT ac.id) as total_clicks,
    COALESCE(SUM(CASE WHEN pv.viewed_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END), 0) as views_last_7_days,
    COALESCE(SUM(CASE WHEN ac.clicked_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END), 0) as clicks_last_7_days
FROM users u
LEFT JOIN profile_views pv ON u.id = pv.user_id
LEFT JOIN links l ON u.id = l.user_id
LEFT JOIN analytics_clicks ac ON l.id = ac.link_id
GROUP BY u.id, u.username;

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
-- MeuHub database schema created successfully!
