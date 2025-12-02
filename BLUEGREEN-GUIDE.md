# BlueGreen Deployment - Guia Completo

## 📋 Visão Geral

Este documento explica como o deploy BlueGreen está configurado no ambiente DEV e o passo a passo mínimo para executá-lo.

---

## 🗂️ Arquivos e Suas Funções

### 1. **Helm Chart - Rollout com Estratégia BlueGreen**

**Arquivo:** `linktree/helm/linktree/templates/rollout.yaml`

```yaml
strategy:
  {{- if eq .Values.environment "dev" }}
  blueGreen:
    activeService: {{ include "linktree.fullname" . }}
    previewService: {{ include "linktree.fullname" . }}-preview
    autoPromotionEnabled: false
    scaleDownDelaySeconds: 30
  {{- end }}
```

**Função:**
- Define a estratégia de deployment como **BlueGreen** quando `environment: dev`
- **activeService**: Service que aponta para a versão atualmente em produção (Green)
- **previewService**: Service que aponta para a nova versão em teste (Blue)
- **autoPromotionEnabled: false**: Promoção manual obrigatória (você decide quando fazer o cutover)
- **scaleDownDelaySeconds: 30**: Aguarda 30 segundos após promoção antes de desligar a versão antiga

---

### 2. **Services - Active e Preview**

#### Service Active (Green)
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

**Função:** Aponta para os pods da versão **atualmente ativa** (Green)

---

#### Service Preview (Blue)
**Arquivo:** `linktree/helm/linktree/templates/service-preview.yaml`

```yaml
{{- if eq .Values.environment "dev" }}
apiVersion: v1
kind: Service
metadata:
  name: {{ include "linktree.fullname" . }}-preview
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
- Criado **apenas em DEV** (condicional `if eq .Values.environment "dev"`)
- Aponta para os pods da **nova versão** em preview (Blue)
- Permite testar a nova versão antes de promover

---

### 3. **Values - Configuração DEV**

**Arquivo:** `linktree/helm/linktree/values.dev.yaml`

```yaml
environment: dev

replicaCount: 2

image:
  pullPolicy: Always
  # Tag vem dos parâmetros do ArgoCD Application (não hardcoded aqui)

database:
  host: linktree-dev-postgresql-rw.dev.svc.cluster.local

postgresql:
  enabled: true
  environment: development
  cluster:
    name: linktree-dev-postgresql
    instances: 1
```

**Função:**
- Define `environment: dev` que ativa a estratégia BlueGreen
- Configura 2 réplicas para o backend
- **IMPORTANTE**: A tag da imagem NÃO está definida aqui, ela vem dos parâmetros do ArgoCD Application
- Configura PostgreSQL com 1 instância para DEV

---

### 4. **ArgoCD Application**

**Arquivo:** `argocd-gitops/argocd/apps/dev/backend-dev.yaml`

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: linktree-backend-dev
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/periclesanfe/linktree-app.git
    targetRevision: HEAD
    path: helm/linktree
    helm:
      releaseName: linktree-dev
      valueFiles:
        - values.dev.yaml
      parameters:
        - name: backend.enabled
          value: "true"
        - name: frontend.enabled
          value: "false"
        - name: image.repository
          value: ghcr.io/periclesanfe/linktree-backend
        - name: image.tag
          value: "1561e75"  # TAG DA IMAGEM (atualizada pelo CI/CD)
        - name: image.pullPolicy
          value: Always
  destination:
    server: https://kubernetes.default.svc
    namespace: dev
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

**Função:**
- Define qual repositório Git monitorar (`linktree-app`)
- Define qual branch usar (`HEAD` = branch atual)
- Define qual Helm chart usar (`helm/linktree`)
- **IMPORTANTE:** `image.tag` sobrescreve qualquer valor no values.yaml
- Sync automático: ArgoCD detecta mudanças e aplica automaticamente
- **Esta aplicação é gerenciada pela `root-app` (App of Apps pattern)**

---

### 5. **Root Application (App of Apps)**

**Arquivo:** `argocd-gitops/argocd/root-app.yaml`

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: root-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/periclesanfe/argocd-gitops.git
    targetRevision: develop  # Monitora branch develop
    path: argocd/apps        # Diretório com as definições das apps
    directory:
      recurse: true           # Busca recursivamente em subdiretórios
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

**Função:**
- **App of Apps Pattern**: Aplicação raiz que gerencia todas as outras aplicações
- Monitora o repositório `argocd-gitops` (branch develop)
- Quando um arquivo em `argocd/apps/` é modificado, automaticamente atualiza a aplicação correspondente
- **Deploy inicial único**: `kubectl apply -f argocd/root-app.yaml -n argocd`
- **Depois disso**: Todas as mudanças são automáticas via GitOps

---

### 6. **GitHub Actions - CI/CD Pipeline**

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
    BACKEND_FILE="argocd/apps/dev/backend-dev.yaml"
    yq eval -i ".spec.source.helm.parameters[] |= select(.name == \"image.tag\").value = \"${SHORT_SHA}\"" "$BACKEND_FILE"

- name: Commit and push changes
  run: |
    git commit -m "chore(dev): update images to ${{ steps.sha.outputs.short }} [skip ci]"
    git push origin develop  # Push para branch develop do argocd-gitops
```

