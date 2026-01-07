#!/bin/bash

# Script de deploy para Google Cloud VM
# Execute este script na sua VM do Google Cloud

set -e

echo "🚀 Iniciando deploy do Linktree..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verifica se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não encontrado. Instalando Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✅ Docker instalado com sucesso${NC}"
    echo -e "${YELLOW}⚠️  Você precisa fazer logout e login novamente para usar o Docker sem sudo${NC}"
    exit 0
fi

# Verifica se o Docker Compose está instalado
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose não encontrado. Instalando...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose instalado com sucesso${NC}"
fi

# Verifica se o arquivo .env.production existe
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Arquivo .env.production não encontrado!${NC}"
    echo -e "${YELLOW}Criando arquivo de exemplo...${NC}"
    cp .env.production .env.production.bak 2>/dev/null || true
    echo -e "${YELLOW}⚠️  Configure o arquivo .env.production com suas credenciais antes de continuar${NC}"
    exit 1
fi

# Para containers antigos
echo "🛑 Parando containers existentes..."
docker compose -f docker-compose.prod.yml down || true

# Remove imagens antigas (opcional - descomente se quiser fazer rebuild completo)
# echo "🗑️  Removendo imagens antigas..."
# docker compose -f docker-compose.prod.yml down --rmi all

# Constrói as imagens
echo "🔨 Construindo imagens Docker..."
docker compose -f docker-compose.prod.yml build --no-cache

# Inicia os serviços
echo "▶️  Iniciando serviços..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# Aguarda os containers iniciarem
echo "⏳ Aguardando containers iniciarem..."
sleep 10

# Verifica status dos containers
echo "📊 Status dos containers:"
docker compose -f docker-compose.prod.yml ps

# Mostra logs
echo ""
echo "📋 Últimos logs:"
docker compose -f docker-compose.prod.yml logs --tail=50

echo ""
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo ""
echo "🌐 Acesse sua aplicação em:"
echo "   Frontend: http://$(curl -s ifconfig.me)"
echo "   Backend API: http://$(curl -s ifconfig.me):3000"
echo ""
echo "📋 Comandos úteis:"
echo "   Ver logs: docker compose -f docker-compose.prod.yml logs -f"
echo "   Parar: docker compose -f docker-compose.prod.yml down"
echo "   Reiniciar: docker compose -f docker-compose.prod.yml restart"
