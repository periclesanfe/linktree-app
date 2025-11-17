#!/bin/bash

# Script para gerenciar port-forwards do Linktree
# Uso: ./port-forward.sh [start|stop|status|restart] [dev|prod]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

CHECK="✓"
CROSS="✗"
ARROW="→"

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

# Função para verificar se porta está em uso
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0  # Porta em uso
    else
        return 1  # Porta livre
    fi
}

# Função para parar port-forwards
stop_port_forwards() {
    local env=$1
    print_info "Parando port-forwards do ambiente $env..."

    pkill -f "port-forward.*linktree-${env}" 2>/dev/null || true

    if [ "$env" = "dev" ]; then
        pkill -f "port-forward.*5173" 2>/dev/null || true
        pkill -f "port-forward.*8000" 2>/dev/null || true
    elif [ "$env" = "prod" ]; then
        pkill -f "port-forward.*5174" 2>/dev/null || true
        pkill -f "port-forward.*8001" 2>/dev/null || true
    fi

    sleep 1
    print_success "Port-forwards parados"
}

# Função para iniciar port-forwards
start_port_forwards() {
    local env=$1
    local namespace=$env

    # Definir portas baseado no ambiente
    if [ "$env" = "dev" ]; then
        FRONTEND_PORT=5173
        BACKEND_PORT=8000
    elif [ "$env" = "prod" ]; then
        FRONTEND_PORT=5174
        BACKEND_PORT=8001
    else
        print_error "Ambiente inválido: $env (use 'dev' ou 'prod')"
        exit 1
    fi

    print_info "Iniciando port-forwards para ambiente $env..."
    echo ""

    # Verificar se services existem
    print_info "Verificando services no namespace $namespace..."

    if ! kubectl get svc linktree-${env}-frontend -n $namespace &> /dev/null; then
        print_error "Service linktree-${env}-frontend não encontrado!"
        print_warning "Execute: kubectl get svc -n $namespace"
        exit 1
    fi

    if ! kubectl get svc linktree-${env}-backend -n $namespace &> /dev/null; then
        print_error "Service linktree-${env}-backend não encontrado!"
        print_warning "Execute: kubectl get svc -n $namespace"
        exit 1
    fi

    print_success "Services encontrados"
    kubectl get svc -n $namespace | grep linktree
    echo ""

    # Verificar se portas estão livres
    if check_port $FRONTEND_PORT; then
        print_warning "Porta $FRONTEND_PORT já está em uso!"
        print_info "Liberando porta..."
        lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
        sleep 1
    fi

    if check_port $BACKEND_PORT; then
        print_warning "Porta $BACKEND_PORT já está em uso!"
        print_info "Liberando porta..."
        lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
        sleep 1
    fi

    # Iniciar port-forward do frontend
    print_info "Iniciando port-forward do frontend ($FRONTEND_PORT:80)..."
    kubectl port-forward -n $namespace svc/linktree-${env}-frontend $FRONTEND_PORT:80 > /tmp/pf-${env}-frontend.log 2>&1 &
    FRONTEND_PF_PID=$!
    sleep 2

    if ps -p $FRONTEND_PF_PID > /dev/null 2>&1; then
        print_success "Frontend port-forward ativo (PID: $FRONTEND_PF_PID) → http://localhost:$FRONTEND_PORT"
    else
        print_error "Falha ao iniciar port-forward do frontend"
        cat /tmp/pf-${env}-frontend.log
    fi

    # Iniciar port-forward do backend
    print_info "Iniciando port-forward do backend ($BACKEND_PORT:8000)..."
    kubectl port-forward -n $namespace svc/linktree-${env}-backend $BACKEND_PORT:8000 > /tmp/pf-${env}-backend.log 2>&1 &
    BACKEND_PF_PID=$!
    sleep 2

    if ps -p $BACKEND_PF_PID > /dev/null 2>&1; then
        print_success "Backend port-forward ativo (PID: $BACKEND_PF_PID) → http://localhost:$BACKEND_PORT"
    else
        print_error "Falha ao iniciar port-forward do backend"
        cat /tmp/pf-${env}-backend.log
    fi

    echo ""

    # Testar conectividade do backend
    print_info "Testando conectividade do backend..."
    RETRIES=5
    BACKEND_OK=false

    for i in $(seq 1 $RETRIES); do
        if curl -s http://localhost:$BACKEND_PORT/api/health > /dev/null 2>&1; then
            BACKEND_OK=true
            print_success "Backend respondendo em http://localhost:$BACKEND_PORT"
            echo ""
            curl -s http://localhost:$BACKEND_PORT/api/health | jq '.' 2>/dev/null || curl -s http://localhost:$BACKEND_PORT/api/health
            echo ""
            break
        else
            print_warning "Tentativa $i/$RETRIES - Backend ainda não está respondendo..."
            sleep 2
        fi
    done

    if [ "$BACKEND_OK" = false ]; then
        print_warning "Backend não respondeu após $RETRIES tentativas"
        print_info "Verificando logs..."
        kubectl logs -n $namespace deployment/linktree-${env}-backend --tail=20
    fi

    # Testar frontend
    print_info "Testando conectividade do frontend..."
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        print_success "Frontend respondendo em http://localhost:$FRONTEND_PORT"
    else
        print_warning "Frontend não está respondendo (pode levar alguns segundos para iniciar)"
    fi

    echo ""
    print_success "Port-forwards configurados com sucesso!"
    echo ""
    print_info "Acessos disponíveis:"
    echo -e "  Frontend: ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
    echo -e "  Backend:  ${GREEN}http://localhost:$BACKEND_PORT${NC}"
    echo -e "  Health:   ${GREEN}http://localhost:$BACKEND_PORT/api/health${NC}"
}

