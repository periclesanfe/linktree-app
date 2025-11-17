#!/bin/bash

# Script para resetar ambiente ANTES da apresentação
# Executa limpeza completa SEM confirmações

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
║              🔄  RESET COMPLETO DO AMBIENTE              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

echo -e "${YELLOW}Removendo tudo para começar do zero...${NC}\n"

# 1. Parar port-forwards
echo -e "${BLUE}→${NC} Parando port-forwards..."
pkill -f "port-forward" 2>/dev/null || true
echo -e "${GREEN}✓${NC} Port-forwards parados\n"

# 2. Remover aplicação ArgoCD
echo -e "${BLUE}→${NC} Removendo aplicação ArgoCD..."
argocd app delete linktree-dev --yes 2>/dev/null || true
echo -e "${GREEN}✓${NC} Aplicação ArgoCD removida\n"

# 3. Remover Helm release
echo -e "${BLUE}→${NC} Removendo Helm release..."
helm uninstall linktree-dev -n dev 2>/dev/null || true
echo -e "${GREEN}✓${NC} Helm release removido\n"

# 4. Remover cluster PostgreSQL
echo -e "${BLUE}→${NC} Removendo cluster PostgreSQL..."
kubectl delete cluster linktree-dev-postgres -n dev --wait=false 2>/dev/null || true
sleep 3
echo -e "${GREEN}✓${NC} Cluster PostgreSQL removido\n"

# 5. Remover namespaces
echo -e "${BLUE}→${NC} Removendo namespaces..."

# Forçar remoção de finalizers se necessário
for ns in dev argocd cnpg-system; do
    if kubectl get namespace $ns &> /dev/null; then
        echo "  Removendo namespace $ns..."
        kubectl delete namespace $ns --force --grace-period=0 2>/dev/null &
    fi
done

# Aguardar remoção
sleep 5

# Forçar finalização se ainda existir
for ns in dev argocd cnpg-system; do
    if kubectl get namespace $ns -o json 2>/dev/null | grep -q "Terminating"; then
        echo "  Forçando finalização de $ns..."
        kubectl get namespace $ns -o json | jq '.spec.finalizers = []' | kubectl replace --raw /api/v1/namespaces/$ns/finalize -f - 2>/dev/null || true
    fi
done

echo -e "${GREEN}✓${NC} Namespaces removidos\n"

# 6. Parar Minikube
echo -e "${BLUE}→${NC} Parando Minikube..."
minikube stop 2>/dev/null || true
echo -e "${GREEN}✓${NC} Minikube parado\n"

# 7. Verificar limpeza
echo -e "${BLUE}→${NC} Verificando limpeza..."
MINIKUBE_STATUS=$(minikube status 2>/dev/null | grep "host:" | awk '{print $2}')

if [ "$MINIKUBE_STATUS" == "Stopped" ]; then
    echo -e "${GREEN}✓${NC} Minikube: Stopped"
else
    echo -e "${YELLOW}⚠${NC}  Minikube: $MINIKUBE_STATUS"
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║              ✓ AMBIENTE RESETADO COM SUCESSO!            ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Pronto para rodar:${NC} ./scripts/apresentacao.sh --auto"
echo ""
