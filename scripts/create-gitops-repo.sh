#!/bin/bash

# Script para setup rápido do repositório GitOps
# Uso: ./scripts/create-gitops-repo.sh

set -e

GITOPS_REPO_NAME="argocd-gitops"
GITHUB_USER="periclesanfe"  # Altere para seu usuário
PARENT_DIR="$HOME/Documents/GitHub"

echo "🚀 Setup do Repositório GitOps"
echo "=============================="
echo ""

# Verificar se o repo já existe localmente
if [ -d "$PARENT_DIR/$GITOPS_REPO_NAME" ]; then
    echo "⚠️  Diretório $GITOPS_REPO_NAME já existe em $PARENT_DIR"
    read -p "Deseja sobrescrever? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Operação cancelada"
        exit 0
    fi
    rm -rf "$PARENT_DIR/$GITOPS_REPO_NAME"
fi

# Criar diretório e navegar
echo "📁 Criando diretório..."
mkdir -p "$PARENT_DIR"
cd "$PARENT_DIR"

# Clonar repositório
echo "📥 Clonando repositório..."
if ! git clone "https://github.com/$GITHUB_USER/$GITOPS_REPO_NAME.git" 2>/dev/null; then
    echo ""
    echo "⚠️  Repositório ainda não existe no GitHub!"
    echo ""
    echo "Por favor, crie o repositório primeiro:"
    echo "1. Acesse: https://github.com/new"
    echo "2. Nome: $GITOPS_REPO_NAME"
    echo "3. Visibilidade: Privado"
    echo "4. NÃO inicialize com README"
    echo "5. Create repository"
    echo ""
    read -p "Pressione ENTER quando o repositório estiver criado..."
    
    # Tentar clonar novamente
    git clone "https://github.com/$GITHUB_USER/$GITOPS_REPO_NAME.git"
fi

cd "$GITOPS_REPO_NAME"

# Copiar templates
echo "📋 Copiando templates..."
LINKTREE_DIR=$(dirname "$(dirname "$(realpath "$0")")")
cp -r "$LINKTREE_DIR/docs/gitops-templates"/* .

# Verificar estrutura
echo "✅ Estrutura criada:"
tree -L 2 2>/dev/null || ls -R

echo ""
echo "📝 Revisão de Segurança:"
echo "⚠️  IMPORTANTE: Verifique e altere as senhas antes de fazer commit!"
echo ""
echo "Arquivos para revisar:"
echo "  - environments/dev/postgres-cluster.yaml"
echo "  - environments/prod/postgres-cluster.yaml"
echo ""

read -p "Deseja editar as senhas agora? (Y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    ${EDITOR:-vim} environments/dev/postgres-cluster.yaml
    ${EDITOR:-vim} environments/prod/postgres-cluster.yaml
fi

# Git add
echo "📦 Preparando commit..."
git add .

# Verificar se há mudanças
if git diff --staged --quiet; then
    echo "⚠️  Nenhuma mudança para commitar"
else
    # Commit
    echo "💾 Fazendo commit..."
    git commit -m "chore: initial GitOps structure

- Add CloudNativePG operator manifest
- Add PostgreSQL clusters for dev and prod
- Add ArgoCD Application manifests
- Setup directory structure for environments"

    # Push
    echo "🚀 Fazendo push para GitHub..."
    git push origin main || git push origin master

    echo ""
    echo "✅ Repositório GitOps criado com sucesso!"
    echo ""
    echo "📍 Localização: $PARENT_DIR/$GITOPS_REPO_NAME"
    echo "🌐 GitHub: https://github.com/$GITHUB_USER/$GITOPS_REPO_NAME"
    echo ""
    echo "🎯 Próximos passos:"
    echo "1. Verifique o repo no GitHub"
    echo "2. Crie o Personal Access Token (se ainda não criou)"
    echo "3. Adicione o secret GITOPS_PAT no repo linktree"
    echo "4. Siga o guia: docs/GITOPS_SETUP.md"
fi
