#!/bin/bash

# Script de Apresentação Automatizada - Linktree GitOps
# Autor: Linktree Team
# Descrição: Deploy completo da aplicação com Minikube + ArgoCD + Helm

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
║        🔗  LINKTREE - APRESENTAÇÃO GITOPS                ║
║                                                           ║
║        Kubernetes + ArgoCD + Helm + CloudNativePG        ║
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

# Verificar se namespace está sendo terminado
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
# PASSO 6: Criar Namespace e Secrets
# ============================================
print_step "PASSO 6: Criando namespace e secrets"
echo ""

# Verificar se namespace está sendo terminado
if kubectl get namespace dev -o jsonpath='{.status.phase}' 2>/dev/null | grep -q "Terminating"; then
    print_warning "Namespace dev está sendo terminado. Aguardando..."
    kubectl delete namespace dev --ignore-not-found=true --wait=true --timeout=120s 2>/dev/null || true
    sleep 5
fi

if kubectl get namespace dev &> /dev/null; then
    print_warning "Namespace dev já existe"
else
    print_info "Criando namespace dev..."
    kubectl create namespace dev
fi

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
# PASSO 7: Deploy PostgreSQL
# ============================================
print_step "PASSO 7: Deploy do PostgreSQL via CloudNativePG"
echo ""

print_info "Criando secret para credenciais PostgreSQL..."
kubectl create secret generic linktree-dev-postgres-credentials -n dev \
  --from-literal=username=linktree_dev_user \
  --from-literal=password=dev_password_123 \
  --dry-run=client -o yaml | kubectl apply -f -

print_info "Criando cluster PostgreSQL..."
cat <<EOF | kubectl apply -f -
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

print_info "Aguardando cluster PostgreSQL ficar pronto (2-3 minutos)..."
kubectl wait --for=condition=ready cluster/linktree-dev-postgresql -n dev --timeout=300s

print_info "Pods do PostgreSQL:"
kubectl get pods -n dev -l cnpg.io/cluster=linktree-dev-postgresql

print_success "PostgreSQL rodando"
wait_for_user

# ============================================
# PASSO 8: Inicializar Schema do Banco
# ============================================
print_step "PASSO 8: Inicializando schema do banco de dados"
echo ""

print_info "Obtendo credenciais do banco..."
DB_USER=$(kubectl get secret linktree-dev-postgresql-app -n dev -o jsonpath='{.data.username}' | base64 -d)
DB_PASSWORD=$(kubectl get secret linktree-dev-postgresql-app -n dev -o jsonpath='{.data.password}' | base64 -d)

print_info "Aplicando migrations..."
kubectl exec -n dev linktree-dev-postgresql-1 -- bash -c "PGPASSWORD='$DB_PASSWORD' psql -h localhost -U $DB_USER -d linktree_db" <<EOF
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    profile_image_url TEXT,
    background_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    display_order INTEGER DEFAULT 0,
    cover_image_url TEXT,
    color_hash VARCHAR(7),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS social_icons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    clicked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ip_hash VARCHAR(64),
    user_agent TEXT,
    country_code VARCHAR(2),
    city VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_display_order ON links(display_order);
