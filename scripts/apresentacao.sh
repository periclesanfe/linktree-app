#!/bin/bash

# Script de Apresentação Automatizada - Linktree GitOps (App of Apps Pattern)
# Autor: Linktree Team
# Descrição: Deploy usando App of Apps Pattern - 1 Root App cria 2 Child Apps (infrastructure + application)

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emojis
CHECK="✓"
CROSS="✗"
ARROW="→"
ROCKET="🚀"
GEAR="⚙️"
DATABASE="🗄️"
GLOBE="🌐"
PACKAGE="📦"

# Função para printar com cor
print_step() {
    echo -e "${BLUE}${ROCKET} $1${NC}"
}

print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

print_error() {
    echo -e "${RED}${CROSS} $1${NC}"
}

print_info() {
    echo -e "${CYAN}${ARROW} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Função para aguardar confirmação
wait_for_user() {
    if [ "$AUTO_MODE" != "true" ]; then
        echo -e "\n${YELLOW}Pressione ENTER para continuar...${NC}"
        read
    fi
}

# Função para verificar se comando existe
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "Comando '$1' não encontrado. Instale antes de continuar."
        exit 1
    fi
}

# Banner
echo -e "${MAGENTA}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     🔗  LINKTREE - APP OF APPS PATTERN                   ║
║                                                           ║
║    1 Root App → 2 Child Apps | Infrastructure + App      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

# Verificar modo automático
if [ "$1" == "--auto" ]; then
    AUTO_MODE="true"
    print_info "Modo automático ativado"
else
    AUTO_MODE="false"
    print_info "Modo interativo (use --auto para pular confirmações)"
fi

echo ""

# ============================================
# PASSO 1: Verificar Pré-requisitos
# ============================================
print_step "PASSO 1: Verificando pré-requisitos"
echo ""

check_command docker
check_command minikube
check_command kubectl
check_command helm
check_command argocd

print_info "Docker: $(docker --version | awk '{print $3}')"
print_info "Minikube: $(minikube version --short)"
print_info "Kubectl: $(kubectl version --client --short 2>/dev/null | awk '{print $3}')"
print_info "Helm: $(helm version --short)"
print_info "ArgoCD: $(argocd version --client --short 2>/dev/null | awk '{print $2}' || echo 'instalado')"

print_success "Todos os pré-requisitos encontrados"
wait_for_user

# ============================================
# PASSO 2: Iniciar Minikube
# ============================================
print_step "PASSO 2: Iniciando cluster Kubernetes (Minikube)"
echo ""

if minikube status &> /dev/null; then
    print_warning "Minikube já está rodando"
else
    print_info "Iniciando Minikube (4 CPUs, 7GB RAM)..."
    minikube start --driver=docker --cpus=4 --memory=7000
fi

print_info "Cluster info:"
kubectl cluster-info
kubectl get nodes

print_success "Cluster Kubernetes pronto"
wait_for_user

# ============================================
# PASSO 3: Instalar ArgoCD
# ============================================
print_step "PASSO 3: Instalando ArgoCD"
echo ""

if kubectl get namespace argocd -o jsonpath='{.status.phase}' 2>/dev/null | grep -q "Terminating"; then
    print_warning "Namespace argocd está sendo terminado. Aguardando..."
    kubectl delete namespace argocd --ignore-not-found=true --wait=true --timeout=120s 2>/dev/null || true
    sleep 5
fi

if kubectl get namespace argocd &> /dev/null; then
    print_warning "Namespace argocd já existe"
else
    print_info "Criando namespace argocd..."
    kubectl create namespace argocd
fi

print_info "Instalando ArgoCD..."
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

print_info "Aguardando pods do ArgoCD ficarem prontos (pode demorar 2-3 minutos)..."
sleep 10
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s 2>/dev/null || \
  (echo "Aguardando pods serem criados..." && sleep 20 && kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s)

print_info "Pods do ArgoCD:"
kubectl get pods -n argocd

print_success "ArgoCD instalado"
wait_for_user

# ============================================
# PASSO 4: Configurar Acesso ao ArgoCD
# ============================================
print_step "PASSO 4: Configurando acesso ao ArgoCD"
echo ""

