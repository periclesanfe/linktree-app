# 🚀 Guia Completo: Setup Local do Linktree

Este guia mostra como fazer o setup completo do projeto em um novo computador, do zero.

## 📋 Pré-requisitos

### 1. Instalar Ferramentas Necessárias

```bash
# Homebrew (se não tiver)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Docker Desktop
# Baixar de: https://www.docker.com/products/docker-desktop

# Kubectl
brew install kubectl

# Helm
brew install helm

# Minikube
brew install minikube
```

### 2. Clonar o Projeto

```bash
cd ~/Documents/GitHub
git clone https://github.com/periclesanfe/linktree-app.git
cd linktree-app
```

---

## 🎯 Setup Completo do Zero

### Passo 1: Iniciar Cluster Minikube

```bash
# Iniciar Minikube com recursos adequados
minikube start --cpus=4 --memory=7000 --driver=docker --kubernetes-version=v1.28.0

# Verificar que está rodando
kubectl cluster-info
kubectl get nodes
```

**Saída esperada:**
```
NAME       STATUS   ROLES           AGE   VERSION
minikube   Ready    control-plane   1m    v1.28.0
```

---

### Passo 2: Instalar ArgoCD

```bash
# Criar namespace
kubectl create namespace argocd

# Instalar ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Aguardar pods ficarem prontos (leva ~2-3 minutos)
kubectl wait --for=condition=Ready pods --all -n argocd --timeout=300s

# Verificar instalação
kubectl get pods -n argocd
```

**Obter senha do ArgoCD:**
```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d && echo
```

**Acessar UI (em outro terminal):**
```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Acesse: https://localhost:8080
# User: admin
# Senha: (a que você obteve acima)
```

---

### Passo 3: Instalar CloudNativePG Operator

```bash
# Instalar operador oficial
kubectl apply --server-side -f https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.24/releases/cnpg-1.24.1.yaml

# Aguardar operador ficar pronto
kubectl wait --for=condition=Ready pods --all -n cnpg-system --timeout=300s

# Verificar
kubectl get pods -n cnpg-system
```

---

### Passo 4: Criar PostgreSQL (Opção Simples para Dev)

Para desenvolvimento local, vamos usar um PostgreSQL simples:

```bash
# Criar namespace dev
kubectl create namespace dev

# Aplicar PostgreSQL simples
kubectl apply -f k8s/postgres-simple.yaml

# Aguardar PostgreSQL ficar pronto
kubectl wait --for=condition=Ready pod/postgres-0 -n dev --timeout=120s

# Verificar
kubectl get pods -n dev
```

---

### Passo 5: Buildar Imagens Localmente

```bash
# Configurar Docker para usar daemon do Minikube
eval $(minikube docker-env)

# Buildar backend
cd linktree-backend
docker build -t ghcr.io/periclesanfe/linktree-backend:dev-latest .

# Buildar frontend
cd ../linktree-app
docker build -t ghcr.io/periclesanfe/linktree-frontend:dev-latest .

# Verificar imagens
docker images | grep linktree
```

**Saída esperada:**
```
ghcr.io/periclesanfe/linktree-frontend   dev-latest   ...   50.1MB
ghcr.io/periclesanfe/linktree-backend    dev-latest   ...   177MB
```

---

### Passo 6: Deploy com Helm

```bash
# Voltar para raiz do projeto
cd ..

# Deploy da aplicação
helm install linktree-dev ./helm -f ./helm/values.dev.yaml --namespace dev

# Aguardar pods ficarem prontos
kubectl wait --for=condition=Ready pods -l app.kubernetes.io/instance=linktree-dev -n dev --timeout=120s

# Verificar status
kubectl get pods -n dev
```

**Saída esperada:**
```
NAME                                     READY   STATUS      RESTARTS   AGE
linktree-dev-backend-...                 1/1     Running     0          1m
linktree-dev-frontend-...                1/1     Running     0          1m
linktree-dev-db-migration-...            0/1     Completed   0          1m
postgres-0                               1/1     Running     0          5m
```

---

### Passo 7: Acessar a Aplicação

```bash
# Port-forward backend e frontend
kubectl port-forward -n dev svc/linktree-dev-backend 8000:8000 &
kubectl port-forward -n dev svc/linktree-dev-frontend 3000:80 &

# Verificar health do backend
curl http://localhost:8000/api/health
```

**Acessar no navegador:**
- **Frontend**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Perfil de Teste**: http://localhost:3000/teste
- **Admin**: http://localhost:3000/admin

**Credenciais de Teste:**
- Email: `teste@t.com`
- Senha: `123`

---

## 🔄 Comandos Úteis

### Verificar Status Geral