**Função:**
1. **Build da imagem Docker** com tag igual ao commit SHA
2. **Push para GitHub Container Registry** (ghcr.io)
3. **Atualiza `image.tag`** no arquivo ArgoCD Application no repo `argocd-gitops`
4. **Commit e push** para o branch correto (develop → develop, main → main)
5. **root-app detecta** a mudança no repo GitOps
6. **ArgoCD atualiza** a aplicação `linktree-backend-dev` automaticamente
7. **Argo Rollouts inicia** o rollout BlueGreen automaticamente

---

## 🚀 Passo a Passo Mínimo - BlueGreen Deploy

### Pré-requisitos
- Cluster Kubernetes rodando
- ArgoCD instalado e configurado
- Argo Rollouts instalado
- CloudNativePG instalado
- **root-app deployada** (necessário apenas uma vez): `kubectl apply -f argocd-gitops/argocd/root-app.yaml -n argocd`

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

### **Passo 2: Push para branch develop**

```bash
git push origin develop
```

**O que acontece automaticamente:**
1. ✅ GitHub Actions detecta o push para `develop`
2. ✅ Build da imagem Docker com tag = commit SHA (ex: `a1b2c3d`)
3. ✅ Push da imagem para `ghcr.io/periclesanfe/linktree-backend:a1b2c3d`
4. ✅ Atualiza `image.tag` no arquivo `argocd-gitops/argocd/apps/dev/backend-dev.yaml`
5. ✅ Commit e push para o repositório `argocd-gitops`

---

### **Passo 3: root-app e ArgoCD detectam mudança**

**Aguarde 30-60 segundos** e verifique:

```bash
kubectl get applications -n argocd
# NAME                    SYNC STATUS   HEALTH STATUS
# root-app                Synced        Healthy
# linktree-backend-dev    Synced        Progressing
```

Fluxo automático:
1. ✅ **root-app** detecta mudança no repositório `argocd-gitops`
2. ✅ **root-app** atualiza a aplicação `linktree-backend-dev` com a nova `image.tag`
3. ✅ **ArgoCD** faz sync da aplicação e aplica o novo Helm chart
4. ✅ **Argo Rollouts** cria um novo ReplicaSet com a nova imagem (Blue)
5. ✅ Sobe 2 novos pods com a nova versão
6. ✅ Aponta o **preview service** para os novos pods
7. ✅ Mantém os pods antigos rodando (Green) no **active service**

---

### **Passo 4: Verificar estado do rollout**

```bash
kubectl argo rollouts get rollout linktree-dev-linktree-backend -n dev
```

**Saída esperada:**
```
Name:            linktree-dev-linktree-backend
Namespace:       dev
Status:          ◌ Progressing
Message:         active service cutover pending
Strategy:        BlueGreen
Images:          ghcr.io/periclesanfe/linktree-backend:4f49932 (stable, active)  ← VERSÃO ANTIGA (GREEN)
                 ghcr.io/periclesanfe/linktree-backend:1561e75 (preview)        ← NOVA VERSÃO (BLUE)
Replicas:
  Desired:       2
  Current:       4  ← 2 pods antigos + 2 pods novos
  Updated:       2
  Ready:         2
  Available:     2
```

**Neste momento você tem:**
- **2 pods rodando versão antiga** (Green) - acessíveis via service `linktree-backend-dev`
- **2 pods rodando versão nova** (Blue) - acessíveis via service `linktree-dev-linktree-backend-preview`

---

### **Passo 5: Testar a nova versão (Preview/Blue)**

```bash
# Abrir port-forward para o preview service
kubectl port-forward svc/linktree-dev-linktree-backend-preview 8080:8000 -n dev

# Em outro terminal, testar
curl http://localhost:8080/api/health
curl http://localhost:8080/api/links
# ... seus testes ...
```

**Verifique:**
- ✅ API está respondendo corretamente
- ✅ Funcionalidades novas estão funcionando
- ✅ Não há erros nos logs

```bash
# Ver logs dos pods novos
kubectl logs -l app.kubernetes.io/name=linktree-backend -n dev --tail=50 -f
```

---

### **Passo 6: Promover para produção (Cutover)**

Se os testes estiverem OK, promova manualmente:

```bash
kubectl argo rollouts promote linktree-dev-linktree-backend -n dev
```

**O que acontece:**
1. ✅ O **active service** (`linktree-backend-dev`) é redirecionado para os novos pods (Blue)
2. ✅ Os pods antigos (Green) são marcados para scale down
3. ✅ Após 30 segundos (`scaleDownDelaySeconds`), os pods antigos são removidos
4. ✅ A nova versão agora é a versão **stable** e **active**

---

### **Passo 7: Verificar rollout completo**

```bash
kubectl argo rollouts get rollout linktree-dev-linktree-backend -n dev
```

