#!/bin/bash

# Script helper para operações comuns do Helm Chart
# Uso: ./scripts/helm-helper.sh [comando] [ambiente]

set -e

CHART_PATH="./helm"
NAMESPACE_DEV="dev"
NAMESPACE_PROD="prod"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

function print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

function print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

function show_usage() {
    cat << EOF
Helm Helper Script para Linktree

Uso: $0 [comando] [ambiente]

Comandos:
  lint                 - Valida o Helm Chart
  template [env]       - Renderiza templates (dev/prod)
  dry-run [env]        - Simula instalação (dev/prod)
  install [env]        - Instala chart (dev/prod)
  upgrade [env]        - Atualiza chart (dev/prod)
  uninstall [env]      - Remove chart (dev/prod)
  status [env]         - Status da release (dev/prod)
  logs [env] [comp]    - Mostra logs (dev/prod) (backend/frontend/migration)
  port-forward [env]   - Port-forward para acessar localmente (dev/prod)
  validate-db [env]    - Valida conexão com banco (dev/prod)
  
Exemplos:
  $0 lint
  $0 template dev
  $0 install prod
  $0 logs prod backend
  $0 port-forward dev

EOF
}

function validate_env() {
    if [[ "$1" != "dev" && "$1" != "prod" ]]; then
        print_error "Ambiente inválido. Use 'dev' ou 'prod'"
        exit 1
    fi
}

function get_namespace() {
    if [[ "$1" == "dev" ]]; then
        echo "$NAMESPACE_DEV"
    else
        echo "$NAMESPACE_PROD"
    fi
}

function get_release_name() {
    echo "linktree-$1"
}

function helm_lint() {
    print_info "Executando lint do Helm Chart..."
    helm lint "$CHART_PATH"
    helm lint "$CHART_PATH" -f "$CHART_PATH/values.dev.yaml"
    helm lint "$CHART_PATH" -f "$CHART_PATH/values.prod.yaml"
    print_info "✓ Lint concluído com sucesso!"
}

function helm_template() {
    validate_env "$1"
    local env=$1
    local values_file="$CHART_PATH/values.$env.yaml"
    
    print_info "Renderizando templates para ambiente: $env"
    helm template "linktree-$env" "$CHART_PATH" -f "$values_file"
}

function helm_dry_run() {
    validate_env "$1"
    local env=$1
    local namespace=$(get_namespace "$env")
    local release=$(get_release_name "$env")
    local values_file="$CHART_PATH/values.$env.yaml"
    
    print_info "Simulando instalação para ambiente: $env"
    helm install "$release" "$CHART_PATH" \
        -f "$values_file" \
        -n "$namespace" \
        --dry-run --debug
}

function helm_install() {
    validate_env "$1"
    local env=$1
    local namespace=$(get_namespace "$env")
    local release=$(get_release_name "$env")
    local values_file="$CHART_PATH/values.$env.yaml"
    
    print_warn "Instalando chart no ambiente: $env (namespace: $namespace)"
    read -p "Continuar? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Instalação cancelada"
        exit 0
    fi
    
    kubectl create namespace "$namespace" --dry-run=client -o yaml | kubectl apply -f -
    
    helm install "$release" "$CHART_PATH" \
        -f "$values_file" \
        -n "$namespace" \
        --create-namespace
    
    print_info "✓ Chart instalado com sucesso!"
    print_info "Execute: $0 status $env"
}

function helm_upgrade() {
    validate_env "$1"
    local env=$1
    local namespace=$(get_namespace "$env")
    local release=$(get_release_name "$env")
    local values_file="$CHART_PATH/values.$env.yaml"
    
    print_info "Atualizando chart no ambiente: $env"
    helm upgrade "$release" "$CHART_PATH" \
        -f "$values_file" \
        -n "$namespace"
    
    print_info "✓ Chart atualizado com sucesso!"
}

function helm_uninstall() {
    validate_env "$1"
    local env=$1
    local namespace=$(get_namespace "$env")
    local release=$(get_release_name "$env")
    
    print_warn "Desinstalando chart do ambiente: $env"
    print_warn "ATENÇÃO: Isso removerá todos os recursos!"
    read -p "Tem certeza? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Desinstalação cancelada"
        exit 0
    fi
    
    helm uninstall "$release" -n "$namespace"
    print_info "✓ Chart desinstalado"
}

function helm_status() {
    validate_env "$1"
    local env=$1
    local namespace=$(get_namespace "$env")
    local release=$(get_release_name "$env")
    
    print_info "Status da release: $release"
    helm status "$release" -n "$namespace"
    
    echo ""
    print_info "Pods em $namespace:"
    kubectl get pods -n "$namespace"
}

function show_logs() {
    validate_env "$1"
    local env=$1
    local component=${2:-backend}
    local namespace=$(get_namespace "$env")
    
    print_info "Logs do $component em $env:"
    kubectl logs -n "$namespace" -l "app.kubernetes.io/component=$component" --tail=100 -f
}

function port_forward() {
    validate_env "$1"
    local env=$1
    local namespace=$(get_namespace "$env")
    
    print_info "Configurando port-forward para $env..."
    print_info "Frontend: http://localhost:3000"
    print_info "Backend: http://localhost:8000"
    echo ""
    print_warn "Pressione Ctrl+C para parar"
    
    kubectl port-forward -n "$namespace" svc/linktree-$env-frontend 3000:80 &
    PID1=$!
    kubectl port-forward -n "$namespace" svc/linktree-$env-backend 8000:8000 &
    PID2=$!
    
    trap "kill $PID1 $PID2 2>/dev/null; exit" INT TERM
    wait
}

function validate_db() {
    validate_env "$1"
    local env=$1
    local namespace=$(get_namespace "$env")
    
    print_info "Validando conexão com banco de dados em $env..."
    
    # Pegar credenciais do secret
    local db_user=$(kubectl get secret -n "$namespace" linktree-$env-db-secret -o jsonpath='{.data.POSTGRES_USER}' | base64 -d)
    local db_pass=$(kubectl get secret -n "$namespace" linktree-$env-db-secret -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d)
    local db_name=$(kubectl get secret -n "$namespace" linktree-$env-db-secret -o jsonpath='{.data.POSTGRES_DB}' | base64 -d)
    local db_host="linktree-$env-postgresql"
    
    print_info "Tentando conectar ao banco..."
    kubectl run -it --rm psql-test --image=postgres:16-alpine --restart=Never -n "$namespace" -- \
        psql -h "$db_host" -U "$db_user" -d "$db_name" -c "\dt"
}

# Main
case "${1:-}" in
    lint)
        helm_lint
        ;;
    template)
        helm_template "${2:-dev}"
        ;;
    dry-run)
        helm_dry_run "${2:-dev}"
        ;;
    install)
        helm_install "${2:-dev}"
        ;;
    upgrade)
        helm_upgrade "${2:-dev}"
        ;;
    uninstall)
        helm_uninstall "${2:-dev}"
        ;;
    status)
        helm_status "${2:-dev}"
        ;;
    logs)
        show_logs "${2:-dev}" "${3:-backend}"
        ;;
    port-forward)
        port_forward "${2:-dev}"
        ;;
    validate-db)
        validate_db "${2:-dev}"
        ;;
    *)
        show_usage
        exit 1
        ;;
esac