print_info "Obtendo senha do admin..."
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)

echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}${GLOBE} ArgoCD UI Credentials:${NC}"
echo -e "${GREEN}URL:      https://localhost:8080${NC}"
echo -e "${GREEN}Username: admin${NC}"
echo -e "${GREEN}Password: ${ARGOCD_PASSWORD}${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"

print_info "Iniciando port-forward para ArgoCD UI..."
pkill -f "port-forward.*argocd-server" 2>/dev/null || true
kubectl port-forward svc/argocd-server -n argocd 8080:443 > /dev/null 2>&1 &
sleep 3

print_info "Fazendo login via CLI..."
argocd login localhost:8080 --username admin --password "$ARGOCD_PASSWORD" --insecure

print_success "ArgoCD acessível em https://localhost:8080"
wait_for_user

# ============================================
# PASSO 5: Instalar Operador PostgreSQL
# ============================================
print_step "PASSO 5: Instalando CloudNativePG Operator"
echo ""

print_info "Instalando operador..."
kubectl apply -f https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.22/releases/cnpg-1.22.0.yaml

print_info "Aguardando operador ficar pronto..."
sleep 10
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=cloudnative-pg -n cnpg-system --timeout=120s 2>/dev/null || true

print_info "Pods do operador:"
kubectl get pods -n cnpg-system

print_success "CloudNativePG Operator instalado"
wait_for_user

# ============================================
# PASSO 6: Criar Secrets para DEV
# ============================================
print_step "PASSO 6: Criando secrets para ambiente DEV"
echo ""

if kubectl get namespace dev -o jsonpath='{.status.phase}' 2>/dev/null | grep -q "Terminating"; then
    print_warning "Namespace dev está sendo terminado. Aguardando..."
    kubectl delete namespace dev --ignore-not-found=true --wait=true --timeout=120s 2>/dev/null || true
    sleep 5
fi

if ! kubectl get namespace dev &> /dev/null; then
    print_info "Criando namespace dev..."
    kubectl create namespace dev
fi

print_info "Criando secrets para PostgreSQL..."
kubectl create secret generic linktree-dev-postgres-credentials -n dev \
  --from-literal=username=linktree_dev_user \
  --from-literal=password=dev_password_123 \
  --dry-run=client -o yaml | kubectl apply -f -

print_info "Criando secret JWT..."
JWT_SECRET=$(openssl rand -base64 32)
kubectl delete secret linktree-secrets -n dev 2>/dev/null || true
kubectl create secret generic linktree-secrets \
  -n dev \
  --from-literal=JWT_SECRET="$JWT_SECRET"

print_info "Secrets criados:"
kubectl get secrets -n dev

print_success "Secrets do ambiente DEV configurados"
wait_for_user

# ============================================
# PASSO 7: Build Imagens Locais
# ============================================
print_step "PASSO 7: Buildando imagens localmente no Minikube"
echo ""

print_info "Configurando Docker para usar o do Minikube..."
eval $(minikube docker-env)

REPO_DIR=$(dirname "$(dirname "$(realpath "$0")")")
print_info "Repositório base: $REPO_DIR"

print_info "Building backend image..."
cd "$REPO_DIR/linktree-backend"
docker build -t linktree-backend:local . 2>&1 | tail -5

print_info "Building frontend image..."
cd "$REPO_DIR/linktree-app"
docker build -t linktree-frontend:local . 2>&1 | tail -5

print_info "Imagens no Minikube:"
minikube ssh "docker images | grep linktree"

print_success "Imagens buildadas no Minikube"
wait_for_user

# ============================================
# PASSO 7.5: Preparar Helm Charts
# ============================================
print_step "PASSO 7.5: Preparando Helm charts (App of Apps)"
echo ""

print_info "Building Helm chart dependencies..."

# Infrastructure chart
print_info "Building infrastructure chart..."
cd "$REPO_DIR/helm/charts-new/infrastructure"
if [ -f "Chart.yaml" ]; then
    helm dependency build 2>/dev/null || print_warning "Falha ao build dependencies de infrastructure (pode ser normal se não houver deps)"
    print_success "Infrastructure chart pronto"
