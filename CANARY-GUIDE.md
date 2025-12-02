# Canary Deployment - Guia Completo

## 📋 Visão Geral

Este documento explica como o deploy Canary está configurado no ambiente PROD e o passo a passo mínimo para executá-lo.

---

## 🗂️ Arquivos e Suas Funções

### 1. **Helm Chart - Rollout com Estratégia Canary**

**Arquivo:** `linktree/helm/linktree/templates/rollout.yaml`

```yaml
strategy:
  {{- if eq .Values.environment "dev" }}
  # BlueGreen para DEV
  {{- else }}
  canary:
    stableService: {{ include "linktree.fullname" . }}
    canaryService: {{ include "linktree.fullname" . }}-canary
    steps:
      - setWeight: 20
      - pause: {}              # PAUSA MANUAL - aguarda promoção
      - setWeight: 40
      - pause: { duration: 30s }  # PAUSA AUTOMÁTICA 30s
      - setWeight: 60
      - pause: { duration: 30s }  # PAUSA AUTOMÁTICA 30s
      - setWeight: 80
      - pause: { duration: 30s }  # PAUSA AUTOMÁTICA 30s
  {{- end }}
```

**Função:**
- Define a estratégia de deployment como **Canary** quando `environment: prod`
- **stableService**: Service que aponta para a versão estável em produção
- **canaryService**: Service que aponta para a versão canary em teste
- **steps**: Define o rollout progressivo com pesos e pausas
- **Primeira pausa (20%)**: Manual - você decide se continua
- **Demais pausas (40%, 60%, 80%)**: Automáticas com 30 segundos cada

---

### 2. **Services - Stable e Canary**

#### Service Stable (Produção)
**Arquivo:** `linktree/helm/linktree/templates/service.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "linktree.fullname" . }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: http
  selector:
    {{- include "linktree.selectorLabels" . | nindent 4 }}
```

**Função:** Aponta para os pods da versão **estável** (Stable)

---

#### Service Canary
**Arquivo:** `linktree/helm/linktree/templates/service-canary.yaml`

```yaml
{{- if eq .Values.environment "prod" }}
apiVersion: v1
kind: Service
metadata:
  name: {{ include "linktree.fullname" . }}-canary
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: http
  selector:
    {{- include "linktree.selectorLabels" . | nindent 4 }}
{{- end }}
```

**Função:**
- Criado **apenas em PROD** (condicional `if eq .Values.environment "prod"`)
- Aponta para os pods da **versão canary** em teste
- Permite testar a nova versão durante o rollout progressivo

---

### 3. **Values - Configuração PROD**

**Arquivo:** `linktree/helm/linktree/values.yaml`

```yaml
environment: prod

replicaCount: 2  # Ajustado para Docker Desktop

image:
  repository: ghcr.io/periclesanfe/linktree-backend
  pullPolicy: Always
  tag: "4f49932"

database:
  host: linktree-prod-postgresql-rw.prod.svc.cluster.local

postgresql:
  enabled: true
  environment: production
  cluster:
    name: linktree-prod-postgresql
    instances: 1  # Ajustado para Docker Desktop (seria 3 em prod real)
```

**Função:**
- Define `environment: prod` que ativa a estratégia Canary
- Configura 2 réplicas para o backend
- Define a tag da imagem Docker que será deployada
- Configura PostgreSQL com 1 instância (3 em produção real)

---

### 4. **ArgoCD Application**

**Arquivo:** `argocd-gitops/argocd/apps/prod/backend-prod.yaml`

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: linktree-backend-prod
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/periclesanfe/linktree-app.git
    targetRevision: main
    path: helm/linktree
    helm:
      releaseName: linktree-backend-prod
      valueFiles:
        - values.yaml
      parameters:
        - name: image.tag
          value: "4f49932"  # TAG DA IMAGEM
  destination:
    server: https://kubernetes.default.svc
    namespace: prod
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

**Função:**
- Define qual repositório Git monitorar (`linktree-app`)
- Define qual branch usar (`main`)
- Define qual Helm chart usar (`helm/linktree`)
- **IMPORTANTE:** `image.tag` pode sobrescrever a tag definida no values.yaml
- Sync automático: ArgoCD detecta mudanças e aplica automaticamente

---

### 5. **GitHub Actions - CI/CD Pipeline**

**Arquivo:** `linktree/.github/workflows/gitops-cicd.yml`

