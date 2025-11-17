# Plano de Modificações - apresentacao.sh

## Visão Geral

O script `scripts/apresentacao.sh` precisa ser atualizado para refletir a nova arquitetura **App of Apps** ao invés da antiga arquitetura tier-separated.

## Mudanças Necessárias

### 1. Banner e Descrição (Linhas 66-76)

**Atual:**
```
║     🔗  LINKTREE - ARQUITETURA MODULAR GITOPS            ║
║        6 ArgoCD Apps | Dev + Prod | Database Separado    ║
```

**Novo:**
```
║     🔗  LINKTREE - APP OF APPS PATTERN                   ║
║        1 Root App → 2 Child Apps | Infrastructure + App  ║
```

**Justificativa:** Reflete a nova arquitetura onde 1 root app cria 2 child apps automaticamente.

---

### 2. Comentários do Cabeçalho (Linhas 3-5)

**Atual:**
```bash
# Descrição: Deploy modular com ArgoCD gerenciando apps separadas (database, backend, frontend)
```

**Novo:**
```bash
# Descrição: Deploy usando App of Apps Pattern - 1 Root App cria 2 Child Apps (infrastructure + application)
```

---

### 3. PASSO 8: Deploy via ArgoCD (Linhas 272-383)

Esta é a **maior mudança**. Atualmente o script cria um ApplicationSet que gera 6 applications (3 por ambiente). Precisa ser substituído por deploy da Root Application.

#### 3.1. Atualizar descrição da arquitetura (Linhas 277-285)

**Atual:**
```bash
print_warning "📦 Arquitetura Modular:"
print_info "  → 1 ApplicationSet gerencia 6 Applications separadas:"
print_info "     ├── linktree-dev-database"
print_info "     ├── linktree-dev-backend"
print_info "     ├── linktree-dev-frontend"
print_info "     ├── linktree-prod-database"
print_info "     ├── linktree-prod-backend"
print_info "     └── linktree-prod-frontend"
```

**Novo:**
```bash
print_warning "🏗️ App of Apps Pattern:"
print_info "  → Root Application cria 2 Child Applications automaticamente:"
print_info "     ├── linktree-dev-infrastructure (PostgreSQL + Monitoring) [sync wave -1]"
print_info "     └── linktree-dev-app (Backend + Frontend) [sync wave 0]"
echo ""
print_info "  → Backend e Frontend são deployados juntos (mesmo produto)"
print_info "  → Infrastructure deploye primeiro, depois Application"
```

#### 3.2. Substituir ApplicationSet por Root Application (Linhas 287-371)

**Remover:**
- Todo o bloco do ApplicationSet (linhas 287-371)
- Deletar applicationset e applications antigas

**Adicionar:**

```bash
# Deletar applications antigas se existirem
argocd app delete linktree-dev --yes 2>/dev/null || true
argocd app delete linktree-dev-infrastructure --yes 2>/dev/null || true
argocd app delete linktree-dev-app --yes 2>/dev/null || true
sleep 3

print_info "Criando Root Application..."
cd "$REPO_DIR"

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
print_info "  1. linktree-dev-infrastructure (database)"
print_info "  2. linktree-dev-app (backend + frontend)"
```

**Justificativa:**
- App of Apps pattern é a melhor prática
- Root App aponta para `argocd/apps/dev/` que contém as child apps
- Usa `file://$REPO_DIR` para demo local (em produção seria GitHub URL)

---

### 4. PASSO 9: Aguardar Sync (Linhas 385-407)

Atualmente sincroniza 3 apps (database, backend, frontend). Precisa sincronizar 2 child apps.

**Atual:**
```bash
print_info "Sincronizando linktree-dev-database..."
argocd app sync linktree-dev-database --timeout 300 || true
argocd app wait linktree-dev-database --health --timeout 300 || true

print_info "Sincronizando linktree-dev-backend..."
argocd app sync linktree-dev-backend --timeout 300 || true
argocd app wait linktree-dev-backend --health --timeout 300 || true

print_info "Sincronizando linktree-dev-frontend..."
argocd app sync linktree-dev-frontend --timeout 300 || true
argocd app wait linktree-dev-frontend --health --timeout 300 || true
```

