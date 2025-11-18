-- db-init/seed-data.sql
-- Seed data for testing both dev and prod environments

-- Insert test users
INSERT INTO users (id, username, email, password_hash, display_name, bio, theme, accent_color)
VALUES
  (gen_random_uuid(), 'testuser1', 'test1@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456789ABCDEFGHIJKLMNOP', 'Test User 1', 'This is a test user for development', 'light', '#3b82f6'),
  (gen_random_uuid(), 'testuser2', 'test2@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456789ABCDEFGHIJKLMNOP', 'Test User 2', 'Another test user', 'dark', '#ef4444'),
  (gen_random_uuid(), 'demouser', 'demo@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456789ABCDEFGHIJKLMNOP', 'Demo User', 'Demo account for presentations', 'light', '#10b981')
ON CONFLICT (username) DO NOTHING;

-- Get user IDs for creating related data
DO $$
DECLARE
  user1_id UUID;
  user2_id UUID;
  demo_id UUID;
BEGIN
  SELECT id INTO user1_id FROM users WHERE username = 'testuser1';
  SELECT id INTO user2_id FROM users WHERE username = 'testuser2';
  SELECT id INTO demo_id FROM users WHERE username = 'demouser';

  -- Insert links for testuser1
  IF user1_id IS NOT NULL THEN
    INSERT INTO links (user_id, title, url, display_order, active)
    VALUES
      (user1_id, 'My Website', 'https://example.com', 1, true),
      (user1_id, 'My Blog', 'https://blog.example.com', 2, true),
      (user1_id, 'Portfolio', 'https://portfolio.example.com', 3, true),
      (user1_id, 'Contact Me', 'mailto:test1@example.com', 4, true)
    ON CONFLICT DO NOTHING;

    -- Insert social icons for testuser1
    INSERT INTO social_icons (user_id, platform, url)
    VALUES
      (user1_id, 'instagram', 'https://instagram.com/testuser1'),
      (user1_id, 'twitter', 'https://twitter.com/testuser1'),
      (user1_id, 'github', 'https://github.com/testuser1')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Insert links for testuser2
  IF user2_id IS NOT NULL THEN
    INSERT INTO links (user_id, title, url, display_order, active)
    VALUES
      (user2_id, 'YouTube Channel', 'https://youtube.com/channel/test', 1, true),
      (user2_id, 'Online Store', 'https://store.example.com', 2, true),
      (user2_id, 'Newsletter', 'https://newsletter.example.com', 3, false)
    ON CONFLICT DO NOTHING;

    -- Insert social icons for testuser2
    INSERT INTO social_icons (user_id, platform, url)
    VALUES
      (user2_id, 'youtube', 'https://youtube.com/@testuser2'),
      (user2_id, 'tiktok', 'https://tiktok.com/@testuser2'),
      (user2_id, 'linkedin', 'https://linkedin.com/in/testuser2')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Insert links for demouser
  IF demo_id IS NOT NULL THEN
    INSERT INTO links (user_id, title, url, display_order, active)
    VALUES
      (demo_id, 'Documentation', 'https://docs.example.com', 1, true),
      (demo_id, 'Support', 'https://support.example.com', 2, true),
      (demo_id, 'Demo Video', 'https://youtube.com/watch?v=demo', 3, true),
      (demo_id, 'Get Started', 'https://getstarted.example.com', 4, true),
      (demo_id, 'Pricing', 'https://pricing.example.com', 5, true)
    ON CONFLICT DO NOTHING;

    -- Insert social icons for demouser
    INSERT INTO social_icons (user_id, platform, url)
    VALUES
      (demo_id, 'instagram', 'https://instagram.com/demouser'),
      (demo_id, 'twitter', 'https://twitter.com/demouser'),
      (demo_id, 'facebook', 'https://facebook.com/demouser'),
      (demo_id, 'linkedin', 'https://linkedin.com/company/demo')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
