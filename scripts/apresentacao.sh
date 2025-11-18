#!/bin/bash

# Script de Apresentação Automatizada - Linktree GitOps
# Autor: Linktree Team
# Descrição: Deploy completo com PostgreSQL + Backend + Frontend gerenciado pelo ArgoCD

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
║     🔗  LINKTREE - GITOPS DEPLOYMENT                     ║
║                                                           ║
║    PostgreSQL + Backend + Frontend | ArgoCD Automated    ║
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
# PASSO 6: Criar Namespace e Secrets para DEV
# ============================================
print_step "PASSO 6: Criando namespace e secrets para ambiente DEV"
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

print_info "Criando secret para PostgreSQL..."
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

print_success "Namespace e secrets configurados"
wait_for_user

# ============================================
# PASSO 7: Criar Cluster PostgreSQL
# ============================================
print_step "PASSO 7: Criando cluster PostgreSQL (CloudNativePG)"
echo ""

print_info "Deletando cluster anterior (se existir)..."
kubectl delete cluster linktree-dev-postgresql -n dev --ignore-not-found=true --wait=false 2>/dev/null || true
sleep 3

print_info "Criando novo cluster PostgreSQL..."
kubectl apply -f - <<EOF
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: linktree-dev-postgresql
  namespace: dev
spec:
  instances: 1
  storage:
    size: 1Gi
  bootstrap:
    initdb:
      database: linktree_db
      owner: linktree_dev_user
      secret:
        name: linktree-dev-postgres-credentials
EOF

print_info "Aguardando cluster PostgreSQL ficar pronto (pode demorar 2-3 minutos)..."
sleep 15

# Aguardar cluster ficar ready
kubectl wait --for=condition=ready cluster/linktree-dev-postgresql -n dev --timeout=300s 2>/dev/null || \
  (print_warning "Cluster ainda inicializando..." && sleep 30 && kubectl wait --for=condition=ready cluster/linktree-dev-postgresql -n dev --timeout=180s)

print_info "Pods PostgreSQL:"
kubectl get pods -n dev | grep postgresql

print_info "Services PostgreSQL criados automaticamente:"
kubectl get svc -n dev | grep postgresql

print_success "Cluster PostgreSQL criado e pronto"
wait_for_user

# ============================================
# PASSO 8: Database Setup (Restore ou Migrations)
# ============================================
print_step "PASSO 8: Configurando banco de dados"
echo ""

print_info "Aguardando pod PostgreSQL estar completamente pronto..."
sleep 10

# Encontrar o pod PostgreSQL
PG_POD=$(kubectl get pod -n dev -l cnpg.io/cluster=linktree-dev-postgresql -o jsonpath='{.items[0].metadata.name}')

if [ -z "$PG_POD" ]; then
    print_error "Pod PostgreSQL não encontrado!"
    kubectl get pods -n dev
    exit 1
fi

print_info "Pod PostgreSQL encontrado: $PG_POD"

# Procurar backup mais recente
BACKUP_DIR="$REPO_DIR/../backups"
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -1)

if [ -n "$LATEST_BACKUP" ]; then
    # BACKUP ENCONTRADO - RESTAURAR
    print_warning "💾 Backup encontrado: $(basename $LATEST_BACKUP)"
    print_info "Restaurando dados do backup..."

    # Copiar backup para o pod
    print_info "Copiando backup para pod PostgreSQL..."
    kubectl cp "$LATEST_BACKUP" "dev/$PG_POD:/tmp/backup.sql.gz"

    # Descompactar e restaurar
    print_info "Descompactando e restaurando backup..."
    kubectl exec -n dev "$PG_POD" -- bash -c "
        gunzip -f /tmp/backup.sql.gz && \
        psql -U postgres -d linktree_db -f /tmp/backup.sql && \
        rm -f /tmp/backup.sql
    "

    # Garantir permissões
    print_info "Ajustando permissões..."
    kubectl exec -n dev "$PG_POD" -- psql -U postgres -d linktree_db <<'SQLEOF'
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO linktree_dev_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO linktree_dev_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO linktree_dev_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO linktree_dev_user;
SQLEOF

    print_success "Backup restaurado com sucesso!"

else
    # NENHUM BACKUP - CRIAR SCHEMA VAZIO
    print_warning "Nenhum backup encontrado em $BACKUP_DIR"
    print_info "Criando schema a partir de db-init/init.sql..."

    # Executar migrations passando arquivo via stdin
    kubectl exec -i -n dev "$PG_POD" -- psql -U postgres -d linktree_db < db-init/init.sql

    print_success "Schema criado com sucesso!"
fi

# Verificar tabelas
print_info "Verificando tabelas..."
kubectl exec -n dev "$PG_POD" -- psql -U postgres -d linktree_db -c "\dt"

print_success "Banco de dados configurado!"
wait_for_user

# ============================================
# PASSO 9: Build Imagens Locais
# ============================================
print_step "PASSO 9: Buildando imagens Docker localmente no Minikube"
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
# PASSO 10: Preparar Helm Chart
# ============================================
print_step "PASSO 10: Preparando Helm chart"
echo ""

print_info "Building Helm chart dependencies..."
cd "$REPO_DIR/helm/linktree"

if [ ! -f "Chart.yaml" ]; then
    print_error "Chart.yaml não encontrado em helm/linktree"
    exit 1
fi

helm dependency build 2>/dev/null || print_warning "Sem dependencies externas (normal para charts locais)"

print_info "Validando chart..."
helm lint . -f values.dev.yaml

