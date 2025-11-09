# 🔄 GitOps Repository Templates

Este diretório contém todos os arquivos necessários para criar o repositório `argocd-gitops`.

## 📋 Como Usar

### 1. Criar o Repositório GitOps

No GitHub, crie um novo repositório:
- Nome: `argocd-gitops`
- Visibilidade: Privado
- Não inicialize com README

### 2. Clonar e Configurar

```bash
# Clonar o novo repositório
git clone https://github.com/periclesanfe/argocd-gitops.git
cd argocd-gitops

# Copiar os templates
cp -r ../linktree/docs/gitops-templates/* .

# Editar arquivos e substituir placeholders
# - SEU-USUARIO → periclesanfe
# - CHANGE-ME → senhas reais

# Commit inicial
git add .
git commit -m "chore: initial gitops setup"
git push origin main
```

### 3. Aplicar no Cluster

```bash
# Instalar operador PostgreSQL
kubectl apply -f operators/cloudnative-pg.yaml

# Criar bancos de dados
kubectl apply -f environments/dev/postgres-cluster.yaml
kubectl apply -f environments/prod/postgres-cluster.yaml

# Criar aplicações no ArgoCD
kubectl apply -f environments/dev/application.yaml
kubectl apply -f environments/prod/application.yaml
```

## 📁 Estrutura

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

## 🔐 Segurança

⚠️ **IMPORTANTE**: Antes de fazer commit:

1. Altere todas as senhas marcadas com `CHANGE-ME`
2. Considere usar Sealed Secrets para produção
3. Nunca commite tokens ou credenciais reais

## 📚 Próximos Passos

Após setup inicial, consulte:
- [Guia de Setup Completo](../GITOPS_SETUP.md)
- [Guia de Deployment](../DEPLOYMENT.md)
