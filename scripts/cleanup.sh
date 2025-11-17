#!/bin/bash

# Script de Limpeza - Linktree GitOps
# Remove todos os recursos criados durante a apresentação

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              🧹  LIMPEZA PÓS-APRESENTAÇÃO                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

echo -e "${YELLOW}⚠️  Este script vai remover:${NC}"
echo "  - Aplicação ArgoCD (linktree-dev)"
echo "  - Helm release (linktree-dev)"
echo "  - Cluster PostgreSQL"
echo "  - Namespace dev"
echo "  - ArgoCD (completo)"
echo "  - Operador CloudNativePG"
echo "  - Cluster Minikube"
echo ""
echo -e "${RED}Esta ação NÃO pode ser desfeita!${NC}"
echo ""
read -p "Tem certeza que deseja continuar? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${BLUE}Operação cancelada.${NC}"
    exit 0
fi

echo -e "${BLUE}Iniciando limpeza...${NC}\n"

# Parar port-forwards
echo -e "${YELLOW}→ Parando port-forwards...${NC}"
pkill -f "port-forward" 2>/dev/null || true
echo -e "${GREEN}✓ Port-forwards parados${NC}\n"

# Remover aplicação do ArgoCD
echo -e "${YELLOW}→ Removendo aplicação do ArgoCD...${NC}"
argocd app delete linktree-dev --yes 2>/dev/null || echo "  (aplicação não encontrada)"
echo -e "${GREEN}✓ Aplicação ArgoCD removida${NC}\n"

# Remover Helm release
echo -e "${YELLOW}→ Removendo Helm release...${NC}"
helm uninstall linktree-dev -n dev 2>/dev/null || echo "  (release não encontrado)"
echo -e "${GREEN}✓ Helm release removido${NC}\n"

# Remover cluster PostgreSQL
echo -e "${YELLOW}→ Removendo cluster PostgreSQL...${NC}"
kubectl delete cluster linktree-dev-postgresql -n dev 2>/dev/null || echo "  (cluster não encontrado)"
sleep 5
echo -e "${GREEN}✓ Cluster PostgreSQL removido${NC}\n"

# Remover namespace dev
echo -e "${YELLOW}→ Removendo namespace dev...${NC}"
kubectl delete namespace dev 2>/dev/null || echo "  (namespace não encontrado)"
echo -e "${GREEN}✓ Namespace dev removido${NC}\n"

# Remover ArgoCD
echo -e "${YELLOW}→ Removendo ArgoCD...${NC}"
kubectl delete namespace argocd 2>/dev/null || echo "  (namespace não encontrado)"
echo -e "${GREEN}✓ ArgoCD removido${NC}\n"

# Remover operador CloudNativePG
echo -e "${YELLOW}→ Removendo operador CloudNativePG...${NC}"
kubectl delete namespace cnpg-system 2>/dev/null || echo "  (namespace não encontrado)"
echo -e "${GREEN}✓ Operador CloudNativePG removido${NC}\n"

# Perguntar sobre o Minikube
echo ""
read -p "Deseja parar o Minikube? (yes/no): " -r
echo ""

if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${YELLOW}→ Parando Minikube...${NC}"
    minikube stop
    echo -e "${GREEN}✓ Minikube parado${NC}\n"

    echo ""
    read -p "Deseja DELETAR o cluster Minikube completamente? (yes/no): " -r
    echo ""

    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo -e "${YELLOW}→ Deletando cluster Minikube...${NC}"
        minikube delete
        echo -e "${GREEN}✓ Cluster Minikube deletado${NC}\n"
    fi
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║                  ✓ LIMPEZA CONCLUÍDA!                     ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Para rodar novamente:${NC} ./scripts/apresentacao.sh"
echo ""
