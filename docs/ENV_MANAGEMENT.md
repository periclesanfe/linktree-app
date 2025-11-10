# 🔐 Guia de Gerenciamento de Variáveis de Ambiente

## 📋 Visão Geral

Este documento explica como as variáveis de ambiente são gerenciadas em diferentes ambientes:
- **Desenvolvimento Local** (Docker Compose)
- **Kubernetes** (Dev/Prod via Helm)

## 🏠 Desenvolvimento Local (Docker Compose)

### Arquivos `.env`

#### `.env` (raiz do projeto)
- ✅ **Usado por:** Docker Compose
- ✅ **Commitado:** NÃO (está no `.gitignore`)
- ✅ **Propósito:** Configuração local de desenvolvimento
- ✅ **Como usar:** 
  ```bash
  cp .env.example .env
  # Edite .env com suas credenciais locais
  docker-compose up
  ```

**Variáveis:**
```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua_senha_local
POSTGRES_DB=linktree_db
JWT_SECRET=seu_secret_local
```

#### `linktree-app/.env`
- ✅ **Usado por:** Frontend em desenvolvimento (Vite)
- ✅ **Commitado:** NÃO (está no `.gitignore`)
- ✅ **Propósito:** URL do backend para desenvolvimento
- ✅ **Como usar:**
  ```bash
  cd linktree-app
  cp .env.example .env
  npm run dev
  ```

**Variáveis:**
```bash
VITE_BACKEND_URL=http://localhost:3000
```

## ☸️ Kubernetes (via Helm)

### Como Funciona

**NÃO** usamos arquivos `.env` no Kubernetes. Todas as configurações vêm dos **Helm values**:

```
helm/
├── values.yaml          # Valores padrão
├── values.dev.yaml      # Sobrescreve para DEV
└── values.prod.yaml     # Sobrescreve para PROD
```

### Fluxo de Configuração

```
Helm Values → ConfigMaps/Secrets → Pods
```

#### 1️⃣ **Backend** (`linktree-backend`)

**ConfigMap:** `backend-configmap.yaml`
```yaml
env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: linktree-secret
        key: DATABASE_URL
  - name: JWT_SECRET
    valueFrom:
      secretKeyRef:
        name: linktree-secret
        key: JWT_SECRET
  - name: CORS_ORIGIN
    value: "{{ .Values.backend.corsOrigin }}"
```

**Definido em:**
- `values.dev.yaml`: `corsOrigin: "http://localhost:3000,http://linktree-dev.local"`
- `values.prod.yaml`: `corsOrigin: "https://linktree.example.com"`

#### 2️⃣ **Frontend** (`linktree-app`)

**ConfigMap:** `frontend-configmap.yaml`
```yaml
data:
  VITE_API_URL: "{{ .Values.frontend.apiUrl }}"
```

**Definido em:**
- `values.dev.yaml`: `apiUrl: "http://linktree-backend:8000"`
- `values.prod.yaml`: `apiUrl: "https://linktree.example.com/api"`

**Importante:** No Vite, variáveis com prefixo `VITE_` são injetadas em **build time**, não runtime. Por isso:
1. O Dockerfile faz o build da aplicação
2. O nginx serve os arquivos estáticos já com as variáveis injetadas

#### 3️⃣ **Database**

**Secret:** `secret.yaml`
```yaml
data:
  POSTGRES_USER: {{ .Values.database.user | b64enc }}
  POSTGRES_PASSWORD: {{ .Values.database.password | b64enc }}
  DATABASE_URL: {{ printf "postgresql://%s:%s@%s:%s/%s" ... | b64enc }}
  JWT_SECRET: {{ .Values.auth.jwtSecret | b64enc }}
```

**Definido em:**
- `values.dev.yaml`: 
  ```yaml
  database:
    host: "linktree-dev-postgresql"
    user: "linktree_dev_user"
    password: "dev_password_123"
  auth:
    jwtSecret: "dev-jwt-secret-key"
  ```