**Novo:**
```bash
print_info "Sincronizando Root Application..."
argocd app sync linktree-dev --timeout 60 || true

print_info "Aguardando child apps serem criadas..."
sleep 15

print_info "Sincronizando linktree-dev-infrastructure (database + monitoring)..."
argocd app sync linktree-dev-infrastructure --timeout 300 || true
argocd app wait linktree-dev-infrastructure --health --timeout 300 || true

print_info "Infrastructure pronta! Aguardando 10 segundos antes de deployar app..."
sleep 10

print_info "Sincronizando linktree-dev-app (backend + frontend)..."
argocd app sync linktree-dev-app --timeout 300 || true
argocd app wait linktree-dev-app --health --timeout 300 || true

print_info "Status das applications:"
argocd app list | grep linktree
```

**Justificativa:**
- Sincroniza root app primeiro
- Aguarda child apps serem criadas
- Sync waves garantem ordem: infrastructure → application
- Adiciona delay entre infrastructure e app para garantir DB está pronto

---

### 5. PASSO 10: Port-Forwards (Linhas 409-514)

Os service names mudaram:
- `linktree-dev-frontend` → `linktree-dev-frontend` (mesmo nome, mas agora é do chart linktree/frontend)
- `linktree-dev-backend` → `linktree-dev-backend` (mesmo nome, mas agora é do chart linktree/backend)

**IMPORTANTE:** Na verdade os nomes dos services podem ser diferentes dependendo dos templates dos subcharts. Precisamos verificar como os subcharts nomeiam os services.

**Verificação necessária:**
```bash
# Após deploy, verificar nomes reais dos services:
kubectl get svc -n dev
```

**Provável mudança:**
Se os subcharts usam o releaseName, os services podem ser:
- `linktree-dev-frontend` (releaseName + subchart name)
- `linktree-dev-backend`

Mas se o parent chart passa um releaseName diferente, pode ser:
- `linktree-dev-app-frontend`
- `linktree-dev-app-backend`

**Ação:** Adicionar verificação dinâmica dos service names:

```bash
# Descobrir nome do service do frontend
FRONTEND_SVC=$(kubectl get svc -n dev -l app.kubernetes.io/component=frontend -o jsonpath='{.items[0].metadata.name}')
BACKEND_SVC=$(kubectl get svc -n dev -l app.kubernetes.io/component=backend -o jsonpath='{.items[0].metadata.name}')

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

# Configurar port-forward para frontend
print_info "Iniciando port-forward para frontend (5173:80)..."
kubectl port-forward -n dev svc/$FRONTEND_SVC 5173:80 > /tmp/pf-frontend.log 2>&1 &
# ... resto do código
```

**Justificativa:** Nomes dos services podem variar dependendo de como os subcharts são configurados. Descoberta dinâmica é mais robusta.

---

### 6. Resumo Final (Linhas 519-556)

Atualizar descrição da arquitetura e comandos de demonstração.

**Linha 521:**
```bash
echo -e "${MAGENTA}           🎉 APP OF APPS DEPLOYMENT COMPLETO!              ${NC}"
```

**Linhas 534-537:**

**Atual:**
```bash
echo -e "${GREEN}${PACKAGE} Arquitetura Modular - 3 Applications Separadas:${NC}"
echo -e "  ${CYAN}1. linktree-dev-database${NC}  (PostgreSQL + CloudNativePG)"
echo -e "  ${CYAN}2. linktree-dev-backend${NC}   (Node.js + Express API)"
echo -e "  ${CYAN}3. linktree-dev-frontend${NC}  (React + Vite SPA)"
```

**Novo:**
```bash
echo -e "${GREEN}${PACKAGE} App of Apps Pattern - 1 Root + 2 Child Apps:${NC}"
echo -e "  ${CYAN}Root:${NC} linktree-dev (cria child apps automaticamente)"
echo -e "  ${CYAN}Child 1:${NC} linktree-dev-infrastructure (PostgreSQL + Monitoring) [wave -1]"
echo -e "  ${CYAN}Child 2:${NC} linktree-dev-app (Backend + Frontend juntos) [wave 0]"
```

**Linhas 542-548 (Demonstrações):**

