# 🎓 Guia de Apresentação - Linktree GitOps Modular

> **Objetivo**: Demonstrar aplicação full-stack rodando em Kubernetes com GitOps (ArgoCD) usando arquitetura modular com múltiplas applications separadas

**Tempo estimado**: 10-15 minutos

---

## 🏗️ Arquitetura Modular

**6 ArgoCD Applications Independentes:**
- `linktree-dev-database` - PostgreSQL (CloudNativePG)
- `linktree-dev-backend` - API Node.js + Express
- `linktree-dev-frontend` - SPA React + Vite
- `linktree-prod-database` - PostgreSQL (Prod)
- `linktree-prod-backend` - API (Prod)
- `linktree-prod-frontend` - SPA (Prod)

**Benefícios:**
- ✅ Deploy independente por componente
- ✅ Rollback granular
- ✅ Observabilidade separada
- ✅ Equipes autônomas

---

## 🚀 Setup Completo (Um Comando)

```bash
cd linktree-app
./scripts/apresentacao.sh --auto
```

**Resultado após ~10-12 minutos:**
- ✅ Cluster Minikube rodando (4 CPUs, 7GB RAM)
- ✅ ArgoCD instalado e acessível
- ✅ CloudNativePG Operator instalado
- ✅ **3 Applications ArgoCD separadas** (database, backend, frontend)
- ✅ PostgreSQL com CloudNativePG operacional
- ✅ Backend e Frontend deployados
- ✅ GitOps ativo com auto-sync e self-healing
- ✅ Port-forwards configurados e validados

**Acessos:**
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Backend Health: http://localhost:8000/api/health
- ArgoCD UI: https://localhost:8080
  - Username: `admin`
  - Password: (exibida no output do script)

---

## 🎤 Demonstrações para Apresentação

### 1. Arquitetura Modular - Múltiplas Applications

```bash
# Ver todas as applications criadas
argocd app list | grep linktree

# Output esperado:
# linktree-dev-database    Synced    Healthy
# linktree-dev-backend     Synced    Healthy
# linktree-dev-frontend    Synced    Healthy
```

**Mostrar na UI do ArgoCD:**
- Abra https://localhost:8080
- Veja as 3 applications separadas
- Clique em cada uma para ver seus recursos

---

### 2. Independência de Deploy

```bash
# Deploy apenas do backend (não afeta database e frontend)
argocd app sync linktree-dev-backend

# Ver histórico apenas do backend
argocd app history linktree-dev-backend

# Rollback apenas do backend
argocd app rollback linktree-dev-backend
```

**Demonstração prática:**
```bash
# Deletar apenas o backend
argocd app delete linktree-dev-backend --yes

# Database e Frontend continuam funcionando!
kubectl get pods -n dev

# Recriar backend
kubectl apply -f argocd/dev/backend.yaml
```

---

### 3. Self-Healing Granular

```bash
# Escalar manualmente apenas o frontend
kubectl scale deployment/linktree-dev-frontend -n dev --replicas=5

# ArgoCD detecta drift e reverte APENAS o frontend em ~30s
# Backend e Database não são afetados
watch argocd app get linktree-dev-frontend
```

**Observar:**
- Apenas `linktree-dev-frontend` mostra status "OutOfSync"
- Backend e Database permanecem "Synced"
- ArgoCD reverte apenas o frontend para 1 replica

---

### 4. Sync Waves - Ordem de Deploy

```bash
# Ver ordem de sincronização (sync waves)
kubectl get applications -n argocd \
  -o custom-columns=NAME:.metadata.name,WAVE:.metadata.annotations.argocd\\.argoproj\\.io/sync-wave

# Output:
# NAME                        WAVE
# linktree-dev-database       -2    ← Sobe primeiro
# linktree-dev-backend         0    ← Sobe depois do DB
# linktree-dev-frontend        1    ← Sobe por último
```

**Demonstração:**
```bash
# Deletar todas as apps
argocd app delete linktree-dev-database linktree-dev-backend linktree-dev-frontend --yes

# Recriar via ApplicationSet
kubectl apply -f argocd/applicationset.yaml

# Observar ordem de criação
watch kubectl get applications -n argocd
```

---

### 5. Rollback Independente

```bash
# Ver histórico apenas do backend
argocd app history linktree-dev-backend

# Rollback apenas do backend para revisão 3
argocd app rollback linktree-dev-backend 3

# Database e Frontend não são afetados
argocd app list | grep linktree
```

---

### 6. Observabilidade Separada

```bash
# Logs apenas do backend
argocd app logs linktree-dev-backend

# Status apenas do frontend
argocd app get linktree-dev-frontend

# Métricas apenas do database
kubectl top pods -n dev -l cnpg.io/cluster=linktree-dev-database-postgresql
```

---

### 7. Alta Disponibilidade do Database

```bash
# Deletar pod do PostgreSQL
kubectl delete pod linktree-dev-database-postgresql-1 -n dev

# CloudNativePG Operator recria automaticamente em ~10s
watch kubectl get pods -n dev -l cnpg.io/cluster=linktree-dev-database-postgresql

# Backend continua funcionando (reconecta automaticamente)
curl http://localhost:8000/api/health
```

---

## 📊 Estrutura de Arquivos Modular

```bash
# Ver estrutura dos charts separados
ls -la helm/charts/

# Output:
# database/   - Chart do PostgreSQL
# backend/    - Chart da API
# frontend/   - Chart do SPA

# Ver applications do ArgoCD
ls -la argocd/

# Output:
# applicationset.yaml  - Gerencia todas as apps
# dev/                 - Apps individuais do DEV
# prod/                - Apps individuais do PROD
```

