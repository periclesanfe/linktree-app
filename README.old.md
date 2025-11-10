# Projeto Linktree Clone - GitOps Edition

Este projeto é uma implementação full-stack de uma aplicação clone do Linktree, desenvolvida com as melhores práticas de **DevOps**, **GitOps**, **Kubernetes** e **12-Factor App**.

A aplicação permite que usuários se cadastrem, criem uma página de perfil pública e adicionem uma lista de links personalizáveis. Todo o deploy é automatizado usando **ArgoCD** e **GitHub Actions**.

## ✨ Funcionalidades

- 🔐 **Autenticação Completa:** Sistema de registro e login com tokens JWT
- 👤 **Página de Perfil Pública:** Cada usuário possui uma página `/:username` customizável
- 🔗 **Gerenciamento de Links (CRUD):** Painel administrativo completo
- 🎨 **Personalização:** Upload de imagem de perfil e capas para links
- 📈 **Análise de Cliques:** Sistema de tracking com estatísticas
- 📱 **Interface Reativa:** React com Vite, TypeScript e Tailwind CSS

## 🚀 Tecnologias Utilizadas

### Stack de Aplicação
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, React Router, Axios
- **Backend:** Node.js, Express.js, Winston (structured logging)
- **Banco de Dados:** PostgreSQL (CloudNativePG operator)
- **Autenticação:** JWT (JSON Web Tokens), bcryptjs
- **Upload de Arquivos:** Multer

### DevOps & Infraestrutura
- **Containers:** Docker, Docker Compose
- **Orquestração:** Kubernetes
- **GitOps:** ArgoCD
- **Package Management:** Helm 3
- **CI/CD:** GitHub Actions
- **Registry:** GitHub Container Registry (ghcr.io)
- **Logging:** Winston + Morgan (structured logs)
- **Security:** Helmet, CORS, Rate Limiting

## 📋 Pré-requisitos