**Atual:**
```bash
echo -e "  2. Self-healing (backend): ${CYAN}kubectl scale deployment/linktree-dev-backend -n dev --replicas=5${NC}"
echo -e "  3. Rollback (database): ${CYAN}argocd app history linktree-dev-database${NC}"
echo -e "  4. Ver dependency order: ${CYAN}kubectl get apps -n argocd -o custom-columns=NAME:.metadata.name,WAVE:.metadata.annotations.argocd\\.argoproj\\.io/sync-wave${NC}"
echo -e "  5. Delete uma app: ${CYAN}argocd app delete linktree-dev-backend --yes${NC}"
echo -e "  6. Recreate via sync: ${CYAN}argocd app sync linktree-dev --prune${NC}"
```

**Novo:**
```bash
echo -e "  2. Self-healing: ${CYAN}kubectl scale deployment/linktree-dev-backend -n dev --replicas=5${NC}"
echo -e "  3. Ver Root App: ${CYAN}argocd app get linktree-dev${NC}"
echo -e "  4. Ver Child Apps: ${CYAN}argocd app list | grep linktree-dev${NC}"
echo -e "  5. Rollback infrastructure: ${CYAN}argocd app history linktree-dev-infrastructure${NC}"
echo -e "  6. Rollback app: ${CYAN}argocd app history linktree-dev-app${NC}"
echo -e "  7. Ver sync waves: ${CYAN}kubectl get apps -n argocd -o custom-columns=NAME:.metadata.name,WAVE:.metadata.annotations.argocd\\.argoproj\\.io/sync-wave | grep linktree${NC}"
echo -e "  8. Delete child app (root recreia): ${CYAN}argocd app delete linktree-dev-app --yes${NC}"
echo -e "  9. Sync root (recreia child): ${CYAN}argocd app sync linktree-dev${NC}"
```

**Linha 550-552:**

**Atual:**
```bash
echo -e "${BLUE}📚 Ver estrutura modular:${NC}"
echo -e "  ${CYAN}ls -la $REPO_DIR/helm/charts/${NC}"
echo -e "  ${CYAN}ls -la $REPO_DIR/argocd/${NC}"
```

**Novo:**
```bash
echo -e "${BLUE}📚 Ver estrutura App of Apps:${NC}"
echo -e "  ${CYAN}cat $REPO_DIR/argocd/root-apps/dev.yaml${NC}  # Root app"
echo -e "  ${CYAN}ls -la $REPO_DIR/argocd/apps/dev/${NC}  # Child apps"
echo -e "  ${CYAN}ls -la $REPO_DIR/helm/charts-new/${NC}  # New Helm charts"
```

---

## Resumo das Mudanças por Seção

| Seção | Mudança | Complexidade |
|-------|---------|--------------|
| Banner | Atualizar título e descrição | Baixa |
| Cabeçalho | Atualizar descrição do script | Baixa |
| Passo 8 | **Substituir ApplicationSet por Root App** | **Alta** |
| Passo 9 | Sincronizar 2 child apps ao invés de 3 | Média |
| Passo 10 | Descoberta dinâmica de service names | Média |
| Resumo Final | Atualizar arquitetura e demos | Média |

## Riscos e Considerações

### 1. Service Names
**Risco:** Nomes dos services podem não ser exatamente como esperado dependendo dos templates dos subcharts.

**Mitigação:** Usar descoberta dinâmica com labels (adicionada na seção Passo 10).

### 2. Helm Chart Paths
**Risco:** O Root Application aponta para `argocd/apps/dev/` que contém child applications que apontam para `helm/charts-new/`. Se os paths estiverem errados, o deploy falhará.

**Mitigação:** Verificar que os paths nos child apps estão corretos:
- `argocd/apps/dev/infrastructure.yaml` deve apontar para `helm/charts-new/infrastructure`
- `argocd/apps/dev/linktree.yaml` deve apontar para `helm/charts-new/linktree`

### 3. Dependency do Helm
**Risco:** Os charts em `helm/charts-new/linktree/` e `helm/charts-new/infrastructure/` usam subcharts. É necessário rodar `helm dependency build` antes do deploy.

**Mitigação:** Adicionar step no script para fazer dependency build:

```bash
print_info "Building Helm dependencies..."
cd "$REPO_DIR/helm/charts-new/infrastructure"
helm dependency build || print_warning "Falha ao build dependencies de infrastructure"

cd "$REPO_DIR/helm/charts-new/linktree"
helm dependency build || print_warning "Falha ao build dependencies de linktree"
```

