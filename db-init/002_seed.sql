-- =====================================================
-- MeuHub Initial Seed Data
-- Version: 1.0.0
-- Description: Initial data for MeuHub application
-- =====================================================

-- =====================================================
-- ADMIN ACCOUNT
-- =====================================================
-- Password: Admin@123 (hashed with bcrypt, cost 10)
-- IMPORTANT: Change this password immediately after first login!

INSERT INTO users (
    id,
    username,
    email,
    password_hash,
    display_name,
    bio,
    theme,
    accent_color,
    is_admin,
    is_active
) VALUES (
    gen_random_uuid(),
    'admin',
    'admin@meuhub.app.br',
    '$2b$10$/f00T9Xl8ETwarooxfeLj.f8cLyQ3ZNlqOjQRTmFySSx8XGqyDSI2',
    'Administrador',
    'Conta de administrador do MeuHub',
    'light',
    '#E8A87C',
    TRUE,
    TRUE
) ON CONFLICT (username) DO UPDATE SET
    is_admin = TRUE,
    updated_at = NOW();

-- =====================================================
-- INITIAL INVITE CODES
-- =====================================================
-- Generate 10 initial invite codes for the admin

DO $$
DECLARE
    admin_id UUID;
    i INTEGER;
    chars VARCHAR := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    new_code VARCHAR;
    part1 VARCHAR;
    part2 VARCHAR;
    part3 VARCHAR;
    j INTEGER;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_id FROM users WHERE username = 'admin';
    
    IF admin_id IS NOT NULL THEN
        -- Generate 10 invite codes
        FOR i IN 1..10 LOOP
            -- Generate code parts
            part1 := '';
            part2 := '';
            part3 := '';
            
            FOR j IN 1..4 LOOP
                part1 := part1 || substr(chars, floor(random() * length(chars) + 1)::int, 1);
            END LOOP;
            
            FOR j IN 1..4 LOOP
                part2 := part2 || substr(chars, floor(random() * length(chars) + 1)::int, 1);
            END LOOP;
            
            FOR j IN 1..4 LOOP
                part3 := part3 || substr(chars, floor(random() * length(chars) + 1)::int, 1);
            END LOOP;
            
            new_code := part1 || '-' || part2 || '-' || part3;
            
            -- Insert if doesn't exist
            INSERT INTO invite_codes (code, created_by, notes)
            VALUES (new_code, admin_id, 'Initial invite code')
            ON CONFLICT (code) DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'Created 10 initial invite codes for admin';
    ELSE
        RAISE NOTICE 'Admin user not found, skipping invite code generation';
    END IF;
END $$;

-- =====================================================
-- DEMO USER (Optional - for testing)
-- =====================================================
-- Password: Demo@123

DO $$
DECLARE
    demo_id UUID;
BEGIN
    -- Only create demo user if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'demo') THEN
        INSERT INTO users (
            id,
            username,
            email,
            password_hash,
            display_name,
            bio,
            theme,
            accent_color,
            is_admin,
            is_active
        ) VALUES (
            gen_random_uuid(),
            'demo',
            'demo@meuhub.app.br',
            '$2b$10$p.yBuGCxYhmF5OOzUoBPaOHvG5Bp0RW5e0oRQ.WbK8pcgjDq714k6',
            'Usuario Demo',
            'Conta demonstrativa do MeuHub. Explore as funcionalidades!',
            'light',
            '#E27D60',
            FALSE,
            TRUE
        )
        RETURNING id INTO demo_id;
        
        -- Add demo links
        IF demo_id IS NOT NULL THEN
            INSERT INTO links (user_id, title, url, display_order, active, cover_image_url)
            VALUES
                (demo_id, 'Meu Site', 'https://meuhub.app.br', 1, TRUE, NULL),
                (demo_id, 'Instagram', 'https://instagram.com/meuhub', 2, TRUE, NULL),
                (demo_id, 'YouTube', 'https://youtube.com/@meuhub', 3, TRUE, NULL),
                (demo_id, 'Contato', 'mailto:contato@meuhub.app.br', 4, TRUE, NULL);
            
            -- Add demo social icons
            INSERT INTO social_icons (user_id, platform, url, display_order)
            VALUES
                (demo_id, 'instagram', 'https://instagram.com/meuhub', 1),
                (demo_id, 'youtube', 'https://youtube.com/@meuhub', 2),
                (demo_id, 'twitter', 'https://twitter.com/meuhub', 3);
            
            RAISE NOTICE 'Demo user created with sample links';
        END IF;
    ELSE
        RAISE NOTICE 'Demo user already exists, skipping creation';
    END IF;
END $$;

-- =====================================================
-- SEED DATA COMPLETE
-- =====================================================
-- MeuHub seed data inserted successfully!
-- ============================================
-- ADMIN ACCOUNT CREATED:
--   Username: admin
--   Email: admin@meuhub.app.br
--   Password: Admin@123
--
-- IMPORTANT: Change the admin password immediately!
-- ============================================