---

## 🎯 Comandos Úteis Durante Apresentação

### Verificar Status Geral
```bash
# Ver todas as applications
argocd app list

# Ver todos os recursos no namespace dev
kubectl get all -n dev

# Ver applications no ArgoCD
kubectl get applications -n argocd
```

### Gerenciar Port-Forwards
```bash
# Reiniciar port-forwards (se caírem)
./scripts/port-forward.sh restart dev

# Ver status dos port-forwards
./scripts/port-forward.sh status dev

# Parar port-forwards
./scripts/port-forward.sh stop dev
```

### Monitorar Sync
```bash
# Watch sync em tempo real
argocd app sync linktree-dev-backend --watch

# Ver eventos do ArgoCD
kubectl get events -n argocd --sort-by='.lastTimestamp'
```

### Acessar Aplicação
```bash
# Abrir frontend
open http://localhost:5173

# Testar backend
curl http://localhost:8000/api/health | jq

# Testar usuário de teste (senha: 123)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@t.com","password":"123"}'
```

---

## 🔄 Comparação: Antes vs Depois

### Antes (Monolítico)
```
ArgoCD
  └── linktree-dev (1 Application)
       ├── PostgreSQL
       ├── Backend
       └── Frontend

❌ Deploy tudo junto
❌ Rollback afeta tudo
❌ Logs misturados
```

### Depois (Modular)
```
ArgoCD
  ├── linktree-dev-database  (App 1)
  ├── linktree-dev-backend   (App 2)
  └── linktree-dev-frontend  (App 3)

✅ Deploy independente
✅ Rollback granular
✅ Logs separados
✅ Observabilidade por componente
```

---

## 🎬 Roteiro de Apresentação Sugerido

### 1. Introdução (2 min)
- Explicar arquitetura modular
- Mostrar benefícios vs monolítico
- Apresentar as 6 applications

### 2. Demo do Setup (3 min)
- Rodar `./scripts/apresentacao.sh --auto`
- Mostrar output com validações
- Acessar ArgoCD UI
- Mostrar as 3 applications separadas

### 3. Demo de Independência (3 min)
- Deletar apenas backend
- Mostrar que database/frontend continuam
- Recriar backend
- Mostrar sync automático

### 4. Demo de Self-Healing (2 min)
- Escalar frontend manualmente
- Mostrar ArgoCD revertendo
- Apenas frontend é afetado

### 5. Demo de Sync Waves (2 min)
- Mostrar ordem de sincronização
- Explicar dependências (DB → Backend → Frontend)

### 6. Demo de Rollback (2 min)
- Ver histórico de backend
- Fazer rollback apenas do backend
- Database e frontend não afetados

### 7. Conclusão (1 min)
- Resumir benefícios da arquitetura modular
- Mostrar facilidade de gerenciamento
- Q&A

---

## 🧹 Limpeza Pós-Apresentação

```bash
# Parar port-forwards
./scripts/port-forward.sh stop dev

# Deletar applications
argocd app delete linktree-dev-database linktree-dev-backend linktree-dev-frontend --yes

# Ou deletar via ApplicationSet
kubectl delete applicationset linktree -n argocd

# Limpar cluster completo (opcional)
./scripts/cleanup.sh
```

---

## 🐛 Troubleshooting

### Port-forwards não funcionam
```bash
# Verificar services
kubectl get svc -n dev

# Reiniciar port-forwards
./scripts/port-forward.sh restart dev

# Ver logs
cat /tmp/pf-dev-backend.log
cat /tmp/pf-dev-frontend.log
```

### Application não sincroniza
```bash
# Ver detalhes do erro
argocd app get linktree-dev-backend

# Forçar sync
argocd app sync linktree-dev-backend --force --prune

# Ver logs do ArgoCD
kubectl logs -n argocd deployment/argocd-application-controller
```

### Database não sobe
```bash
# Verificar operator
kubectl get pods -n cnpg-system

# Ver logs do cluster
kubectl logs -n dev -l cnpg.io/cluster=linktree-dev-database-postgresql

# Ver status do CRD
kubectl describe cluster linktree-dev-database-postgresql -n dev
```

---

## 📚 Documentação Adicional

- **[Migração Modular](MIGRACAO-MODULAR.md)** - Detalhes da refatoração
- **[ArgoCD Guide](argocd/README.md)** - Uso das applications
- **[Port-Forward Guide](scripts/README-PORT-FORWARD.md)** - Gerenciamento de portas

---

## ✅ Checklist Pré-Apresentação

- [ ] Docker Desktop rodando
- [ ] Minikube instalado
- [ ] kubectl instalado
- [ ] Helm 3 instalado
- [ ] ArgoCD CLI instalado
- [ ] Script `apresentacao.sh` testado
- [ ] Portas 5173, 8000 e 8080 livres
- [ ] Pelo menos 7GB de RAM livre
- [ ] Conexão à internet (para baixar imagens)

---

## 🎉 Pronto para Apresentação!

Com a arquitetura modular, você demonstra:
- ✅ **Separação de concerns** (database, backend, frontend)
- ✅ **Deploy independente** por componente
- ✅ **GitOps avançado** com múltiplas applications
- ✅ **Observabilidade granular**
- ✅ **Rollback sem downtime**
- ✅ **Self-healing inteligente**

**Boa sorte na apresentação!** 🚀
