# Linktree Helm Chart

Este Helm Chart implanta a aplicação Linktree em um cluster Kubernetes.

## Estrutura

```
helm/
├── Chart.yaml                      # Metadados do chart
├── values.yaml                     # Valores padrão
├── values.dev.yaml                 # Valores para ambiente de desenvolvimento
├── values.prod.yaml                # Valores para ambiente de produção
├── .helmignore                     # Arquivos a serem ignorados
├── templates/                      # Templates Kubernetes
│   ├── _helpers.tpl               # Funções auxiliares
│   ├── backend-configmap.yaml     # ConfigMap do backend
│   ├── backend-deployment.yaml    # Deployment do backend
│   ├── backend-service.yaml       # Service do backend
│   ├── frontend-configmap.yaml    # ConfigMap do frontend
│   ├── frontend-deployment.yaml   # Deployment do frontend
│   ├── frontend-service.yaml      # Service do frontend
│   ├── secret.yaml                # Secret com credenciais do DB
│   ├── db-migration-job.yaml      # Job de migração do banco
│   └── ingress.yaml               # Ingress (opcional)
```

## Componentes

### Backend
- **Deployment**: API Node.js/Express
- **Service**: ClusterIP expondo porta 8000
- **ConfigMap**: Variáveis de ambiente não-sensíveis
- **Replicas**: 1 (dev) / 3 (prod)

### Frontend
- **Deployment**: Aplicação React servida pelo nginx
- **Service**: ClusterIP expondo porta 80
- **ConfigMap**: URL da API
- **Replicas**: 1 (dev) / 3 (prod)

### Database
- **Migration Job**: Job executado antes do deployment (ArgoCD Sync Wave -1)
- **Secret**: Credenciais do PostgreSQL
- **Conexão**: Usa operador CloudNativePG (externo ao chart)

### Ingress
- **Roteamento**: / → Frontend, /api → Backend
- **TLS**: Suporte a certificados SSL (prod)
- **Annotations**: Configurável por ambiente

## Instalação

### Pré-requisitos
- Kubernetes 1.24+
- Helm 3.8+
- PostgreSQL (via CloudNativePG operator)

### Desenvolvimento

```bash
# Instalar no namespace dev
helm install linktree-dev ./helm -f ./helm/values.dev.yaml -n dev --create-namespace

# Upgrade
helm upgrade linktree-dev ./helm -f ./helm/values.dev.yaml -n dev

# Desinstalar
helm uninstall linktree-dev -n dev
```

### Produção

```bash
# Instalar no namespace prod
helm install linktree-prod ./helm -f ./helm/values.prod.yaml -n prod --create-namespace

# Upgrade
helm upgrade linktree-prod ./helm -f ./helm/values.prod.yaml -n prod

# Desinstalar
helm uninstall linktree-prod -n prod
```

## Configuração

### Valores Principais

| Parâmetro | Descrição | Padrão |
|-----------|-----------|--------|
| `environment` | Ambiente (dev/prod) | `production` |
| `backend.replicaCount` | Número de réplicas do backend | `2` |
| `backend.image.repository` | Repositório da imagem | `ghcr.io/periclesanfe/linktree-backend` |
| `backend.image.tag` | Tag da imagem | `""` (usa appVersion) |
| `frontend.replicaCount` | Número de réplicas do frontend | `2` |
| `frontend.image.repository` | Repositório da imagem | `ghcr.io/periclesanfe/linktree-frontend` |
| `frontend.apiUrl` | URL da API para o frontend | `http://localhost:8000` |
| `database.host` | Host do PostgreSQL | `linktree-postgresql` |
| `database.database` | Nome do banco de dados | `linktree_db` |
| `database.user` | Usuário do banco | `linktree_user` |
| `database.password` | Senha do banco | `CHANGE_ME` |
| `ingress.enabled` | Habilitar Ingress | `false` |
| `ingress.hosts` | Hosts do Ingress | `[linktree.example.com]` |

