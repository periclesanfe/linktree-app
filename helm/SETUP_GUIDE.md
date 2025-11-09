# Guia Completo de Setup - Etapa 2 (GitOps com Kubernetes)

Este guia detalha TODOS os passos necessários para migrar o projeto Linktree da Etapa 1 (deploy em VM) para a Etapa 2 (GitOps com Kubernetes).

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Criação do Repositório GitOps](#1-criação-do-repositório-gitops)
3. [Configuração do CloudNativePG](#2-configuração-do-cloudnativepg)
4. [Configuração do ArgoCD](#3-configuração-do-argocd)
5. [Atualização do GitHub Actions](#4-atualização-do-github-actions)
6. [Deploy Inicial](#5-deploy-inicial)
7. [Validação](#6-validação)
8. [Troubleshooting](#7-troubleshooting)

---

## Pré-requisitos

### Ferramentas Necessárias

- [kubectl](https://kubernetes.io/docs/tasks/tools/) - Cliente Kubernetes
- [helm](https://helm.sh/docs/intro/install/) - Gerenciador de pacotes Kubernetes
- [argocd CLI](https://argo-cd.readthedocs.io/en/stable/cli_installation/) - Cliente ArgoCD
- Acesso a um cluster Kubernetes (minikube, kind, GKE, EKS, AKS, etc.)

### Verificação

```bash
# Verificar ferramentas
kubectl version --client
helm version
argocd version --client

# Verificar acesso ao cluster
kubectl cluster-info
kubectl get nodes
```

---

## 1. Criação do Repositório GitOps

### 1.1 Criar novo repositório no GitHub

```bash
# No GitHub, criar repositório: argocd-gitops
# Clonar localmente
git clone https://github.com/periclesanfe/argocd-gitops.git
cd argocd-gitops
```

### 1.2 Estrutura do repositório

```bash
# Criar estrutura de diretórios
mkdir -p {bootstrap,apps/linktree,infrastructure}

# Estrutura final:
# argocd-gitops/
# ├── bootstrap/              # ArgoCD Applications
# │   ├── apps.yaml
# │   └── infrastructure.yaml
# ├── apps/                   # Aplicações
# │   └── linktree/
# │       ├── dev.yaml        # Application ArgoCD para dev
# │       ├── prod.yaml       # Application ArgoCD para prod
# │       ├── values.dev.yaml # Valores específicos de dev
# │       └── values.prod.yaml# Valores específicos de prod
# └── infrastructure/         # Infraestrutura
#     ├── cloudnativepg/
#     │   ├── operator.yaml
#     │   ├── cluster-dev.yaml
#     │   └── cluster-prod.yaml
#     └── ingress-nginx/
#         └── values.yaml
```

### 1.3 Copiar arquivos de exemplo

```bash
# Copiar exemplos do repositório principal para o GitOps
cd argocd-gitops

# Copiar Application manifests
cp ../linktree/helm/examples/argocd-application.yaml apps/linktree/

# Copiar configurações do PostgreSQL
cp ../linktree/helm/examples/cloudnativepg-cluster.yaml infrastructure/cloudnativepg/

# Copiar valores (ajustar conforme necessário)
cp ../linktree/helm/values.dev.yaml apps/linktree/
cp ../linktree/helm/values.prod.yaml apps/linktree/
```

### 1.4 Commit inicial

```bash
git add .
git commit -m "feat: initial GitOps structure"
git push origin main
```

---

## 2. Configuração do CloudNativePG

### 2.1 Instalar o Operador

```bash
# Adicionar Helm repository
helm repo add cnpg https://cloudnative-pg.github.io/charts
helm repo update

# Instalar operador no cluster
kubectl create namespace cnpg-system
helm install cnpg \
  --namespace cnpg-system \
  cnpg/cloudnative-pg

# Verificar instalação
kubectl get pods -n cnpg-system
```

### 2.2 Criar clusters PostgreSQL

```bash
# Aplicar configuração de dev
kubectl apply -f infrastructure/cloudnativepg/cluster-dev.yaml

# Aplicar configuração de prod
kubectl apply -f infrastructure/cloudnativepg/cluster-prod.yaml

# Verificar status dos clusters
kubectl get clusters -n dev
kubectl get clusters -n prod

# Aguardar clusters ficarem prontos
kubectl wait --for=condition=Ready cluster/linktree-dev-postgresql -n dev --timeout=300s
kubectl wait --for=condition=Ready cluster/linktree-prod-postgresql -n prod --timeout=300s
```

### 2.3 Verificar conectividade

```bash
# Pegar senha do banco (dev)
kubectl get secret linktree-dev-db-credentials -n dev -o jsonpath='{.data.password}' | base64 -d

# Port-forward para testar conexão
kubectl port-forward -n dev svc/linktree-dev-postgresql-rw 5432:5432

# Em outro terminal, testar com psql
psql -h localhost -U linktree_dev_user -d linktree_dev
```

---

## 3. Configuração do ArgoCD

### 3.1 Instalar ArgoCD

```bash
# Criar namespace
kubectl create namespace argocd

# Instalar ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Aguardar pods ficarem prontos
kubectl wait --for=condition=Ready pods --all -n argocd --timeout=300s

# Expor ArgoCD UI (método 1: Port-forward)
kubectl port-forward svc/argocd-server -n argocd 8080:443

# OU (método 2: LoadBalancer - se suportado)
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'
```

### 3.2 Obter senha inicial do admin

```bash
# Pegar senha inicial
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Login via CLI
argocd login localhost:8080 --username admin --password <senha-do-comando-acima>

# Alterar senha (recomendado)
argocd account update-password
```

### 3.3 Adicionar repositório Git

```bash
# Via CLI
argocd repo add https://github.com/periclesanfe/linktree --name linktree-app

# OU via UI: Settings → Repositories → Connect Repo
# - Method: VIA HTTPS
# - Type: git
# - Repository URL: https://github.com/periclesanfe/linktree
```

### 3.4 Criar Applications

```bash
# Aplicar Applications do ArgoCD
kubectl apply -f apps/linktree/dev.yaml
kubectl apply -f apps/linktree/prod.yaml

# Verificar status
argocd app list

# Sincronizar aplicações (primeira vez)
argocd app sync linktree-dev
argocd app sync linktree-prod
```

---

## 4. Atualização do GitHub Actions

### 4.1 Criar Personal Access Token (PAT)

No GitHub:
1. Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Nome: `GITOPS_PAT`
4. Scopes: `repo` (full control)
5. Copiar o token

### 4.2 Adicionar secret ao repositório principal

No repositório `linktree`:
1. Settings → Secrets and variables → Actions
2. New repository secret
3. Name: `GITOPS_PAT`
4. Value: (colar o token)

### 4.3 Atualizar workflow

```bash
# No repositório linktree
cd linktree

# Remover workflow antigo (se existir)
rm .github/workflows/deploy.yml

# Copiar novo workflow
cp helm/examples/github-actions-gitops.yaml .github/workflows/gitops.yml

# Commit e push
git add .github/workflows/
git commit -m "feat: update CI/CD to GitOps workflow"
git push
```

### 4.4 Configurar permissões do GITHUB_TOKEN

No repositório `linktree`:
1. Settings → Actions → General
2. Workflow permissions → Read and write permissions
3. Save

---

## 5. Deploy Inicial

### 5.1 Trigger do pipeline

```bash
# No repositório linktree, fazer uma mudança qualquer
echo "# GitOps Setup Complete" >> README.md
git add README.md
git commit -m "chore: trigger GitOps pipeline"
git push
```

### 5.2 Acompanhar o build

```bash
# No GitHub, ir para Actions e acompanhar o workflow
# Aguardar build das imagens e atualização do GitOps
```

### 5.3 Verificar sincronização no ArgoCD

```bash
# Via CLI
argocd app get linktree-dev
argocd app get linktree-prod

# OU via UI (http://localhost:8080)
# Ver status visual da sincronização
```

---

## 6. Validação

### 6.1 Verificar recursos Kubernetes

```bash
# Listar todos os recursos em dev
kubectl get all -n dev

# Listar todos os recursos em prod
kubectl get all -n prod

# Verificar ConfigMaps e Secrets
kubectl get configmaps,secrets -n prod

# Verificar logs do backend
kubectl logs -n prod -l app.kubernetes.io/component=backend --tail=50

# Verificar logs do frontend
kubectl logs -n prod -l app.kubernetes.io/component=frontend --tail=50

# Verificar Job de migração
kubectl get jobs -n prod
kubectl logs -n prod -l app.kubernetes.io/component=db-migration
```

### 6.2 Testar aplicação

```bash
# Port-forward do frontend (prod)
kubectl port-forward -n prod svc/linktree-prod-frontend 3000:80

# Port-forward do backend (prod)
kubectl port-forward -n prod svc/linktree-prod-backend 8000:8000

# Acessar no navegador
# Frontend: http://localhost:3000
# Backend: http://localhost:8000/api
```

### 6.3 Testar atualização automática

```bash
# Fazer mudança no código
cd linktree/linktree-backend/src
# Editar algum arquivo...

git add .
git commit -m "feat: test auto-deployment"
git push

# Aguardar:
# 1. GitHub Actions build (3-5 min)
# 2. GitOps repo update (automático)
# 3. ArgoCD sync (1-3 min se automated, senão manual)

# Verificar nova imagem deployada
kubectl get pods -n prod -l app.kubernetes.io/component=backend -o jsonpath='{.items[0].spec.containers[0].image}'
```

---

## 7. Troubleshooting

### Problemas Comuns

#### ArgoCD não sincroniza

```bash
# Forçar sincronização
argocd app sync linktree-prod --force

# Ver detalhes do erro
argocd app get linktree-prod

# Ver eventos
kubectl get events -n prod --sort-by='.lastTimestamp'
```

#### Job de migração falha

```bash
# Ver logs do job
kubectl logs -n prod -l app.kubernetes.io/component=db-migration

# Deletar job para retry (ArgoCD recriará)
kubectl delete job -n prod linktree-prod-db-migration

# Forçar novo sync
argocd app sync linktree-prod
```

#### Pods não iniciam

```bash
# Descrever pod com problema
kubectl describe pod -n prod <pod-name>

# Ver logs
kubectl logs -n prod <pod-name>

# Verificar se imagens estão acessíveis
docker pull ghcr.io/periclesanfe/linktree-backend:main-xxxxx
```

#### Problemas de autenticação GHCR

```bash
# Criar secret para pull de imagens (se repositório for privado)
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=periclesanfe \
  --docker-password=<GITHUB_PAT> \
  -n prod

# Atualizar values.prod.yaml para usar o secret
# backend.image.pullSecrets:
#   - name: ghcr-secret
```

#### Database não conecta

```bash
# Verificar status do cluster PostgreSQL
kubectl get cluster -n prod

# Ver logs do PostgreSQL
kubectl logs -n prod linktree-prod-postgresql-1

# Testar conectividade do pod
kubectl run -it --rm debug --image=postgres:16 --restart=Never -n prod -- \
  psql -h linktree-prod-postgresql-rw -U linktree_prod_user -d linktree_prod
```

---

## 📊 Checklist Final

- [ ] Repositório GitOps criado e configurado
- [ ] CloudNativePG operador instalado
- [ ] Clusters PostgreSQL (dev e prod) rodando
- [ ] ArgoCD instalado e acessível
- [ ] Applications do ArgoCD criadas (dev e prod)
- [ ] GitHub Actions atualizado para GitOps
- [ ] PAT configurado no repositório
- [ ] Pipeline executado com sucesso
- [ ] Imagens publicadas no GHCR
- [ ] GitOps repo atualizado automaticamente
- [ ] ArgoCD sincronizou aplicações
- [ ] Pods rodando em dev e prod
- [ ] Job de migração executado com sucesso
- [ ] Aplicação acessível e funcional
- [ ] Logs sem erros críticos

---

## 🎯 Próximos Passos Opcionais

1. **Sealed Secrets**: Criptografar secrets antes de commitar
2. **Ingress Controller**: Expor aplicação externamente
3. **Cert-Manager**: Certificados SSL automáticos
4. **Prometheus + Grafana**: Monitoramento e métricas
5. **HPA**: Auto-scaling baseado em carga
6. **Network Policies**: Segurança de rede
7. **Pod Security Policies**: Políticas de segurança
8. **Backup automático**: Configurar backups do PostgreSQL

---

## 📚 Referências

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [CloudNativePG Documentation](https://cloudnative-pg.io/documentation/)
- [Helm Best Practices](https://helm.sh/docs/chart_best_practices/)
- [GitOps Principles](https://opengitops.dev/)
- [12 Factor App](https://12factor.net/)
