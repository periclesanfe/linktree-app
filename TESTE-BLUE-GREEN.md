# Teste Blue-Green Deployment - Guia Essencial

## Pré-requisitos
- Kubernetes rodando (Docker Desktop ou Minikube)
- kubectl configurado
- Argo Rollouts instalado

## Passos para Testar

### 1. Criar namespace e aplicar recursos
```bash
kubectl create namespace dev
kubectl apply -f helm/linktree/templates/backend-rollout.yaml -n dev
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
kubectl argo rollouts set image linktree-dev-linktree-backend \
  backend=linktree-backend:v2.0 -n dev
```

### 4. Observar estado Paused
```bash
kubectl argo rollouts get rollout linktree-dev-linktree-backend -n dev
```

**Saída esperada:**
```
Status: ॥ Paused
Message: BlueGreenPause
Images:
  - linktree-backend:v1.0 (stable, active)  ← Blue em produção
  - linktree-backend:v2.0 (preview)         ← Green para teste
Replicas: 2 pods rodando
```

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
- Active service agora aponta para v2.0 (Green)
- Blue (v1.0) é escalado down após 300 segundos

## Conceitos Demonstrados

1. **Zero Downtime**: Nova versão sobe sem afetar produção
2. **Teste Isolado**: Preview service permite testar Green antes de promover
3. **Promoção Manual**: `autoPromotionEnabled: false` exige comando manual
4. **Rollback Rápido**: Se houver problema, basta executar `kubectl argo rollouts abort`

## Comandos Úteis

```bash
# Ver histórico de versões
kubectl argo rollouts history linktree-dev-linktree-backend -n dev

# Fazer rollback
kubectl argo rollouts undo linktree-dev-linktree-backend -n dev

# Abortar rollout
kubectl argo rollouts abort linktree-dev-linktree-backend -n dev

# Assistir mudanças em tempo real
kubectl argo rollouts get rollout linktree-dev-linktree-backend -n dev --watch
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