CREATE INDEX IF NOT EXISTS idx_social_icons_user_id ON social_icons(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_link_id ON analytics_clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_analytics_clicked_at ON analytics_clicks(clicked_at);
EOF

print_info "Verificando tabelas criadas..."
kubectl exec -n dev linktree-dev-postgresql-1 -- bash -c "PGPASSWORD='$DB_PASSWORD' psql -h localhost -U $DB_USER -d linktree_db -c '\dt'"

print_success "Schema do banco inicializado"
wait_for_user

# ============================================
# PASSO 9: Build Imagens Locais
# ============================================
print_step "PASSO 9: Buildando imagens localmente no Minikube"
echo ""

print_info "Configurando Docker para usar o do Minikube..."
eval $(minikube docker-env)

print_info "Building backend image..."
cd /Users/xxmra/Documents/GitHub/BRICELE-LINKTREE/linktree/linktree-backend
docker build -t linktree-backend:local . 2>&1 | tail -5

print_info "Building frontend image..."
cd /Users/xxmra/Documents/GitHub/BRICELE-LINKTREE/linktree/linktree-app
docker build -t linktree-frontend:local . 2>&1 | tail -5

print_success "Imagens buildadas no Minikube"
wait_for_user

# ============================================
# PASSO 10: Deploy via Helm
# ============================================
print_step "PASSO 10: Deploy da aplicação via Helm"
echo ""

HELM_DIR="/Users/xxmra/Documents/GitHub/BRICELE-LINKTREE/linktree/helm"
cd "$HELM_DIR"

print_info "Validando Helm chart..."
helm lint .

print_info "Obtendo senha do banco..."
DB_PASSWORD=$(kubectl get secret linktree-dev-postgresql-app -n dev -o jsonpath='{.data.password}' | base64 -d)

print_info "Instalando aplicação..."
helm upgrade --install linktree-dev . \
  -f values.dev.yaml \
  -n dev \
  --set backend.database.host=linktree-dev-postgresql-rw \
  --set backend.database.password="$DB_PASSWORD"

print_info "Aguardando deployments ficarem prontos..."
kubectl rollout status deployment/linktree-dev-backend -n dev --timeout=180s
kubectl rollout status deployment/linktree-dev-frontend -n dev --timeout=180s

print_info "Deployments:"
kubectl get deployments -n dev

print_info "Pods:"
kubectl get pods -n dev

print_success "Aplicação deployada via Helm"
wait_for_user

# ============================================
# PASSO 11: Configurar ArgoCD Application
# ============================================
print_step "PASSO 11: Configurando ArgoCD Application (Demo)"
echo ""

print_warning "Criando ArgoCD Application em modo 'manual sync' (sem Git)"
print_info "Para apresentação: ArgoCD vai detectar os recursos já deployados"

# Deletar app anterior se existir
argocd app delete linktree-dev --yes 2>/dev/null || true
sleep 3

# Criar app apontando para namespace existente (sem repo)
print_info "Registrando aplicação no ArgoCD..."
kubectl apply -f - <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: linktree-dev
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/periclesanfe/linktree-app.git
    targetRevision: HEAD
    path: helm
    helm:
      valueFiles:
        - values.dev.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: dev
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
EOF

sleep 5

print_info "Status da aplicação:"
argocd app get linktree-dev 2>/dev/null || kubectl get application linktree-dev -n argocd

print_success "ArgoCD Application criada (modo apresentação)"
print_warning "Nota: Sync automático desabilitado (recursos já existem via Helm)"
wait_for_user

# ============================================
# PASSO 12: Configurar Acessos
# ============================================
print_step "PASSO 12: Configurando port-forwards"
echo ""

print_info "Parando port-forwards anteriores..."
pkill -f "port-forward.*linktree" 2>/dev/null || true

print_info "Iniciando port-forward para frontend..."
kubectl port-forward -n dev svc/linktree-dev-frontend 5173:80 > /dev/null 2>&1 &
sleep 2

print_info "Iniciando port-forward para backend..."
kubectl port-forward -n dev svc/linktree-dev-backend 8000:8000 > /dev/null 2>&1 &
sleep 2

print_info "Testando backend health..."
curl -s http://localhost:8000/api/health | jq '.' 2>/dev/null || curl -s http://localhost:8000/api/health

print_success "Port-forwards configurados"

# ============================================
# RESUMO FINAL
# ============================================
echo ""
echo -e "${MAGENTA}════════════════════════════════════════════════════════════${NC}"
echo -e "${MAGENTA}                  🎉 DEPLOYMENT COMPLETO!                   ${NC}"
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
echo -e "${GREEN}${DATABASE} Banco de Dados:${NC}"
echo -e "  ${CYAN}Host:${NC}     linktree-dev-postgresql-rw.dev.svc.cluster.local"
echo -e "  ${CYAN}Database:${NC} linktree_db"
echo -e "  ${CYAN}User:${NC}     linktree_dev_user"
echo ""
echo -e "${GREEN}${CHECK} Recursos Deployados:${NC}"
kubectl get all -n dev
echo ""
echo -e "${YELLOW}💡 Dicas para Apresentação:${NC}"
echo -e "  1. Acesse ArgoCD UI e mostre a aplicação sincronizada"
echo -e "  2. Teste self-healing: kubectl scale deployment/linktree-dev-frontend -n dev --replicas=5"
echo -e "  3. Mostre rollback: argocd app history linktree-dev"
echo -e "  4. Demonstre HA: kubectl delete pod linktree-dev-postgresql-1 -n dev"
echo ""
echo -e "${BLUE}📚 Ver guia completo:${NC} cat /Users/xxmra/Documents/GitHub/BRICELE-LINKTREE/linktree/APRESENTACAO.md"
echo ""
echo -e "${RED}🧹 Para limpar depois:${NC} ./scripts/cleanup.sh"
echo ""
echo -e "${MAGENTA}════════════════════════════════════════════════════════════${NC}"