else
    print_error "Chart.yaml não encontrado em helm/charts-new/infrastructure"
    exit 1
fi

# Linktree chart
print_info "Building linktree chart..."
cd "$REPO_DIR/helm/charts-new/linktree"
if [ -f "Chart.yaml" ]; then
    helm dependency build 2>/dev/null || print_warning "Falha ao build dependencies de linktree (pode ser normal se não houver deps)"
    print_success "Linktree chart pronto"
else
    print_error "Chart.yaml não encontrado em helm/charts-new/linktree"
    exit 1
fi

print_info "Charts prontos:"
print_info "  ├── infrastructure/ (PostgreSQL + Monitoring)"
print_info "  └── linktree/ (Backend + Frontend)"

print_success "Helm charts preparados"
wait_for_user

# ============================================
# PASSO 8: Deploy via ArgoCD Root Application
# ============================================
print_step "PASSO 8: Criando Root Application do ArgoCD (App of Apps Pattern)"
echo ""

print_warning "🏗️ App of Apps Pattern:"
print_info "  → Root Application cria 2 Child Applications automaticamente:"
print_info "     ├── linktree-dev-infrastructure (PostgreSQL + Monitoring) [sync wave -1]"
print_info "     └── linktree-dev-app (Backend + Frontend) [sync wave 0]"
echo ""
print_info "  → Backend e Frontend são deployados juntos (mesmo produto)"
print_info "  → Infrastructure deploye primeiro, depois Application"
echo ""

# Deletar applications antigas se existirem
argocd app delete linktree-dev --yes 2>/dev/null || true
argocd app delete linktree-dev-infrastructure --yes 2>/dev/null || true
argocd app delete linktree-dev-app --yes 2>/dev/null || true
sleep 3

print_info "Criando Root Application..."
cd "$REPO_DIR"

# NOTA: Para produção, substitua file://$REPO_DIR por:
# repoURL: https://github.com/periclesanfe/linktree-app.git

# Criar Root Application temporária para demonstração local
cat <<EOF | kubectl apply -f -
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: linktree-dev
  namespace: argocd
  labels:
    app.kubernetes.io/name: linktree
    environment: dev
spec:
  project: default
  source:
    repoURL: file://$REPO_DIR
    targetRevision: HEAD
    path: argocd/apps/dev
    directory:
      recurse: true
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: false  # Dev permite experimentos manuais
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
EOF

sleep 5

print_info "Aguardando Root Application criar as Child Applications..."
sleep 10

print_info "Applications criadas:"
argocd app list | grep linktree || kubectl get applications -n argocd | grep linktree

print_success "Root Application criada com sucesso"
print_warning "2 Child Applications serão criadas automaticamente:"
print_info "  1. linktree-dev-infrastructure (database + monitoring)"
print_info "  2. linktree-dev-app (backend + frontend)"
wait_for_user

# ============================================
# PASSO 9: Aguardar Sync Completo
# ============================================
print_step "PASSO 9: Aguardando sincronização das applications"
echo ""

print_info "Sincronizando Root Application..."
argocd app sync linktree-dev --timeout 60 || true

print_info "Aguardando child apps serem criadas..."
sleep 15

print_info "Sincronizando linktree-dev-infrastructure (database + monitoring)..."
argocd app sync linktree-dev-infrastructure --timeout 300 || true
argocd app wait linktree-dev-infrastructure --health --timeout 300 || true

print_success "Infrastructure pronta!"
print_info "Aguardando 10 segundos antes de deployar app..."
sleep 10

print_info "Sincronizando linktree-dev-app (backend + frontend)..."
argocd app sync linktree-dev-app --timeout 300 || true
argocd app wait linktree-dev-app --health --timeout 300 || true

print_info "Status das applications:"
argocd app list | grep linktree

print_success "Todas as applications sincronizadas"
wait_for_user

# ============================================
# PASSO 10: Configurar Acessos
# ============================================
print_step "PASSO 10: Configurando port-forwards"
echo ""

print_info "Parando port-forwards anteriores..."
pkill -f "port-forward.*linktree" 2>/dev/null || true
sleep 1

