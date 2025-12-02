# Teste Blue-Green Deployment - Guia Essencial

## Pré-requisitos
- Kubernetes rodando (Docker Desktop ou Minikube)
- kubectl configurado
- Argo Rollouts instalado
- **Helm 3** instalado
- **Memória recomendada**: Docker Desktop configurado com pelo menos 8GB de RAM
  - Blue-Green deployment requer rodar 2 versões simultaneamente
  - Se tiver menos memória, considere reduzir os recursos em `helm/linktree/values.dev.yaml`

## Passos para Testar

### 1. Criar namespace e instalar com Helm
```bash
kubectl create namespace dev
helm upgrade --install linktree-dev helm/linktree -f helm/linktree/values.dev.yaml --namespace dev
```

### 2. Verificar status do Rollout
```bash
kubectl argo rollouts get rollout linktree-dev-linktree-backend -n dev
```

**Saída esperada:**
```
Status: ✔ Healthy
Strategy: BlueGreen
Images: linktree-backend:v1.0 (stable, active)
```

### 3. Fazer deploy de nova versão (Green)
```bash
# A versão inicial instalada é v2.1.0, vamos deployar v1.0 como exemplo
kubectl argo rollouts set image linktree-dev-linktree-backend \
  backend=linktree-backend:v1.0 -n dev
```

### 4. Observar estado Paused
```bash
kubectl argo rollouts get rollout linktree-dev-linktree-backend -n dev
```

**Saída esperada:**
```
Status: ◌ Progressing
Message: active service cutover pending
Images:
  - linktree-backend:v1.0 (preview)         ← Green para teste
  - linktree-backend:v2.1.0 (stable, active)  ← Blue em produção
Replicas: 2 pods rodando (1 Blue + 1 Green)
```

**Nota importante**: Em clusters locais com recursos limitados, o pod Green pode ficar em estado `Pending` devido a memória insuficiente. Neste caso, você pode:
- Aumentar a memória do Docker Desktop para 8GB+ em Settings → Resources
- Reduzir os recursos solicitados em `helm/linktree/values.dev.yaml`
- Ou continuar testando os comandos mesmo com o pod Pending (o conceito Blue-Green ainda é demonstrado)

### 5. Testar versão Green (Preview)
```bash
# Port-forward do preview service
kubectl port-forward svc/linktree-dev-linktree-backend-preview 8001:8000 -n dev

# Testar em outro terminal
curl http://localhost:8001/api/health
```

### 6. Promover para produção
```bash
kubectl argo rollouts promote linktree-dev-linktree-backend -n dev
```

### 7. Verificar troca de tráfego
```bash
kubectl argo rollouts get rollout linktree-dev-linktree-backend -n dev
```

**Resultado:**
- Active service agora aponta para v1.0 (Green)
- Blue (v2.1.0) é escalado down após 300 segundos (scaleDownDelaySeconds)

## Conceitos Demonstrados

1. **Zero Downtime**: Nova versão sobe sem afetar produção
2. **Teste Isolado**: Preview service permite testar Green antes de promover
3. **Promoção Manual**: `autoPromotionEnabled: false` exige comando manual
4. **Rollback Rápido**: Se houver problema, basta executar `kubectl argo rollouts abort`

## Comandos Úteis

```bash
# Ver status do rollout
kubectl argo rollouts status linktree-dev-linktree-backend -n dev

# Listar todos os rollouts
kubectl argo rollouts list rollouts -n dev

# Fazer rollback para revisão anterior
kubectl argo rollouts undo linktree-dev-linktree-backend -n dev

# Abortar rollout em andamento
kubectl argo rollouts abort linktree-dev-linktree-backend -n dev

# Assistir mudanças em tempo real
kubectl argo rollouts get rollout linktree-dev-linktree-backend -n dev --watch

# Pausar rollout manualmente
kubectl argo rollouts pause linktree-dev-linktree-backend -n dev

# Retomar/promover rollout pausado
kubectl argo rollouts promote linktree-dev-linktree-backend -n dev
```

## Configuração Blue-Green (values.dev.yaml)

```yaml
rollout:
  enabled: true
  strategy: blueGreen
  blueGreen:
    autoPromotionEnabled: false    # Promoção manual obrigatória
    scaleDownDelaySeconds: 300     # 5 min antes de deletar Blue
    antiAffinity: false
```

## Troubleshooting

### Pod Green fica em estado Pending

**Problema**: Após executar `kubectl argo rollouts set image`, o pod Green fica Pending com erro "Insufficient memory".

**Solução**:
1. Aumentar memória do Docker Desktop:
   ```bash
   # No Docker Desktop: Settings → Resources → Memory: 8GB+
   # Reiniciar o Docker
   ```

2. Ou reduzir recursos em `helm/linktree/values.dev.yaml`:
   ```yaml
   backend:
     resources:
       requests:
         memory: 64Mi  # Reduzir de 128Mi
       limits:
         memory: 256Mi  # Reduzir de 512Mi
   ```

3. Aplicar mudanças:
   ```bash
   helm upgrade linktree-dev helm/linktree -f helm/linktree/values.dev.yaml --namespace dev
   ```

### Erro "invalid ownership metadata" ao instalar com Helm

**Problema**: `Error: Unable to continue with install: ConfigMap "..." exists and cannot be imported`

**Solução**: Deletar namespace e reinstalar do zero:
```bash
kubectl delete namespace dev
kubectl create namespace dev
helm upgrade --install linktree-dev helm/linktree -f helm/linktree/values.dev.yaml --namespace dev
```

### Verificar recursos do cluster

```bash
# Ver uso de memória dos nós
kubectl top nodes

# Ver uso de memória dos pods
kubectl top pods -n dev

# Verificar eventos de scheduling
kubectl get events -n dev --sort-by='.lastTimestamp'
```
