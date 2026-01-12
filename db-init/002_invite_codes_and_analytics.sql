-- =====================================================
-- TABELA DE CÓDIGOS DE CONVITE
-- =====================================================

CREATE TABLE IF NOT EXISTS invite_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(14) UNIQUE NOT NULL, -- XXXX-XXXX-XXXX
    created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    used_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    expires_at TIMESTAMP, -- NULL = nunca expira
    notes TEXT -- Notas do admin sobre o código
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_is_used ON invite_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_invite_codes_created_by ON invite_codes(created_by);

-- =====================================================
-- ANALYTICS AVANÇADAS
-- =====================================================

-- Tabela para rastrear visualizações de perfil
CREATE TABLE IF NOT EXISTS profile_views (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45), -- IPv4 ou IPv6
    user_agent TEXT,
    referrer TEXT,
    country VARCHAR(2), -- Código ISO do país (ex: BR, US)
    device_type VARCHAR(20), -- mobile, desktop, tablet
    browser VARCHAR(50),
    os VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_profile_views_user_id ON profile_views(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at);

-- Modificar tabela analytics_clicks para adicionar mais dados
-- Nota: Como a tabela já existe, vamos adicionar colunas se não existirem
DO $$
BEGIN
    -- Adicionar coluna ip_address se não existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='analytics_clicks' AND column_name='ip_address') THEN
        ALTER TABLE analytics_clicks ADD COLUMN ip_address VARCHAR(45);
    END IF;

    -- Adicionar coluna user_agent se não existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='analytics_clicks' AND column_name='user_agent') THEN
        ALTER TABLE analytics_clicks ADD COLUMN user_agent TEXT;
    END IF;

    -- Adicionar coluna referrer se não existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='analytics_clicks' AND column_name='referrer') THEN
        ALTER TABLE analytics_clicks ADD COLUMN referrer TEXT;
    END IF;

    -- Adicionar coluna country se não existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='analytics_clicks' AND column_name='country') THEN
        ALTER TABLE analytics_clicks ADD COLUMN country VARCHAR(2);
    END IF;

    -- Adicionar coluna device_type se não existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='analytics_clicks' AND column_name='device_type') THEN
        ALTER TABLE analytics_clicks ADD COLUMN device_type VARCHAR(20);
    END IF;

    -- Adicionar coluna browser se não existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='analytics_clicks' AND column_name='browser') THEN
        ALTER TABLE analytics_clicks ADD COLUMN browser VARCHAR(50);
    END IF;

    -- Adicionar coluna os se não existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='analytics_clicks' AND column_name='os') THEN
        ALTER TABLE analytics_clicks ADD COLUMN os VARCHAR(50);
    END IF;
END $$;

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para gerar código de convite aleatório
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS VARCHAR(14) AS $$
DECLARE
    chars VARCHAR := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Remove I, O, 0, 1 para evitar confusão
    part1 VARCHAR := '';
    part2 VARCHAR := '';
    part3 VARCHAR := '';
    i INTEGER;
BEGIN
    -- Gerar primeira parte (4 caracteres)
    FOR i IN 1..4 LOOP
        part1 := part1 || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    -- Gerar segunda parte (4 caracteres)
    FOR i IN 1..4 LOOP
        part2 := part2 || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    -- Gerar terceira parte (4 caracteres)
    FOR i IN 1..4 LOOP
        part3 := part3 || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    RETURN part1 || '-' || part2 || '-' || part3;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar múltiplos códigos de uma vez
CREATE OR REPLACE FUNCTION generate_multiple_invite_codes(
    p_count INTEGER,
    p_created_by INTEGER,
    p_expires_at TIMESTAMP DEFAULT NULL
)
RETURNS TABLE(code VARCHAR) AS $$
DECLARE
    new_code VARCHAR;
    codes_generated INTEGER := 0;
BEGIN
    WHILE codes_generated < p_count LOOP
        -- Gerar código único
        LOOP
            new_code := generate_invite_code();
            -- Verificar se já existe
            EXIT WHEN NOT EXISTS (SELECT 1 FROM invite_codes WHERE invite_codes.code = new_code);
        END LOOP;

        -- Inserir código
        INSERT INTO invite_codes (code, created_by, expires_at)
        VALUES (new_code, p_created_by, p_expires_at);

        codes_generated := codes_generated + 1;
        code := new_code;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS PARA ANALYTICS
-- =====================================================

-- View para estatísticas gerais de um usuário
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
-- DADOS INICIAIS (OPCIONAL)
-- =====================================================

-- Comentado por padrão. Descomente se quiser gerar códigos iniciais.
-- SELECT generate_multiple_invite_codes(5, 1, NOW() + INTERVAL '30 days');