```yaml
- name: Build and push Backend
  uses: docker/build-push-action@v5
  with:
    context: ./linktree-backend
    push: true
    tags: ${{ steps.meta.outputs.tags }}

- name: Update image tags in GitOps repo
  run: |
    SHORT_SHA="${{ steps.sha.outputs.short }}"
    BACKEND_FILE="argocd/apps/prod/backend-prod.yaml"
    yq eval -i ".spec.source.helm.parameters[] |= select(.name == \"image.tag\").value = \"${SHORT_SHA}\"" "$BACKEND_FILE"

- name: Commit and push changes
  run: |
    git commit -m "chore(prod): update images to ${{ steps.sha.outputs.short }} [skip ci]"
    git push origin main
```

**Função:**
1. **Build da imagem Docker** com tag igual ao commit SHA
2. **Push para GitHub Container Registry** (ghcr.io)
3. **Atualiza `image.tag`** no arquivo ArgoCD Application no repo `argocd-gitops`
4. **Commit e push** das mudanças para o repo GitOps
5. **ArgoCD detecta** a mudança e inicia o rollout Canary automaticamente

---

## 🚀 Passo a Passo Mínimo - Canary Deploy

### Pré-requisitos
- Cluster Kubernetes rodando
- ArgoCD instalado e configurado
- Argo Rollouts instalado
- CloudNativePG instalado

---

### **Passo 1: Fazer mudança no código do backend**

```bash
cd /Users/xxmra/Documents/GitHub/BRICELE-LINKTREE/linktree/linktree-backend

# Faça suas alterações no código...
# Exemplo: editar um arquivo qualquer

git add .
git commit -m "feat: minha nova feature"
```

---

### **Passo 2: Push para branch main**

```bash
git push origin main
```

**O que acontece automaticamente:**
1. ✅ GitHub Actions detecta o push para `main`
2. ✅ Build da imagem Docker com tag = commit SHA (ex: `a1b2c3d`)
3. ✅ Push da imagem para `ghcr.io/periclesanfe/linktree-backend:a1b2c3d`
4. ✅ Atualiza `image.tag` no arquivo `argocd-gitops/argocd/apps/prod/backend-prod.yaml`
5. ✅ Commit e push para o repositório `argocd-gitops`

---

### **Passo 3: ArgoCD detecta mudança e inicia rollout**

**Aguarde 30-60 segundos** e verifique:

```bash
kubectl get applications -n argocd
# NAME                    SYNC STATUS   HEALTH STATUS
# linktree-backend-prod   Synced        Progressing
```

ArgoCD automaticamente:
1. ✅ Detecta que `image.tag` mudou no repositório GitOps
2. ✅ Cria um novo ReplicaSet com a nova imagem (Canary)
3. ✅ Sobe 1 novo pod com a nova versão (20% do tráfego)
4. ✅ Aponta o **canary service** para o novo pod
5. ✅ Mantém os pods antigos rodando (Stable) no **stable service**

---

### **Passo 4: Verificar estado do rollout - WATCH em tempo real**

```bash
kubectl argo rollouts get rollout linktree-backend-prod -n prod --watch
```

**Saída esperada (Step 1/8 - 20%):**
```
Name:            linktree-backend-prod
Namespace:       prod
Status:          ॥ Paused
Message:         CanaryPauseStep
Strategy:        Canary
  Step:          1/8
  SetWeight:     20
  ActualWeight:  33
Images:          ghcr.io/periclesanfe/linktree-backend:4f49932 (stable)  ← VERSÃO ANTIGA
                 ghcr.io/periclesanfe/linktree-backend:a1b2c3d (canary)  ← NOVA VERSÃO
Replicas:
  Desired:       2
  Current:       3  ← 2 pods antigos + 1 pod novo
  Updated:       1
  Ready:         3
```

**Neste momento você tem:**
- **2 pods rodando versão antiga** (Stable) - Recebendo 66% do tráfego
- **1 pod rodando versão nova** (Canary) - Recebendo 33% do tráfego
- **Status: Paused** - Aguardando promoção manual

---

### **Passo 5: Testar a nova versão (Canary)**

```bash
# Abrir port-forward para o canary service
kubectl port-forward svc/linktree-backend-prod-canary 8081:8000 -n prod

# Em outro terminal, testar
curl http://localhost:8081/api/health
curl http://localhost:8081/api/links
# ... seus testes ...
```