# Descobrir nomes dos services dinamicamente
print_info "Descobrindo nomes dos services..."
FRONTEND_SVC=$(kubectl get svc -n dev -l app.kubernetes.io/component=frontend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
BACKEND_SVC=$(kubectl get svc -n dev -l app.kubernetes.io/component=backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

# Fallback para nomes padrão se labels não funcionarem
if [ -z "$FRONTEND_SVC" ]; then
    FRONTEND_SVC=$(kubectl get svc -n dev -o name | grep frontend | sed 's|service/||' | head -1)
fi

if [ -z "$BACKEND_SVC" ]; then
    BACKEND_SVC=$(kubectl get svc -n dev -o name | grep backend | sed 's|service/||' | head -1)
fi

if [ -z "$FRONTEND_SVC" ]; then
    print_error "Service do frontend não encontrado!"
    print_info "Services disponíveis:"
    kubectl get svc -n dev
    exit 1
fi

if [ -z "$BACKEND_SVC" ]; then
    print_error "Service do backend não encontrado!"
    print_info "Services disponíveis:"
    kubectl get svc -n dev
    exit 1
fi

print_info "Services encontrados:"
print_info "  Frontend: $FRONTEND_SVC"
print_info "  Backend: $BACKEND_SVC"
kubectl get svc -n dev | grep linktree

# Configurar port-forward para frontend
print_info "Iniciando port-forward para frontend (5173:80)..."
kubectl port-forward -n dev svc/$FRONTEND_SVC 5173:80 > /tmp/pf-frontend.log 2>&1 &
FRONTEND_PF_PID=$!
sleep 3

# Verificar se port-forward do frontend está ativo
if ! ps -p $FRONTEND_PF_PID > /dev/null 2>&1; then
    print_error "Port-forward do frontend falhou!"
    cat /tmp/pf-frontend.log
    print_warning "Tentando novamente..."
    kubectl port-forward -n dev svc/$FRONTEND_SVC 5173:80 > /tmp/pf-frontend.log 2>&1 &
    FRONTEND_PF_PID=$!
    sleep 3
fi

if ps -p $FRONTEND_PF_PID > /dev/null 2>&1; then
    print_success "Frontend port-forward ativo (PID: $FRONTEND_PF_PID)"
else
    print_error "Não foi possível estabelecer port-forward do frontend"
fi

# Configurar port-forward para backend
print_info "Iniciando port-forward para backend (8000:8000)..."
kubectl port-forward -n dev svc/$BACKEND_SVC 8000:8000 > /tmp/pf-backend.log 2>&1 &
BACKEND_PF_PID=$!
sleep 3

# Verificar se port-forward do backend está ativo
if ! ps -p $BACKEND_PF_PID > /dev/null 2>&1; then
    print_error "Port-forward do backend falhou!"
    cat /tmp/pf-backend.log
    print_warning "Tentando novamente..."
    kubectl port-forward -n dev svc/$BACKEND_SVC 8000:8000 > /tmp/pf-backend.log 2>&1 &
    BACKEND_PF_PID=$!
    sleep 3
fi

if ps -p $BACKEND_PF_PID > /dev/null 2>&1; then
    print_success "Backend port-forward ativo (PID: $BACKEND_PF_PID)"
else
    print_error "Não foi possível estabelecer port-forward do backend"
fi

# Testar conectividade do backend
print_info "Testando conectividade do backend..."
RETRIES=5
BACKEND_OK=false

for i in $(seq 1 $RETRIES); do
    if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
        BACKEND_OK=true
        print_success "Backend respondendo em http://localhost:8000"
        curl -s http://localhost:8000/api/health | jq '.' 2>/dev/null || curl -s http://localhost:8000/api/health
        break
    else
        print_warning "Tentativa $i/$RETRIES - Backend ainda não está respondendo..."
        sleep 3
    fi
done

if [ "$BACKEND_OK" = false ]; then
    print_warning "Backend não respondeu após $RETRIES tentativas"
    print_info "Verificando logs do backend:"
    BACKEND_DEPLOY=$(kubectl get deployment -n dev -l app.kubernetes.io/component=backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [ -n "$BACKEND_DEPLOY" ]; then
        kubectl logs -n dev deployment/$BACKEND_DEPLOY --tail=20
    else
        print_warning "Deployment do backend não encontrado para verificar logs"
    fi
fi

# Testar conectividade do frontend
print_info "Testando conectividade do frontend..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    print_success "Frontend respondendo em http://localhost:5173"
else
    print_warning "Frontend não está respondendo ainda (pode levar alguns segundos)"
fi

print_info "Port-forwards ativos:"
ps aux | grep "port-forward" | grep -v grep || echo "Nenhum port-forward encontrado"

print_success "Port-forwards configurados"

# ============================================
# RESUMO FINAL
# ============================================
echo ""
echo -e "${MAGENTA}════════════════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}           🎉 APP OF APPS DEPLOYMENT COMPLETO!              ${NC}"
echo -e "${MAGENTA}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}${GLOBE} Acessos:${NC}"
echo -e "  ${CYAN}Frontend:${NC}     http://localhost:5173"
echo -e "  ${CYAN}Backend:${NC}      http://localhost:8000"
echo -e "  ${CYAN}Health Check:${NC} http://localhost:8000/api/health"
echo -e "  ${CYAN}ArgoCD UI:${NC}    https://localhost:8080"
echo ""
echo -e "${GREEN}${GEAR} ArgoCD Credentials:${NC}"
echo -e "  ${CYAN}Username:${NC} admin"
echo -e "  ${CYAN}Password:${NC} $ARGOCD_PASSWORD"
echo ""
echo -e "${GREEN}${PACKAGE} App of Apps Pattern - 1 Root + 2 Child Apps:${NC}"
echo -e "  ${CYAN}Root:${NC} linktree-dev (cria child apps automaticamente)"
echo -e "  ${CYAN}Child 1:${NC} linktree-dev-infrastructure (PostgreSQL + Monitoring) [wave -1]"
echo -e "  ${CYAN}Child 2:${NC} linktree-dev-app (Backend + Frontend juntos) [wave 0]"
echo ""
echo -e "${GREEN}${CHECK} Recursos Deployados:${NC}"
kubectl get all -n dev
echo ""
echo -e "${YELLOW}💡 Demonstrações para Apresentação:${NC}"
echo -e "  1. Ver applications: ${CYAN}argocd app list${NC}"
echo -e "  2. Ver Root App: ${CYAN}argocd app get linktree-dev${NC}"
echo -e "  3. Ver Child Apps: ${CYAN}argocd app list | grep linktree-dev${NC}"
echo -e "  4. Self-healing: ${CYAN}kubectl scale deployment -n dev -l app.kubernetes.io/component=backend --replicas=5${NC}"
echo -e "  5. Rollback infrastructure: ${CYAN}argocd app history linktree-dev-infrastructure${NC}"
echo -e "  6. Rollback app: ${CYAN}argocd app history linktree-dev-app${NC}"
echo -e "  7. Ver sync waves: ${CYAN}kubectl get apps -n argocd -o custom-columns=NAME:.metadata.name,WAVE:.metadata.annotations.argocd\\.argoproj\\.io/sync-wave | grep linktree${NC}"
echo -e "  8. Delete child app (root recreia): ${CYAN}argocd app delete linktree-dev-app --yes${NC}"
echo -e "  9. Sync root (recreia child): ${CYAN}argocd app sync linktree-dev${NC}"
echo ""
echo -e "${BLUE}📚 Ver estrutura App of Apps:${NC}"
echo -e "  ${CYAN}cat $REPO_DIR/argocd/root-apps/dev.yaml${NC}  # Root app"
echo -e "  ${CYAN}ls -la $REPO_DIR/argocd/apps/dev/${NC}  # Child apps"
echo -e "  ${CYAN}ls -la $REPO_DIR/helm/charts-new/${NC}  # New Helm charts"
echo ""
echo -e "${RED}🧹 Para limpar depois:${NC} ./scripts/cleanup.sh"
echo ""
echo -e "${MAGENTA}════════════════════════════════════════════════════════════${NC}"