print_success "Helm chart preparado e validado"
wait_for_user

# ============================================
# PASSO 11: Deploy via ArgoCD
# ============================================
print_step "PASSO 11: Criando ArgoCD Application"
echo ""

print_info "ArgoCD gerenciará:"
print_info "  ✓ Backend (Node.js + Express)"
print_info "  ✓ Frontend (React + Vite + Nginx)"
print_info "  ✓ Services (ClusterIP + LoadBalancer)"
print_info "  ✓ ConfigMaps e Secrets da aplicação"
echo ""
print_warning "PostgreSQL NÃO é gerenciado pelo ArgoCD (já criado no passo 7)"
echo ""

# Deletar application antiga se existir
argocd app delete linktree-dev --yes 2>/dev/null || true
sleep 3

print_info "Criando ArgoCD Application..."
cd "$REPO_DIR"

# Criar Application apontando diretamente para o chart linktree
kubectl apply -f - <<EOF
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
    path: helm/linktree
    helm:
      releaseName: linktree-dev
      valueFiles:
        - values.dev.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: dev
  syncPolicy:
    automated:
      prune: true
      selfHeal: false
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

print_info "Application criada:"
argocd app list | grep linktree

print_success "ArgoCD Application criada"
wait_for_user

# ============================================
# PASSO 12: Aguardar Sync Completo
# ============================================
print_step "PASSO 12: Sincronizando aplicação"
echo ""

print_info "Sincronizando ArgoCD Application..."
argocd app sync linktree-dev --timeout 300 || true

print_info "Aguardando aplicação ficar saudável..."
argocd app wait linktree-dev --health --timeout 300 || true

print_info "Status da application:"
argocd app get linktree-dev

print_success "Aplicação sincronizada"
wait_for_user

# ============================================
# PASSO 13: Configurar Port-Forwards
# ============================================
print_step "PASSO 13: Configurando port-forwards"
echo ""

print_info "Parando port-forwards anteriores..."
pkill -f "port-forward.*linktree" 2>/dev/null || true
sleep 2

# Aguardar pods estarem prontos
print_info "Aguardando pods ficarem prontos..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=linktree-backend -n dev --timeout=180s 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=linktree-frontend -n dev --timeout=180s 2>/dev/null || true

# Descobrir nomes dos services
print_info "Descobrindo services..."
FRONTEND_SVC=$(kubectl get svc -n dev -l app.kubernetes.io/name=linktree-frontend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
BACKEND_SVC=$(kubectl get svc -n dev -l app.kubernetes.io/name=linktree-backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

if [ -z "$FRONTEND_SVC" ] || [ -z "$BACKEND_SVC" ]; then
    print_warning "Services ainda não criados, aguardando..."
    sleep 10
    FRONTEND_SVC=$(kubectl get svc -n dev -l app.kubernetes.io/name=linktree-frontend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    BACKEND_SVC=$(kubectl get svc -n dev -l app.kubernetes.io/name=linktree-backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
fi

if [ -z "$FRONTEND_SVC" ] || [ -z "$BACKEND_SVC" ]; then
    print_error "Services não encontrados!"
    print_info "Services disponíveis:"
    kubectl get svc -n dev
    print_warning "Você pode configurar port-forwards manualmente depois"
else
    print_info "Services encontrados:"
    print_info "  Frontend: $FRONTEND_SVC"
    print_info "  Backend: $BACKEND_SVC"

    # Port-forward frontend
    print_info "Port-forward frontend (5173:80)..."
    kubectl port-forward -n dev svc/$FRONTEND_SVC 5173:80 > /dev/null 2>&1 &
    sleep 2

    # Port-forward backend
    print_info "Port-forward backend (8000:8000)..."
    kubectl port-forward -n dev svc/$BACKEND_SVC 8000:8000 > /dev/null 2>&1 &
    sleep 2

    print_success "Port-forwards configurados"
fi

# ============================================
# RESUMO FINAL
# ============================================
echo ""
echo -e "${MAGENTA}════════════════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}           🎉 DEPLOYMENT COMPLETO!                          ${NC}"
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
echo -e "${GREEN}${DATABASE} PostgreSQL:${NC}"
echo -e "  ${CYAN}Host:${NC}     linktree-dev-postgresql-rw.dev.svc.cluster.local"
echo -e "  ${CYAN}Port:${NC}     5432"
echo -e "  ${CYAN}Database:${NC} linktree_db"
echo -e "  ${CYAN}User:${NC}     linktree_dev_user"
echo ""
echo -e "${GREEN}${CHECK} Recursos Deployados:${NC}"
kubectl get all -n dev
echo ""
echo -e "${YELLOW}💡 Comandos Úteis:${NC}"
echo -e "  Ver application: ${CYAN}argocd app get linktree-dev${NC}"
echo -e "  Ver logs backend: ${CYAN}kubectl logs -n dev -l app.kubernetes.io/name=linktree-backend -f${NC}"
echo -e "  Ver logs frontend: ${CYAN}kubectl logs -n dev -l app.kubernetes.io/name=linktree-frontend -f${NC}"
echo -e "  Acessar PostgreSQL: ${CYAN}kubectl exec -it -n dev $PG_POD -- psql -U postgres -d linktree_db${NC}"
echo -e "  Forçar sync: ${CYAN}argocd app sync linktree-dev${NC}"
echo ""
echo -e "${RED}🧹 Para limpar depois:${NC} ./scripts/cleanup.sh"
echo ""
echo -e "${MAGENTA}════════════════════════════════════════════════════════════${NC}"