- `values.prod.yaml`:
  ```yaml
  database:
    host: "linktree-prod-postgresql"
    user: "linktree_prod_user"
    password: "REPLACE_WITH_SECURE_PASSWORD"
  auth:
    jwtSecret: "REPLACE_WITH_SECURE_JWT_SECRET"
  ```

## 🔒 Segurança

### ⚠️ Senhas em Produção

**NUNCA** commite senhas reais nos values files! Use uma das opções:

#### Opção 1: Sealed Secrets (Recomendado)
```bash
# Instalar Sealed Secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Criar secret selado
echo -n "minha-senha-super-secreta" | \
  kubectl create secret generic linktree-secret \
    --dry-run=client \
    --from-file=JWT_SECRET=/dev/stdin \
    -o yaml | \
  kubeseal -o yaml > sealed-secret.yaml
```

#### Opção 2: External Secrets Operator
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: linktree-secret
spec:
  secretStoreRef:
    name: vault-backend
  target:
    name: linktree-secret
  data:
    - secretKey: JWT_SECRET
      remoteRef:
        key: linktree/jwt-secret
```

#### Opção 3: Helm Values Override (Temporário)
```bash
# Passar valores sensíveis via CLI (não commitar)
helm install linktree-prod ./helm \
  -f helm/values.prod.yaml \
  --set auth.jwtSecret="$JWT_SECRET" \
  --set database.password="$DB_PASSWORD"
```

## 📝 Checklist de Deploy

### Desenvolvimento Local
- [ ] Copiar `.env.example` para `.env`
- [ ] Copiar `linktree-app/.env.example` para `linktree-app/.env`
- [ ] Editar valores conforme necessário
- [ ] Rodar `docker-compose up`

### Kubernetes Dev
- [ ] Verificar `helm/values.dev.yaml`
- [ ] Trocar senhas de exemplo por valores de dev
- [ ] Deploy:
  ```bash
  helm upgrade --install linktree-dev ./helm \
    -f helm/values.dev.yaml \
    --namespace dev \
    --create-namespace
  ```

### Kubernetes Prod
- [ ] **NÃO** commitar senhas reais
- [ ] Usar Sealed Secrets ou External Secrets
- [ ] Atualizar `helm/values.prod.yaml` (exceto senhas)
- [ ] Deploy via ArgoCD ou:
  ```bash
  helm upgrade --install linktree-prod ./helm \
    -f helm/values.prod.yaml \
    --set auth.jwtSecret="$JWT_SECRET" \
    --set database.password="$DB_PASSWORD" \
    --namespace prod \
    --create-namespace
  ```

## 🎯 Resumo

| Ambiente | Arquivo Config | Commitado? | Como Passar Secrets |
|----------|---------------|------------|---------------------|
| **Local Dev** | `.env` | ❌ NÃO | Copiar de `.env.example` |
| **Kubernetes Dev** | `values.dev.yaml` | ✅ SIM | Senhas de dev podem estar no arquivo |
| **Kubernetes Prod** | `values.prod.yaml` | ✅ SIM | ❌ Senhas via Sealed Secrets/External Secrets |

## 🔄 GitOps Workflow

```
1. Dev commita código → GitHub
2. GitHub Actions builda imagens → ghcr.io
3. GitHub Actions atualiza tags em argocd-gitops repo
4. ArgoCD detecta mudança no Git
5. ArgoCD faz sync com Kubernetes
6. Kubernetes cria Pods com variáveis dos Helm values
```

**Variáveis de ambiente fluem:**
```
values.yaml → ConfigMaps/Secrets → Containers
```

## 📚 Referências

- [12 Factor App - Config](https://12factor.net/config)
- [Helm Values Files](https://helm.sh/docs/chart_template_guide/values_files/)
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
- [External Secrets Operator](https://external-secrets.io/)
