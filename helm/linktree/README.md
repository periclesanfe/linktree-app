# Linktree Backend - Helm Chart Simplificado

Helm chart simplificado para deploy do Linktree Backend com Argo Rollouts e PostgreSQL (CloudNativePG), demonstrando estratégias **BlueGreen** (DEV) e **Canary** (PROD).

## Estrutura

```
helm/linktree/
├── Chart.yaml                    # Chart principal com dependency PostgreSQL
├── values.yaml                   # Configuração PROD (Canary)
├── values-dev.yaml               # Configuração DEV (BlueGreen)
├── charts/
│   └── postgresql/               # Subchart CloudNativePG
│       ├── Chart.yaml
│       ├── values.yaml
│       ├── values.dev.yaml
│       ├── values.prod.yaml
│       └── templates/
│           ├── cluster.yaml      # PostgreSQL Cluster (CNPG)
│           ├── secret.yaml       # Secret com DB_USER, DB_PASSWORD, JWT_SECRET
│           └── persistent-volume.yaml
└── templates/
    ├── _helpers.tpl
    ├── rollout.yaml              # Rollout único com estratégias condicionais
    ├── service.yaml              # Service principal
    ├── service-preview.yaml      # Service preview (somente DEV)
    ├── service-canary.yaml       # Service canary (somente PROD)
    ├── configmap.yaml
    └── secret.yaml
```

## Pré-requisitos

1. **Kubernetes cluster** funcionando
2. **CloudNativePG Operator** instalado:
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.22/releases/cnpg-1.22.0.yaml
   ```
3. **Argo Rollouts** instalado:
   ```bash
   kubectl create namespace argo-rollouts
   kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
   ```
4. **ArgoCD** instalado (opcional, mas recomendado)

## ⚠️ IMPORTANTE: PostgreSQL via Subchart

O PostgreSQL é instalado **automaticamente** como subchart dependency. Você **NÃO** precisa criar secret manualmente, pois o subchart já cria o secret `linktree-secrets` com:
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`
- `username` (para CloudNativePG)
- `password` (para CloudNativePG)

### Credenciais Padrão

**DEV** (definidas em `values-dev.yaml`):
```yaml
postgresql:
  credentials:
    secretName: linktree-secrets
    username: linktree_dev_user
    password: dev_password_123
    jwtSecret: dev_jwt_secret_change_me
```

**PROD** (definidas em `values.yaml`):
```yaml
postgresql:
  credentials:
    secretName: linktree-secrets
    username: linktree_prod_user
    password: prod_password_change_me
    jwtSecret: prod_jwt_secret_change_me
```

⚠️ **PROD**: Altere as senhas em `values.yaml` antes do deploy em produção!

## Deploy Manual (Helm)

### Preparação
```bash
# Atualizar dependencies
cd /path/to/linktree
helm dependency update helm/linktree/
```

### DEV (BlueGreen + PostgreSQL)
```bash
helm install linktree-backend-dev helm/linktree/ \
  -f helm/linktree/values-dev.yaml \
  -n dev \
  --create-namespace
```

### PROD (Canary + PostgreSQL)
```bash
helm install linktree-backend-prod helm/linktree/ \
  -f helm/linktree/values.yaml \
  -n prod \
  --create-namespace
```

## Deploy via ArgoCD (Recomendado)

### 1. Aplicar as Applications do ArgoCD
```bash
kubectl apply -f argocd-apps/backend-dev.yaml
kubectl apply -f argocd-apps/backend-prod.yaml
```

### 2. Verificar sincronização
```bash
kubectl get applications -n argocd
kubectl get pods -n dev
kubectl get pods -n prod
```

### 3. Verificar PostgreSQL Cluster
```bash
# DEV
kubectl get cluster -n dev
kubectl get pods -n dev | grep postgresql

# PROD
kubectl get cluster -n prod
kubectl get pods -n prod | grep postgresql
```

## Testando BlueGreen (DEV)

### 1. Deploy inicial
```bash
# Verificar rollout
kubectl argo rollouts get rollout linktree-backend-dev -n dev --watch
```

### 2. Atualizar imagem para testar nova versão
Editar `argocd-apps/backend-dev.yaml` e alterar `image.tag`:
```yaml
- name: image.tag
  value: "NEW_TAG"
```

Aplicar:
```bash
kubectl apply -f argocd-apps/backend-dev.yaml
```

### 3. Verificar preview service
```bash
# Service preview criado automaticamente
kubectl get svc -n dev

# Port-forward para testar preview
kubectl port-forward svc/linktree-backend-dev-preview 8080:8000 -n dev
curl http://localhost:8080/api/health
```

### 4. Promover manualmente
```bash
# Após validar a versão preview
kubectl argo rollouts promote linktree-backend-dev -n dev
```

