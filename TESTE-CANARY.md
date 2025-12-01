# Teste Canary Deployment - Guia Essencial

## Pré-requisitos
- Kubernetes rodando (Docker Desktop ou Minikube)
- kubectl configurado
- Argo Rollouts instalado
- NGINX Ingress Controller (para controle de tráfego)

## O que é Canary Deployment?

Ao contrário do Blue-Green que troca instantaneamente entre versões, o **Canary** distribui tráfego **gradualmente** entre a versão estável e a nova versão (canary), permitindo validação progressiva com usuários reais.

## Passos para Testar

### 1. Criar namespace e aplicar recursos
```bash
kubectl create namespace prod
kubectl apply -f helm/linktree/templates/backend-rollout.yaml -n prod
```

### 2. Verificar Rollout inicial (Stable)
```bash
kubectl argo rollouts get rollout linktree-prod-linktree-backend -n prod
```

**Saída esperada:**
```
Status: ✔ Healthy
Strategy: Canary
Images: linktree-backend:v2.0.0 (stable)
Replicas: 3 pods
```

### 3. Fazer deploy da versão Canary
```bash
kubectl argo rollouts set image linktree-prod-linktree-backend \
  backend=linktree-backend:v2.1.0 -n prod
```

### 4. Observar Step 1 - 10% de tráfego
```bash
kubectl argo rollouts get rollout linktree-prod-linktree-backend -n prod
```

**Saída esperada:**
```
Status: ॥ Paused (CanaryPauseStep)
Step: 1/8
SetWeight: 10%
ActualWeight: 25%  (1 pod canary de 4 total)
Images:
  - linktree-backend:v2.0.0 (stable)  ← 3 pods (75%)
  - linktree-backend:v2.1.0 (canary)  ← 1 pod (25%)
```

### 5. Promover para Step 2 - 25%
```bash
kubectl argo rollouts promote linktree-prod-linktree-backend -n prod
```

**Comportamento:**
- Peso muda para 25%
- Pausa automática de 2 minutos
- NGINX Ingress roteia 25% do tráfego para canary

### 6. Progressão Automática
Após cada promoção manual, o Argo Rollouts continua automaticamente:

```
Step 3: 50% → pausa 5min
Step 4: 75% → pausa 5min
Step 5: 100% → rollout completo
```

### 7. Validar distribuição de tráfego
```bash
# Fazer múltiplas requisições e observar versões
for i in {1..10}; do
  curl http://api.linktree.prod/health | jq .version
done
```

**Resultado esperado em 50%:**
- ~5 requisições retornam v2.0.0
- ~5 requisições retornam v2.1.0

### 8. Verificar Rollout completo
```bash
kubectl argo rollouts get rollout linktree-prod-linktree-backend -n prod
```

**Saída final:**
```
Status: ✔ Healthy
Step: 8/8
Images: linktree-backend:v2.1.0 (stable)  ← Nova versão agora é stable
Replicas: 3 pods (todos v2.1.0)
```

## Demonstração Real Executada

### Progressão Observada:
```
10% (Paused) → promote → 25% (2min) → promote → 50% (5min)
→ promote → 75% (5min) → promote → 100% (Healthy)
```

### Pods Durante Rollout:
```
Step 1 (10%):  3 stable + 1 canary = 4 pods
Step 3 (25%):  3 stable + 1 canary = 4 pods
Step 5 (50%):  2 stable + 2 canary = 4 pods
Step 7 (75%):  1 stable + 3 canary = 4 pods
Step 8 (100%): 0 stable + 3 canary = 3 pods (stable deletado)
```

## Conceitos Demonstrados

1. **Distribuição Gradual**: Tráfego aumenta progressivamente (10→25→50→75→100%)
2. **Validação Incremental**: Cada step permite validar com % maior de usuários
3. **Rollback Rápido**: Basta executar `kubectl argo rollouts abort` em qualquer step
4. **Zero Downtime**: Sempre há pods healthy respondendo requisições
5. **Controle Fino**: NGINX Ingress permite distribuir tráfego por peso exato

## Diferenças: Blue-Green vs Canary

| Aspecto | Blue-Green | Canary |
|---------|-----------|--------|
| **Troca** | Instantânea após teste | Gradual (10%→25%→50%→75%→100%) |
| **Pods** | 2x recursos (Blue + Green) | ~1.3x recursos (3 stable + 1 canary) |
| **Validação** | Preview service isolado | Usuários reais com % controlado |
| **Risco** | Baixo (testado antes) | Muito baixo (exposição gradual) |
| **Rollback** | Instant

âneo (switch service) | Gradual (abort e scale down canary) |
| **Uso** | DEV/Staging | PROD com alto tráfego |

## Comandos Úteis

```bash
# Ver status em tempo real
kubectl argo rollouts get rollout linktree-prod-linktree-backend -n prod --watch

# Promover para próximo step
kubectl argo rollouts promote linktree-prod-linktree-backend -n prod

# Promover diretamente para 100% (pular steps)
kubectl argo rollouts promote linktree-prod-linktree-backend -n prod --full

# Abortar canary (rollback)
kubectl argo rollouts abort linktree-prod-linktree-backend -n prod

# Ver peso do canary no NGINX Ingress
kubectl describe ingress linktree-prod-linktree-backend-ingress -n prod | grep canary

# Dashboard visual
kubectl argo rollouts dashboard
# Acesse: http://localhost:3100
```

## Configuração Canary (values.prod.yaml)

```yaml
rollout:
  enabled: true
  strategy: canary
  canary:
    stableService: linktree-prod-linktree-backend
    canaryService: linktree-prod-linktree-backend-canary
    steps:
      - setWeight: 10
      - pause: {}  # Pausa indefinida (manual)
      - setWeight: 25
      - pause: {duration: 2m}
      - setWeight: 50
      - pause: {duration: 5m}
      - setWeight: 75
      - pause: {duration: 5m}
    maxSurge: "25%"
    maxUnavailable: 0
```

## Métricas e Observabilidade

Para produção, recomenda-se integrar com:
- **Prometheus**: Monitorar latência e error rate
- **Grafana**: Dashboards de progressão canary
- **Analysis Templates**: Abortar automaticamente se métricas degradarem

Exemplo de análise automática:
```yaml
analysis:
  templates:
    - templateName: success-rate
      args:
        - name: service-name
          value: linktree-backend
  startingStep: 2  # Iniciar análise no step 2 (25%)
  threshold:
    successRate: 95%
    errorRate: 5%
    latencyP95: 500ms
```

## Conclusão

Canary deployment é ideal para ambientes de produção onde você quer:
- Minimizar risco com exposição gradual
- Validar com usuários reais progressivamente
- Detectar problemas antes de afetar 100% dos usuários
- Ter controle fino sobre a velocidade do rollout