### Para Desenvolvimento Local
- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Dev Containers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Para Deploy em Kubernetes
- [kubectl](https://kubernetes.io/docs/tasks/tools/) - Cliente Kubernetes
- [Helm 3+](https://helm.sh/docs/intro/install/) - Gerenciador de pacotes
- [ArgoCD CLI](https://argo-cd.readthedocs.io/en/stable/cli_installation/) - Cliente ArgoCD
- Acesso a um cluster Kubernetes (minikube, kind, GKE, EKS, AKS)

## ⚙️ Setup e Deploy

### 🏠 Desenvolvimento Local (Docker Compose)

```bash
# 1. Clonar repositório
git clone https://github.com/periclesanfe/linktree.git
cd linktree

# 2. Criar arquivo .env
cat > .env << EOF
POSTGRES_USER=postgres
POSTGRES_PASSWORD=suasenhaforte
POSTGRES_DB=linktree_db
JWT_SECRET=segredo_jwt_super_secreto_e_aleatorio
CORS_ORIGIN=http://localhost:5173
EOF

# 3. Abrir no Dev Container
# VS Code → Cmd+Shift+P → "Dev Containers: Reopen in Container"

# 4. Acessar aplicação
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

### ☸️ Deploy em Kubernetes (GitOps)

Para deploy em produção usando GitOps, consulte a documentação completa:

- **[Guia de Setup GitOps](docs/GITOPS_SETUP.md)** - Setup completo do zero
- **[Guia de Deployment](docs/DEPLOYMENT.md)** - Processo de deploy e troubleshooting
- **[Helm Chart README](helm/README.md)** - Documentação do Helm Chart

**Quick Start:**

```bash
# 1. Criar repositório GitOps
git clone https://github.com/periclesanfe/argocd-gitops.git
cd argocd-gitops
cp -r ../linktree/docs/gitops-templates/* .

# 2. Instalar CloudNativePG
kubectl apply -f operators/cloudnative-pg.yaml

# 3. Instalar ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 4. Criar aplicações
kubectl apply -f environments/prod/application.yaml

# 5. Sincronizar
argocd app sync linktree-prod
```

Para instruções detalhadas, veja [GITOPS_SETUP.md](docs/GITOPS_SETUP.md).

## 📁 Estrutura do Projeto

```
linktree/
├── .github/
│   └── workflows/
│       └── gitops-cicd.yml        # Pipeline CI/CD GitOps
├── docs/
│   ├── DEPLOYMENT.md              # Guia de deployment
│   ├── GITOPS_SETUP.md            # Setup GitOps completo
│   └── gitops-templates/          # Templates para repo GitOps
├── helm/                          # Helm Chart
│   ├── Chart.yaml
│   ├── values.yaml                # Valores padrão
│   ├── values.dev.yaml            # Valores de dev
│   ├── values.prod.yaml           # Valores de prod
│   ├── templates/                 # Manifests Kubernetes
│   └── README.md
├── linktree-backend/              # API Node.js
│   ├── src/
│   │   ├── index.js               # Server principal
│   │   ├── utils/
│   │   │   └── logger.js          # Winston logger
│   │   ├── middleware/
│   │   │   ├── httpLogger.js      # Morgan HTTP logging
│   │   │   └── errorHandler.js    # Error handling
│   │   ├── routes/
│   │   └── controllers/
│   ├── Dockerfile
│   └── package.json
├── linktree-app/                  # Frontend React
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── db-init/
│   └── init.sql                   # Database schema
├── scripts/
│   └── helm-helper.sh             # Helper para Helm
└── docker-compose.yml             # Desenvolvimento local
```

## � GitOps Workflow

### Fluxo de Deploy Automatizado

```
Developer Push → GitHub Actions → Build Images → Update GitOps Repo → ArgoCD Sync → Kubernetes Deploy
```

1. **Developer** faz push no repo `linktree`
2. **GitHub Actions** constrói imagens Docker e faz push para ghcr.io
3. **GitHub Actions** atualiza repo `argocd-gitops` com nova tag de imagem
4. **ArgoCD** detecta mudança no Git
5. **ArgoCD** sincroniza com Kubernetes
6. **Kubernetes** faz rolling update (zero downtime)

### CI/CD Pipeline

O workflow `.github/workflows/gitops-cicd.yml` executa:

- ✅ Lint e validação do Helm Chart
- 🏗️ Build de imagens Docker (backend e frontend)
- 📦 Push para GitHub Container Registry
- 🔄 Atualização automática do repositório GitOps
- 📊 Summary do deployment

## 🧪 Testando a Aplicação

### Desenvolvimento Local

```bash
# Abrir no Dev Container e acessar:
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000/api
# Health Check: http://localhost:3000/api/health
```

### Kubernetes

```bash
# Port-forward frontend
kubectl port-forward -n prod svc/linktree-prod-frontend 3000:80

# Port-forward backend
kubectl port-forward -n prod svc/linktree-prod-backend 8000:8000

# Testar health check
curl http://localhost:8000/api/health
```

## 📊 Logs Estruturados

O backend usa **Winston** para logs estruturados em JSON (produção):

```json
{
  "level": "info",
  "message": "HTTP Request",
  "method": "GET",
  "url": "/api/links",
  "statusCode": 200,
  "responseTime": "45ms",
  "timestamp": "2024-11-08T10:30:00.000Z"
}
```

```bash
# Ver logs em desenvolvimento (coloridos)
npm run dev

# Ver logs em produção (JSON)
NODE_ENV=production npm start

# Em Kubernetes, filtrar logs
kubectl logs deploy/linktree-prod-backend -n prod | jq 'select(.level=="error")'
```

## 🛠️ Scripts Úteis

### Helm Helper

```bash
# Validar Helm Chart
./scripts/helm-helper.sh lint

# Ver templates renderizados
./scripts/helm-helper.sh template prod

# Dry-run de instalação
./scripts/helm-helper.sh dry-run dev

# Instalar no cluster
./scripts/helm-helper.sh install dev

# Ver status
./scripts/helm-helper.sh status prod

# Port-forward
./scripts/helm-helper.sh port-forward dev

# Ver logs
./scripts/helm-helper.sh logs prod backend
```

## �🕹️ Páginas da Aplicação Frontend

A interface do usuário é dividida nas seguintes rotas principais:

- `/login`: Página de login para acessar o painel de administração
- `/admin`: Painel privado onde o usuário logado pode gerenciar seu perfil, links e imagens
- `/:username`: A página de perfil pública de um usuário, visível para todos os visitantes

## 📚 Documentação da API

Todas as rotas, exceto registro, login e redirecionamento, são protegidas e exigem um token JWT no cabeçalho: `x-auth-token`.

### Autenticação (`/api/auth`)

| Método | Endpoint   | Protegida? | Descrição                        | Corpo (JSON)                                  |
|--------|------------|------------|----------------------------------|------------------------------------------------|
| POST   | /register  | Não        | Registra um novo usuário.        | `{ "username": "...", "email": "...", "password": "..." }` |
| POST   | /login     | Não        | Autentica um usuário e retorna um token. | `{ "email": "...", "password": "..." }` |
| GET    | /me        | Sim        | Retorna os dados do usuário logado. | N/A                                           |

### Links (`/api/links`)

| Método | Endpoint              | Protegida? | Descrição                          | Corpo (JSON)                                  |
|--------|-----------------------|------------|------------------------------------|------------------------------------------------|
| POST   | /                     | Sim        | Cria um novo link para o usuário.  | `{ "title": "...", "url": "..." }` |
| GET    | /                     | Sim        | Lista todos os links do usuário.   | N/A                                           |
| PUT    | /:id                  | Sim        | Atualiza um link específico.       | `{ "title": "...", "url": "..." }` (campos opcionais) |
| DELETE | /:id                  | Sim        | Deleta um link específico.         | N/A                                           |
| POST   | /:linkId/cover-image  | Sim        | Faz o upload da imagem de capa.    | Multipart: Campo coverImage do tipo File       |

### Uploads (`/api/users`)

| Método | Endpoint                | Protegida? | Descrição                        | Corpo (Multipart Form)         |
|--------|-------------------------|------------|----------------------------------|-------------------------------|
| POST   | /me/profile-picture     | Sim        | Faz o upload da foto de perfil.  | Campo `profilePicture` do tipo File |

### Redirecionamento e Análise

| Método | Endpoint                  | Protegida? | Descrição                                      |
|--------|---------------------------|------------|------------------------------------------------|
| GET    | /r/:linkId                | Não        | Registra um clique e redireciona para a URL final. |
| GET    | /api/analytics/:linkId    | Sim        | Retorna as estatísticas de clique para um link. |

## 🏛️ Arquitetura

### Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                         USUÁRIO                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │     Ingress    │  (nginx)
         └────────┬───────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
  ┌──────────┐      ┌──────────┐
  │ Frontend │      │ Backend  │  (Node.js + Express)
  │ (React)  │      │ (3 pods) │
  └──────────┘      └────┬─────┘
                         │
                         ▼
                  ┌──────────────┐
                  │  PostgreSQL  │  (CloudNativePG)
                  │  (3 replicas)│
                  └──────────────┘
```

### GitOps Flow

```
┌──────────────┐      ┌─────────────────┐      ┌──────────────┐
│   linktree   │──────│ GitHub Actions  │──────│   ghcr.io    │
│ (app code)   │ push │ (build images)  │ push │  (registry)  │
└──────────────┘      └────────┬────────┘      └──────────────┘
                               │
                               │ update tags
                               ▼
                      ┌─────────────────┐
                      │ argocd-gitops   │
                      │ (config repo)   │
                      └────────┬────────┘
                               │
                               │ detect
                               ▼
                      ┌─────────────────┐       ┌──────────────┐
                      │     ArgoCD      │──────▶│  Kubernetes  │
                      │  (sync engine)  │ apply │   Cluster    │
                      └─────────────────┘       └──────────────┘
```

## 🔐 Segurança e Boas Práticas

### Implementações de Segurança

- ✅ **Helmet**: Headers de segurança HTTP
- ✅ **CORS**: Configuração restrita de origens
- ✅ **Rate Limiting**: Proteção contra abuso
- ✅ **JWT**: Tokens com expiração
- ✅ **bcryptjs**: Hash seguro de senhas
- ✅ **Environment Variables**: Secrets via ConfigMap/Secret
- ✅ **Structured Logging**: Winston com níveis apropriados
- ✅ **Error Handling**: Middleware centralizado de erros
- ✅ **Health Checks**: Liveness e Readiness probes

### 12-Factor App Compliance

| Fator | Implementação |
|-------|---------------|
| I. Codebase | ✅ Git (único repo, múltiplos deploys) |
| II. Dependencies | ✅ package.json + Docker |
| III. Config | ✅ Environment variables (.env, ConfigMap) |
| IV. Backing Services | ✅ PostgreSQL como serviço externo |
| V. Build, Release, Run | ✅ GitHub Actions → ArgoCD → K8s |
| VI. Processes | ✅ Stateless (sessão via JWT) |
| VII. Port Binding | ✅ Express self-contained |
| VIII. Concurrency | ✅ Horizontal scaling (K8s replicas) |
| IX. Disposability | ✅ Graceful shutdown (SIGTERM) |
| X. Dev/Prod Parity | ✅ Docker + Helm values.{env}.yaml |
| XI. Logs | ✅ Winston structured logging |
| XII. Admin Processes | ✅ Migration jobs |

## 🚨 Monitoramento e Observabilidade

### Health Checks

```bash
# Backend health endpoint
curl http://localhost:8000/api/health

# Resposta:
{
  "status": "healthy",
  "timestamp": "2024-11-08T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

### Logs

```bash
# Ver logs em tempo real
kubectl logs -f deployment/linktree-prod-backend -n prod

# Filtrar por erro
kubectl logs deployment/linktree-prod-backend -n prod | grep ERROR

# Filtrar por nível (JSON logs)
kubectl logs deployment/linktree-prod-backend -n prod | jq 'select(.level=="error")'
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'feat: adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📚 Documentação Adicional

- [Guia de Setup GitOps](docs/GITOPS_SETUP.md) - Setup completo do zero
- [Guia de Deployment](docs/DEPLOYMENT.md) - Deploy e troubleshooting
- [Helm Chart README](helm/README.md) - Documentação do chart
- [Setup Guide](helm/SETUP_GUIDE.md) - Instalação do Helm

## 📝 Licença

Este projeto é open source e está disponível sob a [MIT License](LICENSE).

## 👥 Autores

- **periclesanfe** - [GitHub](https://github.com/periclesanfe)

## 🙏 Agradecimentos

- Professores e orientadores
- Comunidade Cloud Native
- Contribuidores do projeto

---

**Feito com ❤️ e DevOps Best Practices**