**Saída esperada:**
```
Name:            linktree-backend-dev
Namespace:       dev
Status:          ✔ Healthy
Strategy:        BlueGreen
Images:          ghcr.io/periclesanfe/linktree-backend:a1b2c3d (stable, active)  ← NOVA VERSÃO AGORA É ACTIVE
Replicas:
  Desired:       2
  Current:       2  ← Apenas os 2 pods novos
  Updated:       2
  Ready:         2
  Available:     2
```

**Verificar pods:**
```bash
kubectl get pods -n dev
# NAME                                  READY   STATUS    RESTARTS   AGE
# linktree-backend-dev-a1b2c3d-xxxxx    1/1     Running   0          5m
# linktree-backend-dev-a1b2c3d-yyyyy    1/1     Running   0          5m
# linktree-dev-postgresql-1             1/1     Running   0          2h
```

✅ **Deploy completo com sucesso!**

---

## 📊 Resumo do Fluxo

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Desenvolvedor faz commit e push para develop                │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. GitHub Actions:                                              │
│    - Build imagem Docker (tag = commit SHA)                     │
│    - Push para ghcr.io                                          │
│    - Atualiza image.tag no argocd-gitops repo (branch develop)  │
│    - Commit e push para argocd-gitops/develop                   │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. root-app detecta mudança no argocd-gitops repo               │
│    - Monitora argocd/apps/ directory recursivamente             │
│    - Detecta que backend-dev.yaml foi atualizado                │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. ArgoCD atualiza aplicação linktree-backend-dev               │
│    - Inicia sync automático                                     │
│    - Aplica novo Helm chart com nova image.tag                  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Argo Rollouts inicia BlueGreen deployment:                   │
│    - Cria novo ReplicaSet com nova imagem (BLUE)                │
│    - Sobe 2 novos pods                                          │
│    - Preview service aponta para novos pods                     │
│    - Active service ainda aponta para pods antigos (GREEN)      │
│    - Status: Progressing - aguardando promoção manual           │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Desenvolvedor testa preview service:                         │
│    - kubectl port-forward svc/...-preview 8080:8000 -n dev      │
│    - Testa endpoints, funcionalidades, logs                     │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Desenvolvedor promove manualmente:                           │
│    - kubectl argo rollouts promote linktree-dev-linktree-...    │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. Argo Rollouts finaliza BlueGreen:                            │
│    - Active service redirecionado para novos pods (BLUE)        │
│    - Pods antigos (GREEN) são desligados após 30s               │
│    - Status: Healthy                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Comandos Úteis

### Monitorar rollout em tempo real
```bash
kubectl argo rollouts get rollout linktree-dev-linktree-backend -n dev --watch
```

### Ver histórico de rollouts
```bash
kubectl argo rollouts history linktree-dev-linktree-backend -n dev
```

### Fazer rollback (voltar para versão anterior)
```bash
kubectl argo rollouts undo linktree-dev-linktree-backend -n dev
```

### Abortar rollout em andamento
```bash
kubectl argo rollouts abort linktree-dev-linktree-backend -n dev
```

### Ver logs da aplicação
```bash
kubectl logs -l app.kubernetes.io/name=linktree-backend -n dev --tail=100 -f
```

### Ver todas as aplicações ArgoCD
```bash
kubectl get applications -n argocd
```

### Forçar sync manual no ArgoCD (caso auto-sync não funcione)
```bash
kubectl -n argocd patch application linktree-backend-dev --type merge -p '{"operation":{"initiatedBy":{"username":"admin"},"sync":{"revision":"HEAD"}}}'
```

---

## ⚠️ Troubleshooting

### Rollout stuck em "Progressing"
**Causa:** Aguardando promoção manual (comportamento esperado)
**Solução:**
```bash
kubectl argo rollouts promote linktree-dev-linktree-backend -n dev
```

### Pods não inicializam (CrashLoopBackOff)
**Causa:** Erro na aplicação ou falta de variáveis de ambiente
**Solução:**
```bash
kubectl logs <pod-name> -n dev
kubectl describe pod <pod-name> -n dev
```

### ArgoCD não detecta mudanças
**Causa:** Cache ou delay de sincronização
**Solução:**
```bash
# Forçar refresh
kubectl -n argocd patch application linktree-backend-dev --type merge -p '{"operation":{"initiatedBy":{"username":"admin"},"sync":{"revision":"HEAD"}}}'
```

### GitHub Actions falha no push para argocd-gitops
**Causa:** Token `GITOPS_PAT` sem permissões
**Solução:** Verificar secret `GITOPS_PAT` no GitHub repository settings

---

## 🎯 Vantagens do BlueGreen

✅ **Zero downtime**: Nova versão sobe antes da antiga desligar
✅ **Rollback instantâneo**: Basta redirecionar o service de volta
✅ **Testes em produção**: Preview service permite testar antes de promover
✅ **Promoção manual**: Você decide quando fazer o cutover (autoPromotionEnabled: false)
✅ **Segurança**: Duas versões rodando simultaneamente durante a transição

---

## 📚 Referências

- [Argo Rollouts - BlueGreen Strategy](https://argoproj.github.io/argo-rollouts/features/bluegreen/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [CloudNativePG Documentation](https://cloudnative-pg.io/)
