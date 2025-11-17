#!/bin/bash

# Script para demonstrar fluxo GitOps com uma mudança simples
# Adiciona um endpoint de health check no backend

set -e

echo "🔧 Fazendo mudança no código para demonstração GitOps..."
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "linktree-backend/src/index.js" ]; then
    echo "❌ Erro: Execute este script a partir do diretório raiz do projeto"
    exit 1
fi

# Backup do arquivo original
cp linktree-backend/src/index.js linktree-backend/src/index.js.backup

# Adicionar endpoint de health check
echo "📝 Adicionando endpoint /api/health no backend..."

# Encontrar a linha onde está app.use('/api/auth', authRoutes)
# e adicionar o health check antes dela

cat > /tmp/health-check.js << 'EOF'

// Health check endpoint - GitOps Demo
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.1',
    environment: process.env.NODE_ENV || 'development',
    database: 'connected',
    demo: 'GitOps CI/CD Pipeline Working! ✅'
  });
});

EOF

# Criar novo arquivo com o health check inserido
sed '/app.use.*\/api\/auth/i\
// Health check endpoint - GitOps Demo\
app.get("/api/health", (req, res) => {\
  res.json({\
    status: "healthy",\
    timestamp: new Date().toISOString(),\
    version: "1.0.1",\
    environment: process.env.NODE_ENV || "development",\
    database: "connected",\
    demo: "GitOps CI/CD Pipeline Working! ✅"\
  });\
});\
' linktree-backend/src/index.js > linktree-backend/src/index.js.new

mv linktree-backend/src/index.js.new linktree-backend/src/index.js

echo "✅ Endpoint adicionado com sucesso!"
echo ""
echo "📋 Mudança realizada:"
echo "   Arquivo: linktree-backend/src/index.js"
echo "   Endpoint: GET /api/health"
echo ""

# Mostrar o diff
echo "📊 Diff das mudanças:"
echo "─────────────────────────────────────────────────────────"
git diff linktree-backend/src/index.js || diff -u linktree-backend/src/index.js.backup linktree-backend/src/index.js || true
echo "─────────────────────────────────────────────────────────"
echo ""

# Perguntar se quer fazer commit
echo "🎯 Próximos passos para demonstração GitOps:"
echo ""
echo "1. Abra 3 terminais adicionais:"
echo "   Terminal 1: gh run watch"
echo "   Terminal 2: watch argocd app get linktree-dev"
echo "   Terminal 3: watch kubectl get pods -n dev"
echo ""
echo "2. Execute os comandos abaixo para fazer commit e push:"
echo ""
echo "   git add linktree-backend/src/index.js"
echo "   git commit -m 'feat: add health check endpoint for GitOps demo'"
echo "   git push origin develop  # ou main para prod"
echo ""
echo "3. Acompanhe o fluxo completo:"
echo "   - GitHub Actions building images (5-8 min)"
echo "   - GitOps repo being updated (~30s)"
echo "   - ArgoCD detecting changes (até 3 min)"
echo "   - Pods rolling update (1-2 min)"
echo ""
echo "4. Após deploy, teste o endpoint:"
echo "   curl http://localhost:8000/api/health"
echo ""

read -p "Deseja fazer commit agora? (s/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "📤 Fazendo commit e push..."
    git add linktree-backend/src/index.js
    git commit -m "feat: add health check endpoint for GitOps demo

    Adds /api/health endpoint to demonstrate GitOps workflow:
    - GitHub Actions pipeline
    - Docker image build and push
    - GitOps repository update
    - ArgoCD automatic sync
    - Kubernetes rolling update

    Demo endpoint returns:
    - Application status
    - Current timestamp
    - Version info
    - Environment details"

    echo ""
    echo "🚀 Qual branch deseja usar?"
    echo "   1) develop (ambiente dev)"
    echo "   2) main (ambiente prod)"
    read -p "Escolha (1 ou 2): " -n 1 -r
    echo ""

    if [[ $REPLY == "2" ]]; then
        BRANCH="main"
        ENV="prod"
    else
        BRANCH="develop"
        ENV="dev"
    fi

    git push origin "$BRANCH"

    echo ""
    echo "✅ Push realizado para branch: $BRANCH"
    echo "🎯 Ambiente de deploy: $ENV"
    echo ""
    echo "🔍 Acompanhe a pipeline em:"
    echo "   https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
    echo ""
    echo "📊 Ou use: gh run watch"
    echo ""
else
    echo "ℹ️  Commit cancelado. Para fazer manualmente:"
    echo "   git add linktree-backend/src/index.js"
    echo "   git commit -m 'feat: add health check endpoint for GitOps demo'"
    echo "   git push origin develop"
fi

echo ""
echo "💡 Para reverter a mudança:"
echo "   mv linktree-backend/src/index.js.backup linktree-backend/src/index.js"
echo ""
