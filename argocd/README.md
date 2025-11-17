# 🔄 ArgoCD Applications - Linktree (App of Apps Pattern)

Esta pasta contém os manifestos do ArgoCD usando o padrão **App of Apps**, considerado a melhor prática da indústria para gerenciar múltiplas aplicações.

## 📁 Estrutura

```
argocd/
├── root-apps/                     # Root Applications (ponto de entrada)
│   ├── dev.yaml                  # Root app para DEV (cria 2 child apps)
│   └── prod.yaml                 # Root app para PROD (cria 2 child apps)
│
├── apps/                         # Child Applications (criadas automaticamente)
│   ├── dev/
│   │   ├── infrastructure.yaml  # Database + Monitoring (sync wave -1)
│   │   └── linktree.yaml        # Backend + Frontend (sync wave 0)
│   └── prod/
│       ├── infrastructure.yaml  # Database + Monitoring (sync wave -1)
│       └── linktree.yaml        # Backend + Frontend (sync wave 0)
│
└── old-tier-separated-apps/     # Arquitetura antiga (deprecated)
    └── README.md                # Explicação da migração
```

## 🎯 App of Apps Pattern

### O que é?

O App of Apps é o padrão recomendado pelo ArgoCD onde:
- Uma **Root Application** gerencia múltiplas **Child Applications**
- Você deploya UMA aplicação e o ArgoCD cria TODAS as outras automaticamente
- Agrupa aplicações por **propósito e lifecycle**, não por camada técnica

### Por que é a melhor prática?

✅ **Separation of Concerns**: Infraestrutura (database) vs Aplicação (backend + frontend)
✅ **Lifecycle Alignment**: Componentes com mesmo ciclo de vida ficam juntos
✅ **Simpler Management**: Deploy de uma root app cria tudo automaticamente
✅ **Industry Standard**: Padrão usado por 90%+ das organizações com ArgoCD
✅ **Better Scalability**: Adicionar novos ambientes é trivial

### Arquitetura

```
Root App: linktree-dev
├── Child App 1: linktree-dev-infrastructure (sync wave -1)
│   ├── PostgreSQL Cluster (CloudNativePG)
│   ├── Database Migration Job
│   └── Monitoring (PodMonitor)
│
└── Child App 2: linktree-dev-app (sync wave 0)
    ├── Backend (Node.js API)
    └── Frontend (React SPA)
```

## 🚀 Deploy

### Deploy Ambiente Dev (Recomendado)

```bash
# Cria a root application que automaticamente cria 2 child apps
kubectl apply -f argocd/root-apps/dev.yaml

# Verifica as aplicações criadas
argocd app list | grep linktree-dev
# Você verá:
# - linktree-dev (root)
# - linktree-dev-infrastructure (child)
# - linktree-dev-app (child)
```

### Deploy Ambiente Prod

```bash
# Cria a root application para produção
kubectl apply -f argocd/root-apps/prod.yaml

# Verifica as aplicações criadas
argocd app list | grep linktree-prod
# Você verá:
# - linktree-prod (root)
# - linktree-prod-infrastructure (child)
# - linktree-prod-app (child)
```

### Deploy Manual das Child Apps (Para Testing)

Se quiser deployar as child apps diretamente (sem root app):

```bash
# Dev
kubectl apply -f argocd/apps/dev/infrastructure.yaml
kubectl apply -f argocd/apps/dev/linktree.yaml

# Prod
kubectl apply -f argocd/apps/prod/infrastructure.yaml
kubectl apply -f argocd/apps/prod/linktree.yaml
```

## 🔍 Monitoramento

```bash
# Listar todas as applications
argocd app list

# Ver detalhes da root app
argocd app get linktree-dev

# Ver detalhes de uma child app
argocd app get linktree-dev-infrastructure
argocd app get linktree-dev-app

# Ver sincronização em tempo real
argocd app sync linktree-dev --watch

# Ver status de todas as apps
kubectl get applications -n argocd
```

## 🎯 Sync Waves e Ordem de Deploy

As aplicações são deployadas em ordem usando sync waves:

| Wave | Componente              | Conteúdo                                    |
|------|-------------------------|---------------------------------------------|
| `-1` | infrastructure          | PostgreSQL Cluster + Monitoring             |
| `0`  | linktree (backend)      | Node.js API (depende do database)           |
| `0`  | linktree (frontend)     | React SPA (depende do backend)              |

**Como funciona:**
1. ArgoCD deploya infrastructure primeiro (wave -1)
2. Aguarda infrastructure ficar Healthy
3. Deploya linktree app (wave 0) que inclui backend e frontend juntos
4. Backend e frontend são deployados em paralelo mas backend inicia primeiro

## 🔄 Sync Policy

Todas as aplicações têm **automated sync** ativado:

- ✅ **prune**: Remove recursos deletados do Git
- ✅ **selfHeal**: Reverte alterações manuais no cluster (apenas em prod)
- ✅ **retry**: Tenta novamente em caso de falha (backoff exponencial)

### Diferenças Dev vs Prod

**Dev:**
```yaml
syncPolicy:
  automated:
    prune: true
    selfHeal: false  # Permite experimentos manuais no cluster
```

**Prod:**
```yaml
syncPolicy:
  automated:
    prune: true
    selfHeal: true   # Garante que cluster sempre reflete Git
```

## 🏗️ Evolução da Arquitetura

### Arquitetura Antiga (Tier-Separated) ❌

