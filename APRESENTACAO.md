# 🎓 Guia de Apresentação - Linktree GitOps

> **Objetivo**: Demonstrar aplicação full-stack rodando em Kubernetes com GitOps (ArgoCD) + Helm

**Tempo estimado**: 5-10 minutos

---

## 🚀 Setup Completo (Um Comando)

```bash
cd /Users/xxmra/Documents/GitHub/BRICELE-LINKTREE/linktree
./scripts/apresentacao.sh --auto
```

**Resultado após ~10 minutos:**
- ✅ Cluster Minikube rodando
- ✅ ArgoCD instalado e acessível
- ✅ PostgreSQL com CloudNativePG operacional
- ✅ Aplicação deployada via Helm
- ✅ GitOps ativo e sincronizado

**Acessos:**
- Frontend: http://localhost:5173
- Backend: http://localhost:8000/api/health
- ArgoCD UI: https://localhost:8080

---

## 🎤 Demonstrações para o Professor

### 1. GitOps - Auto Sync
```bash
argocd app get linktree-dev
# Mostrar na UI: Status sincronizado
```

### 2. Self-Healing
```bash
kubectl scale deployment/linktree-dev-frontend -n dev --replicas=5
# ArgoCD reverte automaticamente em ~30s
watch kubectl get deployments -n dev
```

### 3. Rollback Instantâneo
```bash
argocd app history linktree-dev
argocd app rollback linktree-dev <revision>
```

### 4. Alta Disponibilidade
```bash
kubectl delete pod linktree-dev-postgres-1 -n dev
# Operador recria em ~10s
watch kubectl get pods -n dev
```

---

## 🧹 Limpeza Pós-Apresentação

```bash
./scripts/cleanup.sh
```
