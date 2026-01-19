-- Migration: Add Link Trackers support

-- 1. Create table for link trackers
CREATE TABLE IF NOT EXISTS link_trackers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_timestamp_link_trackers ON link_trackers;
CREATE TRIGGER set_timestamp_link_trackers
BEFORE UPDATE ON link_trackers
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- 2. Add tracker_id to analytics_clicks
ALTER TABLE analytics_clicks 
ADD COLUMN IF NOT EXISTS tracker_id UUID REFERENCES link_trackers(id) ON DELETE SET NULL;

-- 3. Index for performance
CREATE INDEX IF NOT EXISTS idx_link_trackers_link_id ON link_trackers(link_id);
CREATE INDEX IF NOT EXISTS idx_analytics_clicks_tracker_id ON analytics_clicks(tracker_id);