```bash
# Ver todos os pods
kubectl get pods -n dev

# Ver logs do backend
kubectl logs -n dev -l app.kubernetes.io/component=backend -f

# Ver logs do frontend
kubectl logs -n dev -l app.kubernetes.io/component=frontend -f

# Ver logs da migração
kubectl logs -n dev -l app.kubernetes.io/component=db-migration
```

### Reiniciar Aplicação

```bash
# Deletar pods (serão recriados automaticamente)
kubectl delete pods -n dev -l app.kubernetes.io/instance=linktree-dev

# Aguardar ficarem prontos
kubectl wait --for=condition=Ready pods -l app.kubernetes.io/instance=linktree-dev -n dev --timeout=120s
```

### Rebuild e Redeploy

```bash
# Configurar Docker do Minikube
eval $(minikube docker-env)

# Rebuild backend
cd linktree-backend
docker build -t ghcr.io/periclesanfe/linktree-backend:dev-latest .

# Rebuild frontend
cd ../linktree-app
docker build -t ghcr.io/periclesanfe/linktree-frontend:dev-latest .

# Voltar para raiz
cd ..

# Upgrade Helm
helm upgrade linktree-dev ./helm -f ./helm/values.dev.yaml --namespace dev

# Deletar pods para usar novas imagens
kubectl delete pods -n dev -l app.kubernetes.io/instance=linktree-dev
```

### Acessar Banco de Dados

```bash
# Conectar ao PostgreSQL
kubectl exec -it -n dev postgres-0 -- psql -U linktree_dev_user -d linktree_dev

# Dentro do psql:
# \dt                    -- listar tabelas
# SELECT * FROM users;   -- ver usuários
# \q                     -- sair
```

### Limpar Tudo

```bash
# Deletar aplicação
helm uninstall linktree-dev -n dev

# Deletar namespace
kubectl delete namespace dev

# Parar Minikube
minikube stop

# Deletar cluster completamente (se quiser começar do zero)
minikube delete
```

---

## 🐛 Troubleshooting

### Pods com ImagePullBackOff

**Problema:** Pods não conseguem fazer pull das imagens

**Solução:** 
```bash
# Verificar se está usando Docker do Minikube
eval $(minikube docker-env)

# Rebuild imagens
docker build -t ghcr.io/periclesanfe/linktree-backend:dev-latest ./linktree-backend
docker build -t ghcr.io/periclesanfe/linktree-frontend:dev-latest ./linktree-app

# Deletar pods
kubectl delete pods -n dev -l app.kubernetes.io/instance=linktree-dev
```

### PostgreSQL não inicia

**Problema:** Pod postgres-0 fica em Pending ou CrashLoopBackOff

**Solução:**
```bash
# Verificar eventos
kubectl describe pod postgres-0 -n dev

# Deletar e recriar
kubectl delete -f k8s/postgres-simple.yaml
kubectl apply -f k8s/postgres-simple.yaml
```

### Migration Job falhou

**Problema:** Job de migração com status Error ou Failed

**Solução:**
```bash
# Ver logs da migração
kubectl logs -n dev -l app.kubernetes.io/component=db-migration

# Executar migration manualmente
cat db-init/init.sql | kubectl exec -i -n dev postgres-0 -- psql -U linktree_dev_user -d linktree_dev
```

### Port-forward não funciona

**Problema:** Não consegue acessar http://localhost:3000

**Solução:**
```bash
# Matar processos antigos
pkill -f "port-forward"

# Reiniciar port-forwards
kubectl port-forward -n dev svc/linktree-dev-backend 8000:8000 &
kubectl port-forward -n dev svc/linktree-dev-frontend 3000:80 &
```

---

## 📚 Próximos Passos

Após o setup local funcionando:

1. **Configurar CI/CD**: As imagens serão buildadas automaticamente no GitHub Actions
2. **Deploy com ArgoCD**: Sync automático via GitOps
3. **Ambiente de Produção**: Usar CloudNativePG para PostgreSQL com HA

---

## 🎯 Checklist de Setup

- [ ] Minikube instalado e rodando
- [ ] ArgoCD instalado
- [ ] CloudNativePG Operator instalado
- [ ] PostgreSQL rodando em namespace `dev`
- [ ] Imagens buildadas localmente
- [ ] Helm chart deployed
- [ ] Pods em estado `Running`
- [ ] Migration executada com sucesso
- [ ] Port-forwards funcionando
- [ ] Frontend acessível em http://localhost:3000
- [ ] Backend health check respondendo
- [ ] Login funcionando com usuário de teste

---

**Tempo estimado de setup:** 15-20 minutos

**Dificuldade:** Intermediária

**Suporte:** https://github.com/periclesanfe/linktree/issues