```
ArgoCD
  ├── linktree-dev-database (Application)   # Separado por camada técnica
  ├── linktree-dev-backend (Application)    # Anti-pattern
  ├── linktree-dev-frontend (Application)   # Muita granularidade
  ├── linktree-prod-database (Application)
  ├── linktree-prod-backend (Application)
  └── linktree-prod-frontend (Application)
```

**Problemas:**
- 6 aplicações separadas (3 por ambiente)
- Separação por camada técnica (database/backend/frontend)
- Backend e frontend têm lifecycles diferentes mas são do mesmo produto
- Complexidade desnecessária

### Arquitetura Atual (App of Apps) ✅

```
ArgoCD
  ├── linktree-dev (Root App)
  │   ├── linktree-dev-infrastructure (Child App)
  │   │     └── PostgreSQL + Monitoring
  │   └── linktree-dev-app (Child App)
  │         ├── Backend
  │         └── Frontend
  │
  └── linktree-prod (Root App)
      ├── linktree-prod-infrastructure (Child App)
      │     └── PostgreSQL + Monitoring
      └── linktree-prod-app (Child App)
            ├── Backend
            └── Frontend
```

**Benefícios:**
- 2 child apps por ambiente (infrastructure + application)
- Separação por propósito e lifecycle
- Backend e frontend juntos (são o mesmo produto)
- Padrão da indústria DevOps

## ✅ Benefícios da Nova Arquitetura

1. **Industry Standard**: App of Apps é usado por 90%+ das empresas com ArgoCD
2. **Proper Separation**: Infrastructure vs Application, não por camada técnica
3. **Lifecycle Alignment**: Backend e frontend deployados juntos (mesmo produto)
4. **Simpler Management**: Deploy 1 root app → cria 2 child apps automaticamente
5. **Better Dependency Management**: Sync waves controlam ordem entre apps
6. **Scalability**: Adicionar staging = criar apenas 1 novo root app
7. **RBAC Simplificado**: Permissões por ambiente (dev/prod), não por tier

## 🔐 Secrets Necessários

### Dev Environment

```bash
# Namespace
kubectl create namespace dev

# PostgreSQL credentials
kubectl create secret generic linktree-dev-postgres-credentials -n dev \
  --from-literal=username=linktree_dev_user \
  --from-literal=password=dev_password_123

# JWT secret
kubectl create secret generic linktree-secrets -n dev \
  --from-literal=JWT_SECRET=$(openssl rand -base64 32)
```

### Prod Environment

```bash
# Namespace
kubectl create namespace prod

# PostgreSQL credentials (use senhas fortes em produção!)
kubectl create secret generic linktree-prod-postgres-credentials -n prod \
  --from-literal=username=linktree_prod_user \
  --from-literal=password=$(openssl rand -base64 32)

# JWT secret
kubectl create secret generic linktree-prod-secrets -n prod \
  --from-literal=JWT_SECRET=$(openssl rand -base64 32)
```

## 📝 Customização

Para customizar uma aplicação, edite os values do Helm chart correspondente:

```bash
# Editar infrastructure (database)
vim helm/charts-new/infrastructure/values.dev.yaml

# Editar aplicação (backend + frontend)
vim helm/charts-new/linktree/values.dev.yaml

# Customizar apenas backend
vim helm/charts-new/linktree/charts/backend/values.yaml

# Commit e push
git add .
git commit -m "feat: increase backend replicas to 3"
git push

# ArgoCD detecta e sincroniza automaticamente em ~3 minutos
```

## 🔄 Rollback

```bash
# Rollback de toda a aplicação (backend + frontend)
argocd app rollback linktree-dev-app

# Rollback apenas da infrastructure
argocd app rollback linktree-dev-infrastructure

# Rollback para revisão específica
argocd app rollback linktree-dev-app 5

# Ver histórico de revisões
argocd app history linktree-dev-app
```

## 🧪 Testing Workflow

Para testar mudanças antes de aplicar em produção:

```bash
# 1. Deploy dev
kubectl apply -f argocd/root-apps/dev.yaml

# 2. Teste suas mudanças em dev
curl http://linktree-dev.local/health

# 3. Se OK, aplica em prod
kubectl apply -f argocd/root-apps/prod.yaml
```

## 🧹 Cleanup

```bash
# Deletar ambiente dev completo (root app deleta child apps automaticamente)
kubectl delete -f argocd/root-apps/dev.yaml

# Deletar ambiente prod completo
kubectl delete -f argocd/root-apps/prod.yaml

# Deletar apenas uma child app específica
kubectl delete application linktree-dev-infrastructure -n argocd
```

## 📚 Referências

- [ArgoCD App of Apps Pattern](https://argo-cd.readthedocs.io/en/stable/operator-manual/cluster-bootstrapping/)
- [Helm Charts na estrutura charts-new/](../helm/charts-new/)
- [Arquitetura antiga (deprecated)](./old-tier-separated-apps/README.md)

## 🔀 Migração da Arquitetura Antiga

Se você está migrando da arquitetura tier-separated:

1. Os arquivos antigos estão em `argocd/old-tier-separated-apps/`
2. Leia o README naquele diretório para entender as mudanças
3. Delete as applications antigas antes de criar as novas:
   ```bash
   kubectl delete -f argocd/old-tier-separated-apps/dev/
   kubectl delete -f argocd/old-tier-separated-apps/prod/
   ```
4. Aplique a nova estrutura:
   ```bash
   kubectl apply -f argocd/root-apps/dev.yaml
   ```