**Verifique:**
- ✅ API está respondendo corretamente
- ✅ Funcionalidades novas estão funcionando
- ✅ Não há erros nos logs

```bash
# Ver logs dos pods canary
kubectl logs -l rollouts-pod-template-hash=<canary-hash> -n prod --tail=50 -f
```

---

### **Passo 6: Promover para 40% (Primeira Promoção Manual)**

Se os testes estiverem OK, promova manualmente:

```bash
kubectl argo rollouts promote linktree-backend-prod -n prod
```

**O que acontece:**
1. ✅ Avança para **Step 3/8 (40%)**
2. ✅ Aguarda **30 segundos automaticamente**
3. ✅ Avança para **Step 4/8 (60%)** - escala para 2 pods canary
4. ✅ Aguarda **30 segundos automaticamente**
5. ✅ Avança para **Step 7/8 (80%)**
6. ✅ Aguarda **30 segundos automaticamente**
7. ✅ Avança para **Step 8/8 (100%)** - Finaliza!

**Acompanhe em tempo real:**
```bash
kubectl argo rollouts get rollout linktree-backend-prod -n prod --watch
```

---

### **Passo 7: Verificar rollout completo**

```bash
kubectl argo rollouts get rollout linktree-backend-prod -n prod
```

**Saída esperada:**
```
Name:            linktree-backend-prod
Namespace:       prod
Status:          ✔ Healthy
Strategy:        Canary
  Step:          8/8
  SetWeight:     100
  ActualWeight:  100
Images:          ghcr.io/periclesanfe/linktree-backend:a1b2c3d (stable)  ← NOVA VERSÃO AGORA É STABLE
Replicas:
  Desired:       2
  Current:       2  ← Apenas os 2 pods novos
  Updated:       2
  Ready:         2
  Available:     2
```

**Verificar pods:**
```bash
kubectl get pods -n prod
# NAME                                    READY   STATUS    RESTARTS   AGE
# linktree-backend-prod-a1b2c3d-xxxxx     1/1     Running   0          5m
# linktree-backend-prod-a1b2c3d-yyyyy     1/1     Running   0          3m
# linktree-prod-postgresql-1              1/1     Running   0          2h
```

✅ **Deploy completo com sucesso!**

---

## 📊 Resumo do Fluxo

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Desenvolvedor faz commit e push para main                   │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. GitHub Actions:                                              │
│    - Build imagem Docker (tag = commit SHA)                     │
│    - Push para ghcr.io                                          │
│    - Atualiza image.tag no argocd-gitops repo                   │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. ArgoCD detecta mudança no argocd-gitops repo                 │
│    - Inicia sync automático                                     │
│    - Aplica novo Helm chart com nova image.tag                  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Argo Rollouts inicia Canary deployment:                      │
│    - Step 1/8: 20% - Cria 1 pod canary                          │
│    - Status: Paused - aguardando promoção manual                │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Desenvolvedor testa canary service:                          │
│    - kubectl port-forward svc/...-canary 8081:8000 -n prod      │
│    - Testa endpoints, funcionalidades, logs                     │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Desenvolvedor promove manualmente:                           │
│    - kubectl argo rollouts promote ... -n prod                  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Argo Rollouts continua automaticamente:                      │
│    - Step 3/8: 40% - Pausa 30s automática                       │
│    - Step 4/8: 60% - Escala para 2 pods - Pausa 30s             │
│    - Step 7/8: 80% - Pausa 30s automática                       │
│    - Step 8/8: 100% - COMPLETO! Pods antigos removidos          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Comandos Úteis

### Monitorar rollout em tempo real (WATCH)
```bash
kubectl argo rollouts get rollout linktree-backend-prod -n prod --watch
```

### Ver histórico de rollouts
```bash
kubectl argo rollouts history linktree-backend-prod -n prod
```

### Promover para próximo step
```bash
kubectl argo rollouts promote linktree-backend-prod -n prod
```

### Abortar rollout em andamento
```bash
kubectl argo rollouts abort linktree-backend-prod -n prod
```

### Fazer rollback (voltar para versão anterior)
```bash
kubectl argo rollouts undo linktree-backend-prod -n prod
```

### Ver logs da aplicação
```bash
kubectl logs -l app.kubernetes.io/name=linktree-backend -n prod --tail=100 -f
```

