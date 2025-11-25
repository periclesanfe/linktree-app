# 🧪 Guia Completo de Testes - Argo Rollouts

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Preparação do Ambiente](#preparação-do-ambiente)
3. [Teste Blue-Green (DEV)](#teste-blue-green-dev)
4. [Teste Canary (PROD)](#teste-canary-prod)
5. [Comandos de Monitoramento](#comandos-de-monitoramento)
6. [Comandos de Troubleshooting](#comandos-de-troubleshooting)
7. [Comandos de Rollback](#comandos-de-rollback)
8. [Referências](#referências)

---

## Pré-requisitos

### Ferramentas Necessárias

```bash
# Verificar se todas as ferramentas estão instaladas
kubectl version --client
docker --version
minikube version
helm version

# Verificar se o plugin kubectl argo rollouts está instalado
kubectl argo rollouts version
```

### Acesso ao Cluster

```bash
# Verificar contexto do Kubernetes
kubectl config current-context

# Verificar namespaces
kubectl get namespaces | grep -E "dev|prod|argocd"

# Verificar se Argo Rollouts está rodando
kubectl get pods -n argo-rollouts
```

### Verificar Rollouts Existentes

```bash
# DEV
kubectl get rollouts -n dev

# PROD
kubectl get rollouts -n prod
```

---

## Preparação do Ambiente

### 1. Modificar o Código

```bash
# Navegar até o backend
cd /Users/xxmra/Documents/GitHub/BRICELE-LINKTREE/linktree/linktree-backend

# Editar o arquivo de health check
# Arquivo: src/index.js
# Modificar a rota /api/health para adicionar campos de versão
```

Exemplo de mudança:

```javascript
// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: 'v3.0-testing-rollout',
    deployment: 'Testing Blue-Green & Canary',
    rolloutType: process.env.ROLLOUT_TYPE || 'unknown',
  });
});
```

### 2. Commit das Mudanças

```bash
# Fazer commit
git add src/index.js
git commit -m "feat: Update to v3.0 for rollout testing"

# (Opcional) Push para o repositório remoto
git push origin main
```

### 3. Build da Nova Imagem Docker

```bash
# Build da imagem v3
docker build -t linktree-backend:v3 .

# Verificar imagem criada
docker images | grep linktree-backend

# Carregar imagem no minikube
minikube image load linktree-backend:v3
```

### 4. Verificar Estado Inicial dos Rollouts

```bash
# DEV
kubectl argo rollouts get rollout linktree-dev-linktree-backend -n dev

# PROD
kubectl argo rollouts get rollout linktree-prod-linktree-backend -n prod
```

---

## Teste Blue-Green (DEV)

### Objetivo
Testar deployment Blue-Green com promoção manual, vendo as duas versões rodando simultaneamente.

### Step 1: Estado Inicial

```bash
# Verificar rollout atual
kubectl argo rollouts get rollout linktree-dev-linktree-backend -n dev

# Saída esperada:
# Status: Healthy
# Images: linktree-backend:v2 (stable, active)
# Replicas: Current: 1
```

### Step 2: Atualizar para Nova Versão (v3)

#### Opção A: Via Patch Direto (Mais Rápido para Testes)

```bash
# Desabilitar self-heal temporariamente
kubectl patch app linktree-dev-backend -n argocd --type='json' \
  -p='[{"op": "remove", "path": "/spec/syncPolicy/automated/selfHeal"}]'

# Fazer patch do rollout para v3
kubectl patch rollout linktree-dev-linktree-backend -n dev --type='json' \
  -p='[{"op": "replace", "path": "/spec/template/spec/containers/0/image", "value":"linktree-backend:v3"}]'
```

#### Opção B: Via ArgoCD Application (GitOps Puro)

```bash
# Atualizar parâmetros da Application
kubectl get app linktree-dev-backend -n argocd -o yaml > /tmp/app-dev.yaml

# Editar o arquivo e mudar backend.image.tag de "v2" para "v3"
cat /tmp/app-dev.yaml | sed 's/value: v2/value: v3/g' | kubectl apply -f -

# Forçar sync
kubectl patch app linktree-dev-backend -n argocd --type=merge \
  -p='{"operation":{"initiatedBy":{"username":"manual"},"sync":{"revision":"HEAD"}}}'
```

### Step 3: Verificar Estado com Blue + Green

```bash
# Aguardar criação do Green (15-20 segundos)
sleep 20

# Ver estado pausado com duas versões
kubectl argo rollouts get rollout linktree-dev-linktree-backend -n dev

# Saída esperada:
# Status: ॥ Paused
# Message: BlueGreenPause
# Images: linktree-backend:v2 (stable, active)
#         linktree-backend:v3 (preview)
# Replicas: Current: 2
```

### Step 4: Testar Preview Service (Green)

```bash
# Port-forward do preview service
kubectl port-forward svc/linktree-dev-linktree-backend-preview 8001:8000 -n dev

# Em outro terminal, testar
curl http://localhost:8001/api/health

# Resposta esperada (v3):
# {
#   "version": "v3.0-testing-rollout",
#   "deployment": "Testing Blue-Green & Canary"
# }
```

### Step 5: Testar Active Service (Blue)

```bash
# Port-forward do active service
kubectl port-forward svc/linktree-dev-linktree-backend 8002:8000 -n dev

# Em outro terminal, testar
curl http://localhost:8002/api/health

# Resposta esperada (v2):
# {
#   "version": "v2.0-blue-green-test",
#   "deployment": "GREEN"
# }
```

### Step 6: Promover Green para Produção

```bash
# Promover
kubectl argo rollouts promote linktree-dev-linktree-backend -n dev

# Verificar transição imediatamente
kubectl argo rollouts get rollout linktree-dev-linktree-backend -n dev

# Saída esperada:
# Status: Healthy
# Images: linktree-backend:v2               (delay:30s)
#         linktree-backend:v3 (stable, active)
# Replicas: Current: 2
```

### Step 7: Verificar Estado Final

```bash
# Aguardar scaledown do Blue (30 segundos)
sleep 30

# Ver estado final
kubectl argo rollouts get rollout linktree-dev-linktree-backend -n dev

# Saída esperada:
# Status: Healthy
# Images: linktree-backend:v3 (stable, active)
# Replicas: Current: 1
```

### Step 8: Reabilitar Self-Heal (Importante!)

```bash
# Reabilitar self-heal
kubectl patch app linktree-dev-backend -n argocd --type='json' \
  -p='[{"op": "add", "path": "/spec/syncPolicy/automated", "value": {"prune": true, "selfHeal": true, "allowEmpty": false}}]'
```

---

## Teste Canary (PROD)

### Objetivo
Testar deployment Canary com progressão gradual de tráfego (10% → 25% → 50% → 75% → 100%).

### Pré-requisitos Específicos do PROD

```bash
# Carregar imagens v2 e v3 no minikube
minikube image load linktree-backend:v2
minikube image load linktree-backend:v3

# Configurar Application para usar imagens locais (apenas para teste)
kubectl patch app linktree-prod-backend -n argocd --type='json' -p='[
  {"op": "replace", "path": "/spec/source/helm/parameters/2/value", "value": "linktree-backend"},
  {"op": "replace", "path": "/spec/source/helm/parameters/3/value", "value": "v2"},
  {"op": "replace", "path": "/spec/source/helm/parameters/4/value", "value": "Never"}
]'

# Aguardar sync
sleep 30
```

### Step 1: Estado Inicial

```bash
# Verificar rollout atual
kubectl argo rollouts get rollout linktree-prod-linktree-backend -n prod

# Saída esperada:
# Status: Healthy
# Strategy: Canary
# Step: 9/9
# Images: linktree-backend:v2 (stable)
# Replicas: Current: 2
```

### Step 2: Iniciar Canary Deployment

```bash
# Desabilitar self-heal temporariamente
kubectl patch app linktree-prod-backend -n argocd --type='json' \
  -p='[{"op": "remove", "path": "/spec/syncPolicy/automated/selfHeal"}]'

# Atualizar para v3
kubectl patch rollout linktree-prod-linktree-backend -n prod --type='json' \
  -p='[{"op": "replace", "path": "/spec/template/spec/containers/0/image", "value":"linktree-backend:v3"}]'

# Aguardar criação do canary (20 segundos)
sleep 20
```

### Step 3: Ver Estado com 10% Canary (Step 1/9)

```bash
# Verificar estado
kubectl argo rollouts get rollout linktree-prod-linktree-backend -n prod

# Saída esperada:
# Status: ॥ Paused
# Message: CanaryPauseStep
# Strategy: Canary
#   Step: 1/9
#   SetWeight: 10
#   ActualWeight: 10
# Images: linktree-backend:v2 (stable)    ← 90% tráfego
#         linktree-backend:v3 (canary)    ← 10% tráfego
# Replicas: Current: 3 (2 stable + 1 canary)
```

### Step 4: Verificar Pods e Services

```bash
# Ver pods
kubectl get pods -n prod -l app.kubernetes.io/name=linktree,app.kubernetes.io/component=backend

# Ver services
kubectl get svc -n prod | grep backend

# Saída esperada:
# linktree-prod-linktree-backend         (stable service)
# linktree-prod-linktree-backend-canary  (canary service)
```

### Step 5: Verificar Ingress Annotations (Canary Weight)

```bash
# Ver annotations do ingress
kubectl get ingress -n prod -o yaml | grep -A 5 "canary"

# Saída esperada:
# nginx.ingress.kubernetes.io/canary: "true"
# nginx.ingress.kubernetes.io/canary-weight: "10"
```

### Step 6: Promover para 25% → 50% (Step 3/9 → Step 5/9)

```bash
# Promover (pula pauses e vai para próximo setWeight)
kubectl argo rollouts promote linktree-prod-linktree-backend -n prod

# Aguardar
sleep 5

# Verificar estado
kubectl argo rollouts get rollout linktree-prod-linktree-backend -n prod

# Saída esperada:
# Step: 5/9
# SetWeight: 50
# ActualWeight: 50
# Replicas: Current: 3 (2 stable + 1 canary)
```

### Step 7: Promover para 75% (Step 7/9)

```bash
# Promover novamente
kubectl argo rollouts promote linktree-prod-linktree-backend -n prod

# Aguardar criação de novo pod canary
sleep 15

# Verificar estado
kubectl argo rollouts get rollout linktree-prod-linktree-backend -n prod

# Saída esperada:
# Step: 7/9
# SetWeight: 75
# ActualWeight: 75
# Replicas: Current: 4 (2 stable + 2 canary)
```

### Step 8: Promover para 100% (Step 9/9)

```bash
# Promover para 100%
kubectl argo rollouts promote linktree-prod-linktree-backend -n prod

# Aguardar
sleep 10

# Verificar estado
kubectl argo rollouts get rollout linktree-prod-linktree-backend -n prod

# Saída esperada:
# Step: 9/9
# SetWeight: 100
# ActualWeight: 100
# Images: linktree-backend:v2               (delay:30s)
#         linktree-backend:v3 (stable)
# Replicas: Current: 4 (2 old stable + 2 new stable)
```

### Step 9: Verificar Estado Final

```bash
# Aguardar scaledown do old stable (30 segundos)
sleep 30

# Ver estado final
kubectl argo rollouts get rollout linktree-prod-linktree-backend -n prod

# Saída esperada:
# Status: Healthy
# Step: 9/9
# Images: linktree-backend:v3 (stable)
# Replicas: Current: 2
```

### Step 10: Reabilitar Self-Heal

```bash
# Reabilitar self-heal
kubectl patch app linktree-prod-backend -n argocd --type='json' \
  -p='[{"op": "add", "path": "/spec/syncPolicy/automated/selfHeal", "value": true}]'
```

---

## Comandos de Monitoramento

### Monitorar Rollout em Tempo Real

```bash
# DEV
kubectl argo rollouts get rollout linktree-dev-linktree-backend -n dev --watch

# PROD
kubectl argo rollouts get rollout linktree-prod-linktree-backend -n prod --watch
```

### Ver Histórico de Rollouts

```bash
# DEV
kubectl argo rollouts history linktree-dev-linktree-backend -n dev

# PROD
kubectl argo rollouts history linktree-prod-linktree-backend -n prod
```

### Ver Logs dos Pods

```bash
# Ver pods
kubectl get pods -n dev -l app.kubernetes.io/name=linktree,app.kubernetes.io/component=backend

# Logs do pod específico
kubectl logs <pod-name> -n dev -f

# Logs de todos os pods do backend
kubectl logs -n dev -l app.kubernetes.io/component=backend --all-containers=true -f
```

### Ver Eventos do Rollout

```bash
# DEV
kubectl describe rollout linktree-dev-linktree-backend -n dev | tail -30

# PROD
kubectl describe rollout linktree-prod-linktree-backend -n prod | tail -30
```

### Monitorar ArgoCD Application

```bash
# Ver status da Application
kubectl get app -n argocd | grep linktree

# Detalhes da Application (DEV)
kubectl get app linktree-dev-backend -n argocd -o yaml

# Detalhes da Application (PROD)
kubectl get app linktree-prod-backend -n argocd -o yaml
```

### Dashboard do Argo Rollouts (Opcional)

```bash
# Iniciar dashboard local
kubectl argo rollouts dashboard

# Acessar em: http://localhost:3100
```

---

## Comandos de Troubleshooting

### ImagePullBackOff

```bash
# Verificar se a imagem existe no minikube
minikube image ls | grep linktree-backend

# Carregar imagem se necessário
minikube image load linktree-backend:v3

# Verificar events do pod
kubectl get events -n dev --sort-by='.lastTimestamp' | grep -i "image"

# Verificar pod específico
kubectl describe pod <pod-name> -n dev
```

### Rollout Travado em "Progressing"

```bash
# Ver mensagem de erro
kubectl argo rollouts get rollout <rollout-name> -n <namespace>

# Verificar se há pods unhealthy
kubectl get pods -n <namespace> -l app.kubernetes.io/component=backend

# Reiniciar Argo Rollouts controller
kubectl rollout restart deployment argo-rollouts -n argo-rollouts

# Aguardar controller subir
sleep 20

# Verificar novamente
kubectl argo rollouts get rollout <rollout-name> -n <namespace>
```

### ArgoCD Revertendo Mudanças (Self-Heal)

```bash
# Verificar se self-heal está ativo
kubectl get app <app-name> -n argocd -o jsonpath='{.spec.syncPolicy.automated.selfHeal}'

# Desabilitar self-heal temporariamente
kubectl patch app <app-name> -n argocd --type='json' \
  -p='[{"op": "remove", "path": "/spec/syncPolicy/automated/selfHeal"}]'

# Verificar parâmetros da Application
kubectl get app <app-name> -n argocd -o jsonpath='{.spec.source.helm.parameters}'
```

### Verificar Configuração do Rollout

```bash
# Ver spec completo do rollout
kubectl get rollout <rollout-name> -n <namespace> -o yaml

# Verificar imagem configurada
kubectl get rollout <rollout-name> -n <namespace> \
  -o jsonpath='{.spec.template.spec.containers[0].image}'

# Verificar estratégia
kubectl get rollout <rollout-name> -n <namespace> \
  -o jsonpath='{.spec.strategy}'
```

### Verificar Services

```bash
# DEV - BlueGreen
kubectl get svc linktree-dev-linktree-backend -n dev -o yaml
kubectl get svc linktree-dev-linktree-backend-preview -n dev -o yaml

# PROD - Canary
kubectl get svc linktree-prod-linktree-backend -n prod -o yaml
kubectl get svc linktree-prod-linktree-backend-canary -n prod -o yaml
```

### Logs do Argo Rollouts Controller

```bash
# Ver logs do controller
kubectl logs -n argo-rollouts deployment/argo-rollouts -f

# Ver logs de eventos específicos do rollout
kubectl logs -n argo-rollouts deployment/argo-rollouts -f | grep <rollout-name>
```

---

## Comandos de Rollback

### Abortar Rollout em Progresso

```bash
# BlueGreen (DEV) - Aborta e mantém Blue ativo
kubectl argo rollouts abort linktree-dev-linktree-backend -n dev

# Canary (PROD) - Aborta e reverte para stable
kubectl argo rollouts abort linktree-prod-linktree-backend -n prod
```

### Rollback para Revisão Anterior

```bash
# Ver histórico de revisões
kubectl argo rollouts history <rollout-name> -n <namespace>

# Fazer undo (volta para revisão anterior)
kubectl argo rollouts undo <rollout-name> -n <namespace>

# Fazer undo para revisão específica
kubectl argo rollouts undo <rollout-name> -n <namespace> --to-revision=5
```

### Restart Completo do Rollout

```bash
# Restart (cria nova revisão com mesma imagem)
kubectl argo rollouts restart <rollout-name> -n <namespace>
```

### Reverter via ArgoCD

```bash
# Sync para revisão anterior do Git
kubectl patch app <app-name> -n argocd --type=merge \
  -p='{"operation":{"sync":{"revision":"<commit-hash>"}}}'

# Forçar hard refresh e sync
kubectl delete app <app-name> -n argocd
kubectl apply -f /path/to/application.yaml
```

---

## Referências

### Documentação Oficial

- [Argo Rollouts - Blue-Green](https://argo-rollouts.readthedocs.io/en/stable/features/bluegreen/)
- [Argo Rollouts - Canary](https://argo-rollouts.readthedocs.io/en/stable/features/canary/)
- [Argo Rollouts - kubectl Plugin](https://argo-rollouts.readthedocs.io/en/stable/features/kubectl-plugin/)
- [ArgoCD - Sync Waves](https://argo-cd.readthedocs.io/en/stable/user-guide/sync-waves/)

### Estratégias de Deployment

#### Blue-Green
- **Quando usar**: Ambientes de dev/staging, quando você precisa de rollback instantâneo
- **Vantagens**: Simples, rollback rápido, preview service
- **Desvantagens**: Requer 2x recursos temporariamente, mudança de tráfego é tudo ou nada

#### Canary
- **Quando usar**: Produção, quando você quer validar com tráfego real gradualmente
- **Vantagens**: Risco reduzido, validação com tráfego real, escala gradual
- **Desvantagens**: Mais complexo, requer ingress controller (NGINX/Istio)

### Comandos Rápidos

```bash
# Ver todos os rollouts
kubectl get rollouts -A

# Ver status de todas as Applications
kubectl get app -n argocd

# Ver todos os pods de backend
kubectl get pods -A -l app.kubernetes.io/component=backend

# Port-forward rápido (DEV preview)
kubectl port-forward -n dev svc/linktree-dev-linktree-backend-preview 8001:8000

# Port-forward rápido (DEV active)
kubectl port-forward -n dev svc/linktree-dev-linktree-backend 8002:8000

# Promote rápido
kubectl argo rollouts promote <rollout-name> -n <namespace>

# Abort rápido
kubectl argo rollouts abort <rollout-name> -n <namespace>
```

---

## Notas Importantes

1. **Self-Heal**: Sempre reabilite o self-heal após os testes para manter GitOps puro
2. **Imagens Minikube**: Em produção real, use registry (ghcr.io, ECR, etc)
3. **Backups**: Faça backup dos manifests antes de testes destrutivos
4. **Monitoramento**: Use `--watch` para acompanhar rollouts em tempo real
5. **Logs**: Sempre verifique logs do controller em caso de problemas

---

**Data de Criação**: 2025-11-24
**Versão**: 1.0
**Autor**: Claude Code Assistant