### 5. Monitorar transição
```bash
kubectl argo rollouts get rollout linktree-backend-dev -n dev --watch
```

## Testando Canary (PROD)

### 1. Deploy inicial
```bash
# Verificar rollout
kubectl argo rollouts get rollout linktree-backend-prod -n prod --watch
```

### 2. Atualizar imagem para testar canary
Editar `argocd-apps/backend-prod.yaml` e alterar `image.tag`:
```yaml
- name: image.tag
  value: "NEW_TAG"
```

Aplicar:
```bash
kubectl apply -f argocd-apps/backend-prod.yaml
```

### 3. Acompanhar progressão automática
```bash
kubectl argo rollouts get rollout linktree-backend-prod -n prod --watch
```

O rollout seguirá automaticamente:
- **20%** de tráfego → Pausa manual (você precisa promover)
- **40%** de tráfego → Pausa 30s automática
- **60%** de tráfego → Pausa 30s automática
- **80%** de tráfego → Pausa 30s automática
- **100%** de tráfego → Completo

### 4. Promover na primeira pausa (20%)
```bash
kubectl argo rollouts promote linktree-backend-prod -n prod
```

### 5. Testar canary service
```bash
# Service canary disponível durante rollout
kubectl get svc -n prod

# Port-forward para testar canary
kubectl port-forward svc/linktree-backend-prod-canary 8081:8000 -n prod
curl http://localhost:8081/api/health
```

### 6. Rollback (se necessário)
```bash
kubectl argo rollouts abort linktree-backend-prod -n prod
kubectl argo rollouts undo linktree-backend-prod -n prod
```

## Comandos Úteis

### Verificar status do Rollout
```bash
kubectl argo rollouts get rollout <nome> -n <namespace>
```

### Histórico de revisões
```bash
kubectl argo rollouts history linktree-backend-dev -n dev
```

### Dashboard do Argo Rollouts
```bash
kubectl argo rollouts dashboard
```
Acesse: http://localhost:3100

### Logs da aplicação
```bash
kubectl logs -f deployment/linktree-backend-dev -n dev
```

### Describe do Rollout
```bash
kubectl describe rollout linktree-backend-dev -n dev
```

## Diferenças entre Estratégias

| Aspecto | BlueGreen (DEV) | Canary (PROD) |
|---------|-----------------|---------------|
| Promoção | Manual | Manual primeira pausa, depois automático |
| Tráfego | 0% ou 100% | Progressivo: 20→40→60→80→100% |
| Services | active + preview | stable + canary |
| Rollback | Instantâneo | Rápido, mas precisa abortar |
| Uso | Validação em DEV | Produção com baixo risco |

## Comparação com Estrutura Antiga

### Antes (Complexo)
- ✗ 18 arquivos de templates
- ✗ Backend + Frontend misturados
- ✗ Deployment + Rollout separados
- ✗ HPA, PDB, Ingress, múltiplos services
- ✗ Repositório ArgoCD separado
- ✗ Configuração espalhada em múltiplos values files

### Depois (Simplificado)
- ✓ 7 arquivos de templates
- ✓ Somente Backend
- ✓ Apenas Rollout (sem Deployment)
- ✓ Services mínimos (active/stable + preview/canary)
- ✓ ArgoCD apps no mesmo repositório
- ✓ Configuração centralizada: values.yaml + values-dev.yaml

## Troubleshooting

### Rollout stuck em "Paused"
```bash
# Verificar se precisa promoção manual
kubectl argo rollouts promote <nome> -n <namespace>
```

### Pods não inicializando
```bash
# Verificar logs
kubectl logs -f <pod-name> -n <namespace>

# Verificar eventos
kubectl get events -n <namespace> --sort-by='.lastTimestamp'
```

### Secret não encontrado
```bash
# Verificar se secret existe
kubectl get secret linktree-secrets -n <namespace>

# Criar secret se necessário (veja seção "Configuração de Secrets")
```

### Database connection failed
```bash
# Verificar se PostgreSQL está rodando
kubectl get pods -n postgres-<env>

# Testar conectividade do pod
kubectl exec -it <pod-name> -n <namespace> -- sh
nc -zv $DB_HOST $DB_PORT
```

## Próximos Passos

1. **Configurar PostgreSQL** usando CloudNativePG
2. **Adicionar métricas** (Prometheus) para análise automatizada
3. **Configurar Ingress** para roteamento externo
4. **Implementar CI/CD** para atualização automática de image.tag
5. **Adicionar testes de smoke** durante rollouts

## Referências

- [Argo Rollouts Documentation](https://argoproj.github.io/argo-rollouts/)
- [BlueGreen Strategy](https://argoproj.github.io/argo-rollouts/features/bluegreen/)
- [Canary Strategy](https://argoproj.github.io/argo-rollouts/features/canary/)
