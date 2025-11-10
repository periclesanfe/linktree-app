#!/bin/bash
# Script auxiliar para gerenciar o deployment local do Linktree no Minikube

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para printar com cor
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se o cluster Minikube está rodando
check_minikube() {
    print_info "Verificando status do Minikube..."
    if ! minikube status &> /dev/null; then
        print_error "Minikube não está rodando!"
        echo "Execute: minikube start --cpus=4 --memory=7000 --driver=docker"
        exit 1
    fi
    print_success "Minikube está rodando"
}

# Acessar ArgoCD UI
argocd_ui() {
    print_info "Obtendo senha do ArgoCD..."
    PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)
    
    echo ""
    print_success "ArgoCD UI disponível em: https://localhost:8080"
    echo "Usuario: admin"
    echo "Senha: ${PASSWORD}"
    echo ""
    print_info "Abrindo port-forward..."
    kubectl port-forward svc/argocd-server -n argocd 8080:443
}

# Verificar status geral
status() {
    print_info "Status do Cluster:"
    echo ""
    
    echo "🔹 Namespaces:"
    kubectl get ns | grep -E "argocd|cnpg|dev|prod" || echo "  Nenhum namespace encontrado"
    
    echo ""
    echo "🔹 ArgoCD:"
    kubectl get pods -n argocd 2>/dev/null | head -5 || echo "  ArgoCD não instalado"
    
    echo ""
    echo "🔹 CloudNativePG:"
    kubectl get pods -n cnpg-system 2>/dev/null || echo "  CloudNativePG não instalado"
    
    echo ""
    echo "🔹 Aplicação (dev):"
    kubectl get pods -n dev 2>/dev/null || echo "  Nenhum pod em dev"
    
    echo ""
    echo "🔹 PostgreSQL Clusters:"
    kubectl get clusters.postgresql.cnpg.io --all-namespaces 2>/dev/null || echo "  Nenhum cluster PostgreSQL encontrado"
}

# Menu principal
show_menu() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  🚀 Linktree - Gerenciador de Deploy Local"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1) 📊 Ver status do cluster"
    echo "2) 🌐 Acessar ArgoCD UI"
    echo "3) 🗄️  Ver logs do PostgreSQL"
    echo "4) 🔄 Restart pods da aplicação"
    echo "5) 🧹 Limpar tudo (delete namespaces)"
    echo "6) ❌ Sair"
    echo ""
    read -p "Escolha uma opção: " choice
    
    case $choice in
        1) status ;;
        2) argocd_ui ;;
        3) kubectl logs -n dev -l cnpg.io/cluster=linktree-dev-postgresql --tail=50 ;;
        4) kubectl delete pods -n dev -l app.kubernetes.io/name=linktree ;;
        5) kubectl delete ns dev prod 2>/dev/null; print_success "Namespaces deletados" ;;
        6) exit 0 ;;
        *) print_error "Opção inválida!" ;;
    esac
    
    show_menu
}

# Executar função baseada no argumento
if [ $# -eq 0 ]; then
    check_minikube
    show_menu
else
    case $1 in
        status) status ;;
        argocd) argocd_ui ;;
        check) check_minikube ;;
        *) 
            echo "Uso: $0 [status|argocd|check]"
            exit 1
            ;;
    esac
fi
