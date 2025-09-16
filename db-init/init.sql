-- db-init/init.sql

-- Habilita a extensão para gerar UUIDs, caso ainda não esteja habilitada.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Cria uma função que será usada por gatilhos (triggers) para atualizar o campo updated_at.
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remove as tabelas existentes para garantir uma recriação limpa (opcional, mas bom para testes)
DROP TABLE IF EXISTS analytics_clicks;
DROP TABLE IF EXISTS social_icons;
DROP TABLE IF EXISTS links;
DROP TABLE IF EXISTS users;


-- Tabela para guardar os usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    profile_image_url TEXT,
    background_image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();


-- Tabela para guardar os links de cada usuário
CREATE TABLE links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    cover_image_url TEXT, 
    color_hash VARCHAR(7),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON links
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();


-- Tabela para guardar os ícones de redes sociais
CREATE TABLE social_icons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('instagram', 'twitter', 'facebook', 'tiktok', 'youtube', 'linkedin', 'github', 'whatsapp')),
    url VARCHAR(2048) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON social_icons
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();


-- Tabela para análise de cliques
CREATE TABLE analytics_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_hash VARCHAR(64),
    country_code VARCHAR(2),
    city VARCHAR(100)
);

CREATE INDEX idx_analytics_clicks_link_id ON analytics_clicks(link_id);