**Onde adicionar:** Antes do Passo 8, criar um novo **"PASSO 7.5: Preparar Helm Charts"**.

### 4. Sync Wave Order
**Risco:** Se as sync waves não estiverem configuradas corretamente, o backend pode tentar conectar ao database antes dele estar pronto.

**Mitigação:** Garantir que:
- `argocd/apps/dev/infrastructure.yaml` tem annotation `argocd.argoproj.io/sync-wave: "-1"`
- `argocd/apps/dev/linktree.yaml` tem annotation `argocd.argoproj.io/sync-wave: "0"`
- Adicionar delay no script entre infrastructure e app sync

### 5. Local File Path para Repo URL
**Risco:** O script usa `file://$REPO_DIR` para demonstração local, mas isso não funciona em produção.

**Mitigação:** Documentar no script que em produção deve-se substituir por:
```yaml
repoURL: https://github.com/periclesanfe/linktree-app.git
```

Adicionar comentário no script:
```bash
# NOTA: Para produção, substitua file://$REPO_DIR por:
# repoURL: https://github.com/periclesanfe/linktree-app.git
```

## Novo Passo a Adicionar

### PASSO 7.5: Preparar Helm Charts (Adicionar entre Passo 7 e 8)

```bash
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
    helm dependency build || print_warning "Falha ao build dependencies de infrastructure (pode ser normal se não houver deps)"
    print_success "Infrastructure chart pronto"
else
    print_error "Chart.yaml não encontrado em helm/charts-new/infrastructure"
    exit 1
fi

# Linktree chart
print_info "Building linktree chart..."
cd "$REPO_DIR/helm/charts-new/linktree"
if [ -f "Chart.yaml" ]; then
    helm dependency build || print_warning "Falha ao build dependencies de linktree (pode ser normal se não houver deps)"
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
```

## Ordem de Implementação Recomendada

1. **Criar backup do script atual:**
   ```bash
   cp scripts/apresentacao.sh scripts/apresentacao-tier-separated.sh.bak
   ```

2. **Implementar mudanças na ordem:**
   1. Banner e cabeçalho (linhas 3-5, 66-76) - Baixa complexidade
   2. Adicionar Passo 7.5 (Helm dependency build) - Média complexidade
   3. Modificar Passo 8 (Root App ao invés de ApplicationSet) - **Alta complexidade**
   4. Modificar Passo 9 (2 child apps ao invés de 3) - Média complexidade
   5. Modificar Passo 10 (descoberta dinâmica de services) - Média complexidade
   6. Atualizar Resumo Final - Baixa complexidade

3. **Testar:**
   - Rodar script completo em ambiente local
   - Verificar se Root App cria Child Apps corretamente
   - Verificar sync waves (infrastructure antes de app)
   - Verificar port-forwards funcionam
   - Verificar backend consegue conectar ao database

4. **Documentar:**
   - Atualizar comentários no script
   - Adicionar notas sobre diferenças entre local (file://) e produção (https://)

## Comandos de Teste Pós-Implementação

```bash
# Verificar Root App
argocd app get linktree-dev

# Verificar Child Apps foram criadas
argocd app list | grep linktree-dev
# Deve mostrar:
# - linktree-dev (root)
# - linktree-dev-infrastructure
# - linktree-dev-app

# Verificar sync waves
kubectl get applications -n argocd -o custom-columns=NAME:.metadata.name,WAVE:.metadata.annotations.argocd\\.argoproj\\.io/sync-wave | grep linktree

# Verificar services
kubectl get svc -n dev

# Verificar pods
kubectl get pods -n dev

# Testar backend
curl http://localhost:8000/api/health

# Testar frontend
curl http://localhost:5173
```

## Conclusão

Esta refatoração transforma o script de uma arquitetura **tier-separated** (6 apps: 3 por ambiente) para **App of Apps** (1 root app → 2 child apps por ambiente).

**Benefícios:**
- ✅ Segue best practices da indústria
- ✅ Mais simples de gerenciar (deploy 1 root app ao invés de 6 apps)
- ✅ Melhor separação (infrastructure vs application)
- ✅ Lifecycle correto (backend + frontend juntos)
- ✅ Demonstra padrão usado por 90%+ das empresas

**Complexidade:** Média-Alta
**Tempo estimado:** 2-3 horas (implementação + testes)
**Risco:** Baixo (mantendo backup do script antigo)
