#!/bin/bash

# Script para configurar CI/CD automaticamente
# Uso: ./setup-cicd.sh

set -e

echo "🚀 Configuração de CI/CD para Linktree"
echo "======================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se está na pasta raiz do projeto
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}❌ Erro: Execute este script na pasta raiz do projeto${NC}"
    exit 1
fi

# Função para ler input com valor padrão
read_with_default() {
    local prompt="$1"
    local default="$2"
    local value

    read -p "$prompt [$default]: " value
    echo "${value:-$default}"
}

echo -e "${YELLOW}📝 Vamos configurar os secrets do GitHub Actions${NC}"
echo ""

# Obter informações
VM_IP=$(read_with_default "Qual o IP da sua VM?" "35.223.99.165")
VM_USER=$(read_with_default "Qual o usuário SSH da VM?" "$USER")
PROJECT_DIR=$(read_with_default "Qual o caminho do projeto na VM?" "/home/$VM_USER/linktree")

echo ""
echo -e "${YELLOW}🔑 Configurando chaves SSH...${NC}"

# Verificar se a chave já existe
if [ -f "$HOME/.ssh/github_actions_deploy" ]; then
    echo -e "${YELLOW}⚠️  Chave SSH já existe em ~/.ssh/github_actions_deploy${NC}"
    read -p "Deseja usar a chave existente? (s/n): " use_existing

    if [ "$use_existing" != "s" ]; then
        echo "Gerando nova chave..."
        ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N ""
    fi
else
    echo "Gerando nova chave SSH..."
    ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N ""
fi

echo ""
echo -e "${GREEN}✅ Chave SSH gerada!${NC}"
echo ""

# Mostrar chave pública
echo -e "${YELLOW}📋 Chave pública (adicione à VM):${NC}"
echo "-----------------------------------"
cat ~/.ssh/github_actions_deploy.pub
echo "-----------------------------------"
echo ""

# Perguntar se quer adicionar automaticamente
read -p "Deseja adicionar a chave à VM automaticamente? (s/n): " auto_add

if [ "$auto_add" = "s" ]; then
    echo "Adicionando chave à VM..."
    ssh $VM_USER@$VM_IP "mkdir -p ~/.ssh && chmod 700 ~/.ssh"
    cat ~/.ssh/github_actions_deploy.pub | ssh $VM_USER@$VM_IP "cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"

    echo -e "${GREEN}✅ Chave adicionada à VM!${NC}"
    echo ""

    # Testar conexão
    echo "Testando conexão SSH..."
    if ssh -i ~/.ssh/github_actions_deploy -o StrictHostKeyChecking=no $VM_USER@$VM_IP "echo 'Conexão OK'"; then
        echo -e "${GREEN}✅ Conexão SSH funcionando!${NC}"
    else
        echo -e "${RED}❌ Erro na conexão SSH${NC}"
        exit 1
    fi
else
    echo ""
    echo -e "${YELLOW}⚠️  Adicione a chave pública manualmente à VM:${NC}"
    echo "ssh $VM_USER@$VM_IP"
    echo "mkdir -p ~/.ssh && chmod 700 ~/.ssh"
    echo "echo 'CHAVE_PUBLICA_ACIMA' >> ~/.ssh/authorized_keys"
    echo "chmod 600 ~/.ssh/authorized_keys"
    echo ""
    read -p "Pressione ENTER quando terminar..."
fi

echo ""
echo -e "${YELLOW}📋 Agora configure os seguintes secrets no GitHub:${NC}"
echo "https://github.com/SEU_USUARIO/SEU_REPO/settings/secrets/actions"
echo ""

echo -e "${GREEN}1. SSH_PRIVATE_KEY${NC}"
echo "   Copie o conteúdo abaixo (incluindo BEGIN e END):"
echo "   -----------------------------------"
cat ~/.ssh/github_actions_deploy
echo "   -----------------------------------"
echo ""

echo -e "${GREEN}2. VM_IP${NC}"
echo "   Valor: $VM_IP"
echo ""

echo -e "${GREEN}3. VM_USER${NC}"
echo "   Valor: $VM_USER"
echo ""

echo -e "${GREEN}4. PROJECT_DIR${NC}"
echo "   Valor: $PROJECT_DIR"
echo ""

# Salvar configurações
cat > .cicd-config << EOF
VM_IP=$VM_IP
VM_USER=$VM_USER
PROJECT_DIR=$PROJECT_DIR
EOF

echo -e "${GREEN}✅ Configurações salvas em .cicd-config${NC}"
echo ""

# Verificar se o git está configurado
echo -e "${YELLOW}🔍 Verificando configuração do Git...${NC}"

if ! git remote -v | grep -q "origin"; then
    echo -e "${RED}❌ Repositório Git não configurado${NC}"
    read -p "URL do repositório GitHub: " repo_url
    git remote add origin "$repo_url"
fi

echo -e "${GREEN}✅ Git configurado!${NC}"
echo ""

# Criar .gitignore entry para o config
if ! grep -q ".cicd-config" .gitignore 2>/dev/null; then
    echo ".cicd-config" >> .gitignore
    echo "~/.ssh/github_actions_deploy*" >> .gitignore
fi

echo -e "${YELLOW}🎯 Próximos passos:${NC}"
echo ""
echo "1. Configure os 4 secrets no GitHub (valores mostrados acima)"
echo "2. Verifique se o repositório está configurado na VM:"
echo "   ssh $VM_USER@$VM_IP 'cd $PROJECT_DIR && git pull'"
echo ""
echo "3. Faça um commit de teste:"
echo "   git add ."
echo "   git commit -m 'ci: configurar CI/CD'"
echo "   git push origin main"
echo ""
echo "4. Acompanhe o deploy em:"
echo "   https://github.com/SEU_USUARIO/SEU_REPO/actions"
echo ""
echo -e "${GREEN}✨ Configuração concluída!${NC}"
echo ""
echo "📚 Para mais informações, veja: SETUP_CI_CD.md"
