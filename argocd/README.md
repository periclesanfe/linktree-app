# 🔄 ArgoCD Applications - Linktree

Esta pasta contém os manifestos do ArgoCD para deploy automatizado da aplicação Linktree.

## 📁 Estrutura

```
argocd/
├── root-apps/                     # Root Applications
│   ├── dev.yaml                  # Root app para DEV
│   └── prod.yaml                 # Root app para PROD
│
└── apps/                         # Child Applications
    ├── dev/
    │   └── linktree.yaml        # Aplicação completa (Backend + Frontend)
    └── prod/
        └── linktree.yaml        # Aplicação completa (Backend + Frontend)
```

## 🎯 Arquitetura Atual

### Componentes Gerenciados

**ArgoCD gerencia:**
- ✅ Backend (Node.js + Express)
- ✅ Frontend (React + Vite + Nginx)
- ✅ Services (ClusterIP + LoadBalancer)
- ✅ ConfigMaps e Secrets da aplicação

**Não gerenciado pelo ArgoCD:**
- ❌ PostgreSQL (criado diretamente pelo script `apresentacao.sh` usando CloudNativePG operator)
- ❌ Database migrations (executadas manualmente via kubectl exec)

### Fluxo de Deploy

```
1. Script apresentacao.sh
   └── Cria PostgreSQL Cluster (CloudNativePG)
   └── Executa migrations SQL
   └── Cria Root ArgoCD Application

2. ArgoCD Root App (linktree-dev)
   └── Monitora argocd/apps/dev/linktree.yaml
   └── Cria Child Application

3. ArgoCD Child App (linktree-dev)
   └── Deploy Backend Deployment + Service
   └── Deploy Frontend Deployment + Service
```

## 🚀 Como Usar

### Opção 1: Deploy Automático (Recomendado)

```bash
# O script apresentacao.sh cria tudo automaticamente:
# - PostgreSQL Cluster
# - Database migrations
# - ArgoCD root application
./scripts/apresentacao.sh
```

### Opção 2: Deploy Manual

**1. Criar PostgreSQL (pré-requisito):**

```bash
# Criar secret com credenciais
kubectl create secret generic linktree-dev-postgres-credentials -n dev \
  --from-literal=username=linktree_dev_user \
  --from-literal=password=dev_password_123

# Criar cluster PostgreSQL
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

# Aguardar cluster ficar pronto
kubectl wait --for=condition=ready cluster/linktree-dev-postgresql -n dev --timeout=300s
```

**2. Executar migrations:**

```bash
# Conectar ao PostgreSQL e executar migrations SQL
kubectl exec -it linktree-dev-postgresql-1 -n dev -- psql -U postgres -d linktree_db

# Cole o SQL das migrations aqui
# (Ver helm/charts-new/linktree/charts/backend/templates/job-migration.yaml)
```

**3. Deploy Root ArgoCD Application:**

```bash
# Dev
kubectl apply -f argocd/root-apps/dev.yaml

# Prod
kubectl apply -f argocd/root-apps/prod.yaml
```

## 📊 Verificar Status

```bash
# Listar applications
argocd app list

# Ver detalhes da aplicação
argocd app get linktree-dev

# Ver recursos criados
kubectl get all -n dev

# Acompanhar sync em tempo real
watch argocd app get linktree-dev
```

## 🔄 Sincronização

### Automática (Padrão)

As applications estão configuradas com `syncPolicy.automated`:
- **Auto-sync:** Mudanças no Git são aplicadas automaticamente
- **Self-heal:** Mudanças manuais no cluster são revertidas
- **Prune:** Recursos removidos do Git são deletados do cluster

### Manual

```bash
# Forçar sync manual
argocd app sync linktree-dev

# Sync com opções
argocd app sync linktree-dev --prune --force

# Refresh (re-check Git)
argocd app get linktree-dev --refresh
```

## 🔧 Troubleshooting

### Application não sincronizou

```bash
# Ver logs do ArgoCD
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller --tail=50

# Ver detalhes do erro
argocd app get linktree-dev

# Force refresh
argocd app get linktree-dev --refresh
argocd app sync linktree-dev
```

### Recursos não foram criados

```bash
# Ver eventos do namespace
kubectl get events -n dev --sort-by='.lastTimestamp'

# Verificar se a aplicação está healthy
argocd app get linktree-dev

# Verificar se o PostgreSQL está rodando (pré-requisito)
kubectl get cluster -n dev
kubectl get pods -n dev | grep postgresql
```

### Backend não conecta ao PostgreSQL

```bash
# Verificar se o serviço PostgreSQL existe
kubectl get svc -n dev | grep postgresql

# Serviço esperado:
# linktree-dev-postgresql-rw   ClusterIP   10.x.x.x   5432/TCP

# Verificar logs do backend
kubectl logs -n dev -l app.kubernetes.io/name=linktree-backend --tail=50

# Verificar variáveis de ambiente do backend
kubectl get deployment linktree-dev-backend -n dev -o yaml | grep -A 20 "env:"
```

## 🗑️ Limpeza

### Deletar aplicação (mantém PostgreSQL)

```bash
# Deletar root app (deleta child apps automaticamente)
kubectl delete application linktree-dev -n argocd

# Ou via ArgoCD CLI
argocd app delete linktree-dev --cascade
```

### Limpeza completa (incluindo PostgreSQL)

```bash
# Usar script de limpeza
./scripts/cleanup.sh

# Ou manual:
kubectl delete application linktree-dev -n argocd
kubectl delete cluster linktree-dev-postgresql -n dev
kubectl delete secret linktree-dev-postgres-credentials -n dev
kubectl delete namespace dev
```

## 📝 Customização

### Alterar configurações

**Dev:**
```bash
vim helm/charts-new/linktree/values.dev.yaml
```

**Prod:**
```bash
vim helm/charts-new/linktree/values.prod.yaml
```

Após alterar, commit e push. O ArgoCD sincronizará automaticamente em até 3 minutos.

### Forçar sincronização imediata

```bash
argocd app sync linktree-dev
```

## 🎯 GitOps Workflow

```
1. Developer
   └── git commit + push

2. GitHub Actions
   └── Build Docker images
   └── Push to ghcr.io
   └── Update GitOps repo with new image tags

3. ArgoCD (auto-detect em até 3min)
   └── Detecta mudança no Git
   └── Aplica mudanças no Kubernetes
   └── Rolling update dos pods

4. Kubernetes
   └── Pods atualizados com nova versão
```

## 📚 Referências

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [CloudNativePG Documentation](https://cloudnative-pg.io/)
- [Helm Documentation](https://helm.sh/docs/)

---

**Arquitetura:** GitOps com ArgoCD + CloudNativePG
**Ambiente:** Minikube (local) ou qualquer cluster Kubernetes