### Ver todas as aplicações ArgoCD
```bash
kubectl get applications -n argocd
```

### Forçar sync manual no ArgoCD (caso auto-sync não funcione)
```bash
kubectl -n argocd patch application linktree-backend-prod --type merge -p '{"operation":{"initiatedBy":{"username":"admin"},"sync":{"revision":"HEAD"}}}'
```

### Testar canary service durante rollout
```bash
kubectl port-forward svc/linktree-backend-prod-canary 8081:8000 -n prod
curl http://localhost:8081/api/health
```

### Testar stable service (versão em produção)
```bash
kubectl port-forward svc/linktree-backend-prod 8080:8000 -n prod
curl http://localhost:8080/api/health
```

---

## ⚠️ Troubleshooting

### Rollout stuck em "Paused" no Step 1/8
**Causa:** Aguardando promoção manual (comportamento esperado)
**Solução:**
```bash
kubectl argo rollouts promote linktree-backend-prod -n prod
```

### Pods canary não inicializam (CrashLoopBackOff)
**Causa:** Erro na aplicação ou falta de variáveis de ambiente
**Solução:**
```bash
kubectl logs <pod-name> -n prod
kubectl describe pod <pod-name> -n prod
```

### Canary está com peso diferente do esperado
**Causa:** Número de pods não é divisível exatamente
**Exemplo:** 1 pod canary de 3 total = 33% (não 20%)
**Solução:** Isso é normal, o peso é aproximado baseado no número de pods

### ArgoCD não detecta mudanças
**Causa:** Cache ou delay de sincronização
**Solução:**
```bash
# Forçar refresh
kubectl -n argocd patch application linktree-backend-prod --type merge -p '{"operation":{"initiatedBy":{"username":"admin"},"sync":{"revision":"HEAD"}}}'
```

### GitHub Actions falha no push para argocd-gitops
**Causa:** Token `GITOPS_PAT` sem permissões
**Solução:** Verificar secret `GITOPS_PAT` no GitHub repository settings

### Quero reverter o rollout no meio do processo
**Solução:**
```bash
# Abortar rollout
kubectl argo rollouts abort linktree-backend-prod -n prod

# Fazer rollback
kubectl argo rollouts undo linktree-backend-prod -n prod
```

---

## 🎯 Vantagens do Canary

✅ **Rollout progressivo**: Minimiza o risco com adoção gradual
✅ **Validação em produção**: Testa com tráfego real antes de 100%
✅ **Controle fino**: Primeira pausa manual + pausas automáticas
✅ **Rollback rápido**: Pode abortar a qualquer momento
✅ **Observabilidade**: Permite monitorar métricas durante a transição
✅ **Segurança**: Limita o impacto de bugs apenas a uma porcentagem de usuários

---

## 📈 Progressão do Canary

| Step | Peso | Pods Canary | Pods Stable | Pausa | Tipo |
|------|------|-------------|-------------|-------|------|
| 1/8  | 20%  | 1           | 2           | Indefinida | **Manual** |
| 3/8  | 40%  | 1           | 2           | 30s | Automática |
| 4/8  | 60%  | 2           | 1           | 30s | Automática |
| 7/8  | 80%  | 2           | 1           | 30s | Automática |
| 8/8  | 100% | 2           | 0           | - | Completo |

**Total de tempo mínimo** (após primeira promoção): ~90 segundos (3 x 30s de pausas)

---

## 🆚 Comparação: BlueGreen vs Canary

| Aspecto | BlueGreen (DEV) | Canary (PROD) |
|---------|-----------------|---------------|
| **Promoção** | Manual | Manual primeira, depois automático |
| **Tráfego** | 0% ou 100% | Progressivo: 20→40→60→80→100% |
| **Services** | active + preview | stable + canary |
| **Rollback** | Instantâneo | Rápido, mas precisa abortar |
| **Risco** | Baixo (testado antes) | Muito baixo (adoção gradual) |
| **Uso** | Validação em DEV | Produção com tráfego real |
| **Tempo** | Depende de testes | ~2-3 minutos (após promoção) |

---

## 📚 Referências

- [Argo Rollouts - Canary Strategy](https://argoproj.github.io/argo-rollouts/features/canary/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [CloudNativePG Documentation](https://cloudnative-pg.io/)
- [BlueGreen vs Canary Comparison](https://argoproj.github.io/argo-rollouts/features/specification/)