### Secrets

⚠️ **IMPORTANTE**: Nunca commite senhas em arquivos values. Use uma das opções:

1. **ArgoCD + Sealed Secrets**: Criptografe secrets antes de commitar
2. **External Secrets Operator**: Integre com vault/AWS Secrets Manager
3. **Override no deploy**: Passe valores via `--set` ou `-f values-secret.yaml` (gitignored)

```bash
# Exemplo: Override de senha no deploy
helm install linktree ./helm -f values.prod.yaml --set database.password=SECURE_PASSWORD
```

## ArgoCD Integration

Este chart foi projetado para funcionar com GitOps via ArgoCD:

### Sync Waves

- **Wave -1**: Job de migração do banco (`db-migration-job.yaml`)
- **Wave 0**: Deployments e Services (padrão)

### Hooks

O Job de migração usa:
- `argocd.argoproj.io/hook: PreSync` - Executa antes do sync
- `argocd.argoproj.io/hook-delete-policy: HookSucceeded` - Remove após sucesso

### Application Manifest (ArgoCD)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: linktree-prod
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/periclesanfe/linktree
    targetRevision: main
    path: helm
    helm:
      valueFiles:
        - values.prod.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: prod
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

## CI/CD Pipeline

O GitHub Actions deve:

1. Build da imagem Docker
2. Push para `ghcr.io` com tag do commit SHA
3. Atualizar `values.prod.yaml` no repositório GitOps
4. ArgoCD detecta mudança e faz deploy automático

Exemplo de atualização via pipeline:

```bash
# Atualizar image tag no values.prod.yaml
yq eval '.backend.image.tag = "sha-abc123"' -i helm/values.prod.yaml
git add helm/values.prod.yaml
git commit -m "chore: update backend image to sha-abc123 [skip ci]"
git push
```

## Validação

```bash
# Lint do chart
helm lint ./helm

# Dry-run para ver os manifests gerados
helm install linktree-test ./helm -f ./helm/values.dev.yaml --dry-run --debug

# Template (só renderiza sem instalar)
helm template linktree ./helm -f ./helm/values.prod.yaml

# Validar contra cluster
helm install linktree-test ./helm --dry-run --debug -f ./helm/values.dev.yaml
```

## Troubleshooting

### Verificar status

```bash
# Listar releases
helm list -n prod

# Ver histórico
helm history linktree-prod -n prod

# Rollback para versão anterior
helm rollback linktree-prod 1 -n prod
```

### Logs

```bash
# Logs do backend
kubectl logs -n prod -l app.kubernetes.io/component=backend --tail=100

# Logs do frontend
kubectl logs -n prod -l app.kubernetes.io/component=frontend --tail=100

# Logs do job de migração
kubectl logs -n prod -l app.kubernetes.io/component=db-migration
```

### Debug

```bash
# Describe de recursos
kubectl describe deployment -n prod linktree-prod-backend
kubectl describe pod -n prod -l app.kubernetes.io/component=backend

# Events
kubectl get events -n prod --sort-by='.lastTimestamp'

# Secrets (verificar se foram criados)
kubectl get secrets -n prod
kubectl describe secret linktree-prod-db-secret -n prod
```

## Próximos Passos

1. ✅ Helm Chart criado
2. ⏳ Criar repositório GitOps (`argocd-gitops`)
3. ⏳ Configurar operador PostgreSQL (CloudNativePG)
4. ⏳ Atualizar GitHub Actions para GHCR e GitOps
5. ⏳ Configurar ArgoCD Applications
6. ⏳ Implementar Sealed Secrets ou External Secrets

## Recursos Adicionais

- [Helm Best Practices](https://helm.sh/docs/chart_best_practices/)
- [ArgoCD Sync Waves](https://argo-cd.readthedocs.io/en/stable/user-guide/sync-waves/)
- [CloudNativePG](https://cloudnative-pg.io/)
