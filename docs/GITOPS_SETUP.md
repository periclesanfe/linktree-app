# 🔧 Guia de Setup GitOps - Linktree

Este guia completo mostra como configurar todo o ecossistema GitOps do zero.

## 📋 Pré-requisitos

### Ferramentas Necessárias

```bash
# Verificar instalações
kubectl version --client
helm version
argocd version --client
git --version
```

Se não tiver, instale:

- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Helm 3+](https://helm.sh/docs/intro/install/)
- [ArgoCD CLI](https://argo-cd.readthedocs.io/en/stable/cli_installation/)

### Cluster Kubernetes

Você precisa de acesso a um cluster. Opções:

- **Local**: minikube, kind, k3s
- **Cloud**: GKE, EKS, AKS
- **Gerenciado**: DigitalOcean, Linode

```bash
# Verificar acesso
kubectl cluster-info
kubectl get nodes
```

## 🚀 Passo 1: Criar Repositório GitOps

### 1.1 Criar no GitHub

1. Acesse: https://github.com/new
2. Nome: `argocd-gitops`
3. Visibilidade: **Privado**
4. NÃO inicialize com README
5. Create repository

### 1.2 Clonar e Configurar

```bash
# Clonar repositório vazio
git clone https://github.com/periclesanfe/argocd-gitops.git
cd argocd-gitops

# Copiar templates do repo linktree
cp -r ../linktree/docs/gitops-templates/* .

# Verificar estrutura
tree
```

Estrutura esperada:

```
argocd-gitops/
├── README.md
├── .gitignore
├── operators/
│   └── cloudnative-pg.yaml
└── environments/
    ├── dev/
    │   ├── application.yaml
    │   └── postgres-cluster.yaml
    └── prod/
        ├── application.yaml
        └── postgres-cluster.yaml
```

### 1.3 Commit Inicial

```bash
# Adicionar arquivos
git add .

# Commit
git commit -m "chore: initial gitops structure"

# Push
git push origin main
```

## 🗃️ Passo 2: Instalar CloudNativePG Operator

### 2.1 Instalar Operador

```bash
# Aplicar manifest
kubectl apply -f operators/cloudnative-pg.yaml

# Aguardar pods ficarem prontos
kubectl wait --for=condition=Ready pods --all -n cnpg-system --timeout=300s

# Verificar instalação
kubectl get pods -n cnpg-system
```

Saída esperada:

```
NAME                                    READY   STATUS    RESTARTS   AGE
cnpg-controller-manager-xxx-yyy         1/1     Running   0          1m
```

### 2.2 Criar Clusters PostgreSQL

```bash
# Criar namespaces
kubectl create namespace dev
kubectl create namespace prod

# Aplicar cluster dev
kubectl apply -f environments/dev/postgres-cluster.yaml

# Aplicar cluster prod
kubectl apply -f environments/prod/postgres-cluster.yaml

# Verificar status
kubectl get cluster -n dev
kubectl get cluster -n prod
```

Aguarde até `READY` ficar `true`:

```bash
# Monitorar dev
kubectl get cluster -n dev -w

# Monitorar prod
kubectl get cluster -n prod -w
```

### 2.3 Testar Conexão

```bash
# Pegar senha do dev
DEV_PASSWORD=$(kubectl get secret linktree-dev-db-credentials -n dev -o jsonpath='{.data.password}' | base64 -d)

# Conectar ao banco
kubectl run -it --rm psql-client \
  --image=postgres:16-alpine \
  --restart=Never \
  -n dev -- \
  psql -h linktree-dev-postgresql-rw \
       -U linktree_dev_user \
       -d linktree_dev

# No prompt do PostgreSQL:
\dt  # Listar tabelas (ainda vazio)
\q   # Sair
```

## 🤖 Passo 3: Instalar ArgoCD

### 3.1 Instalar no Cluster

```bash
# Criar namespace
kubectl create namespace argocd

# Instalar ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Aguardar pods ficarem prontos
kubectl wait --for=condition=Ready pods --all -n argocd --timeout=600s

# Verificar instalação
kubectl get pods -n argocd
```

### 3.2 Acessar ArgoCD UI

```bash
# Port-forward
kubectl port-forward svc/argocd-server -n argocd 8080:443 &

# Pegar senha inicial
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)

echo "ArgoCD Password: $ARGOCD_PASSWORD"

# Abrir navegador
open https://localhost:8080
# Ou: http://localhost:8080
```

Login:
- Username: `admin`
- Password: (valor de `$ARGOCD_PASSWORD`)

### 3.3 Login via CLI

```bash
# Login
argocd login localhost:8080 --username admin --password $ARGOCD_PASSWORD --insecure

# Alterar senha (recomendado)
argocd account update-password
```

### 3.4 Adicionar Repositório Git

```bash
# Adicionar repo linktree
argocd repo add https://github.com/periclesanfe/linktree --name linktree

# Verificar
argocd repo list
```

Se o repo for **privado**, crie um token:

```bash
# GitHub → Settings → Developer settings → Personal access tokens → Generate new token
# Scopes: repo

# Adicionar com token
argocd repo add https://github.com/periclesanfe/linktree \
  --username periclesanfe \
  --password ghp_YOUR_GITHUB_TOKEN
```

## 🎯 Passo 4: Criar Applications no ArgoCD

### 4.1 Aplicar via kubectl

```bash
# Voltar para repo gitops
cd argocd-gitops

# Aplicar dev
kubectl apply -f environments/dev/application.yaml

# Aplicar prod
kubectl apply -f environments/prod/application.yaml

# Verificar
kubectl get applications -n argocd
argocd app list
```

### 4.2 Sincronizar Aplicações

```bash
# Sync dev (primeira vez)
argocd app sync linktree-dev

# Sync prod (primeira vez)
argocd app sync linktree-prod

# Ver status
argocd app get linktree-dev
argocd app get linktree-prod
```

### 4.3 Monitorar no UI

Abra https://localhost:8080 e veja:

- Aplicações criadas
- Recursos sendo sincronizados
- Health status de cada componente

## 🔐 Passo 5: Configurar GitHub Actions

### 5.1 Criar Personal Access Token

No GitHub:

1. Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Note: `GitOps Automation`
4. Scopes:
   - [x] `repo` (Full control of private repositories)
5. Generate token
6. **Copie o token** (só aparece uma vez!)

### 5.2 Adicionar Secret ao Repositório

No repo `linktree`:

1. Settings → Secrets and variables → Actions
2. New repository secret
3. Name: `GITOPS_PAT`
4. Value: (colar o token)
5. Add secret

### 5.3 Verificar Workflow

```bash
# No repo linktree
cd linktree

# Verificar se workflow existe
cat .github/workflows/gitops-cicd.yml

# Fazer uma mudança de teste
echo "# GitOps Test" >> README.md

# Commit e push
git add README.md
git commit -m "test: trigger gitops pipeline"
git push
```

### 5.4 Acompanhar no GitHub Actions

1. Abra: https://github.com/periclesanfe/linktree/actions
2. Veja o workflow rodando
3. Aguarde conclusão (3-5 min)

## ✅ Passo 6: Validar Setup

### 6.1 Verificar Recursos

```bash
# Pods em dev
kubectl get pods -n dev

# Pods em prod
kubectl get pods -n prod

# Todos os recursos
kubectl get all -n prod
```

Esperado:

```
NAME                                         READY   STATUS    RESTARTS   AGE
pod/linktree-prod-backend-xxx-yyy            1/1     Running   0          5m
pod/linktree-prod-frontend-xxx-yyy           1/1     Running   0          5m
pod/linktree-prod-postgresql-1               1/1     Running   0          10m

NAME                                  TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)
service/linktree-prod-backend         ClusterIP   10.96.100.100   <none>        8000/TCP
service/linktree-prod-frontend        ClusterIP   10.96.100.101   <none>        80/TCP
service/linktree-prod-postgresql-rw   ClusterIP   10.96.100.102   <none>        5432/TCP

NAME                                    READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/linktree-prod-backend   1/1     1            1           5m
deployment.apps/linktree-prod-frontend  1/1     1            1           5m
```

### 6.2 Verificar Logs

```bash
# Backend logs
kubectl logs -n prod -l app.kubernetes.io/component=backend --tail=50

# Deve mostrar:
# [timestamp] info: 🚀 Server running on port 8000
# [timestamp] info: 📝 Environment: production
# [timestamp] info: 🔒 CORS enabled for: ...
```

### 6.3 Testar Aplicação

```bash
# Port-forward frontend
kubectl port-forward -n prod svc/linktree-prod-frontend 3000:80 &

# Port-forward backend
kubectl port-forward -n prod svc/linktree-prod-backend 8000:8000 &

# Testar backend health
curl http://localhost:8000/api/health

# Resposta esperada:
# {"status":"healthy","timestamp":"...","uptime":123}

# Abrir frontend no navegador
open http://localhost:3000
```

### 6.4 Verificar Job de Migração

```bash
# Ver jobs
kubectl get jobs -n prod

# Ver logs do migration job
kubectl logs -n prod -l app.kubernetes.io/component=db-migration

# Conectar ao banco e verificar tabelas
kubectl run -it --rm psql-client \
  --image=postgres:16-alpine \
  --restart=Never \
  -n prod -- \
  psql -h linktree-prod-postgresql-rw \
       -U linktree_prod_user \
       -d linktree_prod \
       -c "\dt"

# Deve mostrar as tabelas:
# - users
# - links
# - social_icons
# - analytics_clicks
```

## 🔄 Passo 7: Testar Deploy Automático

### 7.1 Fazer Mudança no Código

```bash
cd linktree

# Fazer uma mudança no backend
vim linktree-backend/src/index.js
# Adicionar um comentário ou alterar alguma resposta

# Commit e push
git add .
git commit -m "feat: test automatic deployment"
git push origin main
```

### 7.2 Acompanhar Pipeline

1. **GitHub Actions** (3-5 min):
   - Build de imagens
   - Push para ghcr.io
   - Update do GitOps repo

2. **GitOps Repo**:
   ```bash
   cd argocd-gitops
   git pull
   # Ver commit automático do GitHub Actions
   git log -1
   ```

3. **ArgoCD** (1-3 min):
   ```bash
   # Monitorar sincronização
   argocd app get linktree-prod --watch
   
   # Ou no UI: https://localhost:8080
   ```

4. **Kubernetes**:
   ```bash
   # Ver rolling update
   kubectl get pods -n prod -w
   
   # Ver nova imagem
   kubectl get deployment linktree-prod-backend -n prod -o jsonpath='{.spec.template.spec.containers[0].image}'
   ```

## 🎉 Setup Completo!

Agora você tem:

- ✅ Repositório GitOps configurado
- ✅ CloudNativePG operador instalado
- ✅ Bancos de dados PostgreSQL (dev e prod)
- ✅ ArgoCD instalado e configurado
- ✅ Applications do ArgoCD criadas
- ✅ GitHub Actions com pipeline GitOps
- ✅ Deploy automático funcionando

## 📚 Próximos Passos

1. **Sealed Secrets**: Criptografar secrets
   ```bash
   kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml
   ```

2. **Ingress Controller**: Expor aplicação
   ```bash
   helm install ingress-nginx ingress-nginx/ingress-nginx
   ```

3. **Cert-Manager**: SSL automático
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
   ```

4. **Monitoring**: Prometheus + Grafana
   ```bash
   helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack
   ```

## 🐛 Troubleshooting

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para troubleshooting detalhado.

### Problemas Comuns

**ArgoCD não sincroniza:**
```bash
argocd app sync linktree-prod --force
```

**Pods não iniciam:**
```bash
kubectl describe pod POD_NAME -n prod
kubectl logs POD_NAME -n prod
```

**Banco não conecta:**
```bash
kubectl get cluster -n prod
kubectl logs -n cnpg-system -l app.kubernetes.io/name=cloudnative-pg
```

## 📖 Documentação Adicional

- [Deployment Guide](./DEPLOYMENT.md)
- [Helm Chart README](../helm/README.md)
- [Setup Guide](../helm/SETUP_GUIDE.md)

---

**Última atualização**: 2024-11-08  
**Mantido por**: DevOps Team