# Função para mostrar status
show_status() {
    local env=$1

    print_info "Status dos port-forwards:"
    echo ""

    # Procurar processos de port-forward
    if ps aux | grep "port-forward" | grep "linktree-${env}" | grep -v grep > /dev/null 2>&1; then
        print_success "Port-forwards ativos para $env:"
        ps aux | grep "port-forward" | grep "linktree-${env}" | grep -v grep
    else
        print_warning "Nenhum port-forward ativo para $env"
    fi

    echo ""

    # Verificar portas
    if [ "$env" = "dev" ]; then
        FRONTEND_PORT=5173
        BACKEND_PORT=8000
    elif [ "$env" = "prod" ]; then
        FRONTEND_PORT=5174
        BACKEND_PORT=8001
    fi

    if check_port $FRONTEND_PORT; then
        print_success "Porta $FRONTEND_PORT está em uso (Frontend)"
        lsof -i :$FRONTEND_PORT
    else
        print_warning "Porta $FRONTEND_PORT está livre"
    fi

    echo ""

    if check_port $BACKEND_PORT; then
        print_success "Porta $BACKEND_PORT está em uso (Backend)"
        lsof -i :$BACKEND_PORT
    else
        print_warning "Porta $BACKEND_PORT está livre"
    fi
}

# Main
ACTION=${1:-start}
ENV=${2:-dev}

case "$ACTION" in
    start)
        stop_port_forwards $ENV
        start_port_forwards $ENV
        ;;
    stop)
        stop_port_forwards $ENV
        ;;
    status)
        show_status $ENV
        ;;
    restart)
        stop_port_forwards $ENV
        sleep 1
        start_port_forwards $ENV
        ;;
    *)
        echo "Uso: $0 [start|stop|status|restart] [dev|prod]"
        echo ""
        echo "Exemplos:"
        echo "  $0 start dev      # Inicia port-forwards para DEV (padrão)"
        echo "  $0 start prod     # Inicia port-forwards para PROD"
        echo "  $0 stop dev       # Para port-forwards do DEV"
        echo "  $0 status dev     # Mostra status dos port-forwards"
        echo "  $0 restart dev    # Reinicia port-forwards"
        echo ""
        echo "Portas usadas:"
        echo "  DEV:  Frontend=5173, Backend=8000"
        echo "  PROD: Frontend=5174, Backend=8001"
        exit 1
        ;;
esac
