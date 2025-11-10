# Linktree Clone - Cloud Native Edition 🚀# Projeto Linktree Clone - GitOps Edition



## 📖 Sobre o ProjetoEste projeto é uma implementação full-stack de uma aplicação clone do Linktree, desenvolvida com as melhores práticas de **DevOps**, **GitOps**, **Kubernetes** e **12-Factor App**.



Este projeto é uma implementação **full-stack** de um clone do Linktree, desenvolvido como trabalho acadêmico para demonstrar proficiência em **DevOps**, **Cloud Native**, **GitOps** e **Kubernetes**.A aplicação permite que usuários se cadastrem, criem uma página de perfil pública e adicionem uma lista de links personalizáveis. Todo o deploy é automatizado usando **ArgoCD** e **GitHub Actions**.



### 🎯 Motivação## ✨ Funcionalidades



O projeto foi criado com os seguintes objetivos:- 🔐 **Autenticação Completa:** Sistema de registro e login com tokens JWT

- 👤 **Página de Perfil Pública:** Cada usuário possui uma página `/:username` customizável

- **Aplicar conceitos modernos de DevOps**: CI/CD, GitOps, Infrastructure as Code- 🔗 **Gerenciamento de Links (CRUD):** Painel administrativo completo

- **Demonstrar arquitetura cloud-native**: Kubernetes, containers, microsserviços- 🎨 **Personalização:** Upload de imagem de perfil e capas para links

- **Implementar boas práticas de desenvolvimento**: 12-Factor App, structured logging, security- 📈 **Análise de Cliques:** Sistema de tracking com estatísticas

- **Criar um sistema escalável e resiliente**: High Availability, rolling updates, zero downtime- 📱 **Interface Reativa:** React com Vite, TypeScript e Tailwind CSS

- **Experiência prática com ferramentas enterprise**: ArgoCD, Helm, GitHub Actions, PostgreSQL HA

## 🚀 Tecnologias Utilizadas

### ✨ Funcionalidades

### Stack de Aplicação

A aplicação permite que usuários:- **Frontend:** React, Vite, TypeScript, Tailwind CSS, React Router, Axios

- **Backend:** Node.js, Express.js, Winston (structured logging)

- 🔐 **Se registrem e façam login** com autenticação JWT- **Banco de Dados:** PostgreSQL (CloudNativePG operator)

- 👤 **Criem perfis públicos** acessíveis via `/:username`- **Autenticação:** JWT (JSON Web Tokens), bcryptjs

- 🔗 **Gerenciem links personalizados** com títulos, URLs e imagens de capa- **Upload de Arquivos:** Multer

- 🎨 **Personalizem seus perfis** com foto, bio e imagem de fundo

- 📱 **Adicionem ícones de redes sociais** (Instagram, Twitter, LinkedIn, etc.)### DevOps & Infraestrutura

- 📈 **Acompanhem analytics** de cliques nos seus links- **Containers:** Docker, Docker Compose

- **Orquestração:** Kubernetes

### 🛠️ Stack Tecnológica- **GitOps:** ArgoCD

- **Package Management:** Helm 3

#### Frontend- **CI/CD:** GitHub Actions

- **React 18** com **TypeScript**- **Registry:** GitHub Container Registry (ghcr.io)

- **Vite** para build ultrarrápido- **Logging:** Winston + Morgan (structured logs)

- **Tailwind CSS** para estilização- **Security:** Helmet, CORS, Rate Limiting

- **React Router** para navegação

- **Axios** para requisições HTTP## 📋 Pré-requisitos



#### Backend### Para Desenvolvimento Local

- **Node.js** com **Express.js**- [Git](https://git-scm.com/)

- **PostgreSQL 16** como banco de dados- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

- **JWT** para autenticação stateless- [Visual Studio Code](https://code.visualstudio.com/)

- **Winston** para logging estruturado- [Dev Containers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

- **Multer** para upload de arquivos

- **Helmet**, **CORS**, **Rate Limiting** para segurança### Para Deploy em Kubernetes

- [kubectl](https://kubernetes.io/docs/tasks/tools/) - Cliente Kubernetes

#### DevOps & Infraestrutura- [Helm 3+](https://helm.sh/docs/intro/install/) - Gerenciador de pacotes

- **Docker** para containerização- [ArgoCD CLI](https://argo-cd.readthedocs.io/en/stable/cli_installation/) - Cliente ArgoCD

- **Kubernetes** para orquestração- Acesso a um cluster Kubernetes (minikube, kind, GKE, EKS, AKS)

- **Helm 3** para package management

- **ArgoCD** para GitOps## ⚙️ Setup e Deploy

- **GitHub Actions** para CI/CD

- **CloudNativePG** para PostgreSQL HA### 🏠 Desenvolvimento Local (Docker Compose)

- **GitHub Container Registry** (ghcr.io)

```bash

---# 1. Clonar repositório

git clone https://github.com/periclesanfe/linktree.git

## 🚀 Como Executar o Projetocd linktree



### Pré-requisitos# 2. Criar arquivo .env

cat > .env << EOF

Antes de começar, certifique-se de ter instalado:POSTGRES_USER=postgres

POSTGRES_PASSWORD=suasenhaforte

- [Git](https://git-scm.com/) (2.30+)POSTGRES_DB=linktree_db

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (4.0+)JWT_SECRET=segredo_jwt_super_secreto_e_aleatorio

- [Node.js](https://nodejs.org/) (18+) - opcional, apenas se quiser rodar sem DockerCORS_ORIGIN=http://localhost:5173

- [Visual Studio Code](https://code.visualstudio.com/) - recomendadoEOF



### Opção 1: Desenvolvimento Local com Docker Compose (Recomendado)# 3. Abrir no Dev Container

# VS Code → Cmd+Shift+P → "Dev Containers: Reopen in Container"

Esta é a forma mais rápida de rodar o projeto localmente:

# 4. Acessar aplicação

```bash# Frontend: http://localhost:5173

# 1. Clone o repositório# Backend: http://localhost:3000

git clone https://github.com/periclesanfe/linktree-app.git```

cd linktree-app

### ☸️ Deploy em Kubernetes (GitOps)

# 2. Crie o arquivo .env na raiz do projeto

cat > .env << EOFPara deploy em produção usando GitOps, consulte a documentação completa:

POSTGRES_USER=postgres

POSTGRES_PASSWORD=minhasenha123- **[Guia de Setup GitOps](docs/GITOPS_SETUP.md)** - Setup completo do zero

POSTGRES_DB=linktree_db- **[Guia de Deployment](docs/DEPLOYMENT.md)** - Processo de deploy e troubleshooting

JWT_SECRET=meu-jwt-secret-super-secreto- **[Helm Chart README](helm/README.md)** - Documentação do Helm Chart

CORS_ORIGIN=http://localhost:5173

EOF**Quick Start:**



# 3. Suba os containers```bash

docker-compose up -d# 1. Criar repositório GitOps

git clone https://github.com/periclesanfe/argocd-gitops.git

# 4. Aguarde os serviços ficarem prontos (~30 segundos)cd argocd-gitops

docker-compose logs -fcp -r ../linktree/docs/gitops-templates/* .



# 5. Acesse a aplicação# 2. Instalar CloudNativePG

# Frontend: http://localhost:5173kubectl apply -f operators/cloudnative-pg.yaml

# Backend API: http://localhost:3000/api

```# 3. Instalar ArgoCD

kubectl create namespace argocd

**O que acontece:**kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

- PostgreSQL inicia na porta `5432`

- Backend inicia na porta `3000` (com hot-reload)# 4. Criar aplicações

- Frontend inicia na porta `5173` (com hot-reload)kubectl apply -f environments/prod/application.yaml

- Banco é inicializado automaticamente com schema do `db-init/init.sql`

# 5. Sincronizar

**Comandos úteis:**argocd app sync linktree-prod

```

```bash

# Ver logsPara instruções detalhadas, veja [GITOPS_SETUP.md](docs/GITOPS_SETUP.md).

docker-compose logs -f backend

docker-compose logs -f frontend## 📁 Estrutura do Projeto



# Parar serviços```

docker-compose downlinktree/

├── .github/

# Limpar volumes (apaga banco de dados)│   └── workflows/

docker-compose down -v│       └── gitops-cicd.yml        # Pipeline CI/CD GitOps

├── docs/

# Rebuild após mudanças no código│   ├── DEPLOYMENT.md              # Guia de deployment

docker-compose up -d --build│   ├── GITOPS_SETUP.md            # Setup GitOps completo

```│   └── gitops-templates/          # Templates para repo GitOps

├── helm/                          # Helm Chart

### Opção 2: Desenvolvimento com Dev Container (VS Code)│   ├── Chart.yaml

│   ├── values.yaml                # Valores padrão

Se você usa VS Code, pode usar o Dev Container para um ambiente isolado:│   ├── values.dev.yaml            # Valores de dev

│   ├── values.prod.yaml           # Valores de prod

```bash│   ├── templates/                 # Manifests Kubernetes

# 1. Clone o repositório│   └── README.md

git clone https://github.com/periclesanfe/linktree-app.git├── linktree-backend/              # API Node.js

cd linktree-app│   ├── src/

│   │   ├── index.js               # Server principal

# 2. Abra no VS Code│   │   ├── utils/

code .│   │   │   └── logger.js          # Winston logger

│   │   ├── middleware/

# 3. Quando solicitado, clique em "Reopen in Container"│   │   │   ├── httpLogger.js      # Morgan HTTP logging

#    Ou: Cmd+Shift+P → "Dev Containers: Reopen in Container"│   │   │   └── errorHandler.js    # Error handling

│   │   ├── routes/

# 4. Aguarde a construção do container (~2-3 minutos na primeira vez)│   │   └── controllers/

│   ├── Dockerfile

# 5. Acesse o terminal integrado e rode:│   └── package.json

docker-compose up├── linktree-app/                  # Frontend React

```│   ├── src/

│   ├── Dockerfile

**Vantagens:**│   └── package.json

- Ambiente padronizado├── db-init/

- Extensões do VS Code pré-configuradas│   └── init.sql                   # Database schema

- Node, Git e ferramentas já instaladas├── scripts/

│   └── helm-helper.sh             # Helper para Helm

### Opção 3: Kubernetes Local com Minikube└── docker-compose.yml             # Desenvolvimento local

```

Para testar em um ambiente mais próximo de produção:

## � GitOps Workflow

```bash

# 1. Instale as ferramentas necessárias### Fluxo de Deploy Automatizado

brew install kubectl helm minikube

```

# 2. Inicie o MinikubeDeveloper Push → GitHub Actions → Build Images → Update GitOps Repo → ArgoCD Sync → Kubernetes Deploy

minikube start --cpus=4 --memory=7000 --driver=docker```



# 3. Configure Docker para usar o daemon do Minikube1. **Developer** faz push no repo `linktree`

eval $(minikube docker-env)2. **GitHub Actions** constrói imagens Docker e faz push para ghcr.io

3. **GitHub Actions** atualiza repo `argocd-gitops` com nova tag de imagem

# 4. Build das imagens localmente4. **ArgoCD** detecta mudança no Git

docker build -t ghcr.io/periclesanfe/linktree-backend:dev ./linktree-backend5. **ArgoCD** sincroniza com Kubernetes

docker build -t ghcr.io/periclesanfe/linktree-frontend:dev ./linktree-app6. **Kubernetes** faz rolling update (zero downtime)



# 5. Crie o namespace e PostgreSQL### CI/CD Pipeline

kubectl create namespace dev

kubectl apply -f k8s/postgres-simple.yamlO workflow `.github/workflows/gitops-cicd.yml` executa:



# 6. Deploy com Helm- ✅ Lint e validação do Helm Chart

helm install linktree-dev ./helm -f ./helm/values.dev.yaml --namespace dev- 🏗️ Build de imagens Docker (backend e frontend)

- 📦 Push para GitHub Container Registry

# 7. Aguarde os pods ficarem prontos- 🔄 Atualização automática do repositório GitOps

kubectl wait --for=condition=Ready pods -l app.kubernetes.io/instance=linktree-dev -n dev --timeout=120s- 📊 Summary do deployment



# 8. Port-forward para acessar## 🧪 Testando a Aplicação

kubectl port-forward -n dev svc/linktree-dev-frontend 3000:80 &

kubectl port-forward -n dev svc/linktree-dev-backend 8000:8000 &### Desenvolvimento Local



# 9. Acesse```bash

# Frontend: http://localhost:3000# Abrir no Dev Container e acessar:

# Backend: http://localhost:8000/api/health# Frontend: http://localhost:5173

```# Backend API: http://localhost:3000/api

# Health Check: http://localhost:3000/api/health

**Para mais detalhes**, consulte [docs/SETUP_LOCAL.md](docs/SETUP_LOCAL.md)```



---### Kubernetes



## 📱 Como Usar a Aplicação```bash

# Port-forward frontend

### Telas e Rotaskubectl port-forward -n prod svc/linktree-prod-frontend 3000:80



#### 1. Página Inicial / Perfil Público (`/:username`)# Port-forward backend

kubectl port-forward -n prod svc/linktree-prod-backend 8000:8000

Acesse `http://localhost:5173/usuario-teste` para ver um perfil público.

# Testar health check

**Elementos:**curl http://localhost:8000/api/health

- Foto de perfil```

- Nome e bio do usuário

- Lista de links clicáveis## 📊 Logs Estruturados

- Ícones de redes sociais

O backend usa **Winston** para logs estruturados em JSON (produção):

#### 2. Login (`/login`)

```json

Acesse `http://localhost:5173/login`{

  "level": "info",

**Credenciais de teste:**  "message": "HTTP Request",

```  "method": "GET",

Email: teste@t.com  "url": "/api/links",

Senha: 123  "statusCode": 200,

```  "responseTime": "45ms",

  "timestamp": "2024-11-08T10:30:00.000Z"

**O que acontece:**}

- Backend valida credenciais```

- Retorna token JWT

- Frontend armazena no localStorage```bash

- Redireciona para `/admin`# Ver logs em desenvolvimento (coloridos)

npm run dev

#### 3. Painel Administrativo (`/admin`)

# Ver logs em produção (JSON)

Após login, você pode:NODE_ENV=production npm start



- ✏️ **Editar perfil**: Alterar nome, bio, username# Em Kubernetes, filtrar logs

- 📸 **Upload de fotos**: Foto de perfil e backgroundkubectl logs deploy/linktree-prod-backend -n prod | jq 'select(.level=="error")'

- ➕ **Criar links**: Adicionar novos links com título e URL```

- 🖼️ **Upload de capas**: Adicionar imagem de capa para cada link

- 🗑️ **Deletar links**: Remover links indesejados## 🛠️ Scripts Úteis

- 📱 **Adicionar redes sociais**: Instagram, Twitter, LinkedIn, etc.

- 📊 **Ver analytics**: Quantos cliques cada link recebeu### Helm Helper



### Endpoints da API```bash

# Validar Helm Chart

#### Autenticação./scripts/helm-helper.sh lint



| Método | Endpoint | Auth? | Descrição | Body |# Ver templates renderizados

|--------|----------|-------|-----------|------|./scripts/helm-helper.sh template prod

| POST | `/api/auth/register` | ❌ | Cria novo usuário | `{ "username", "email", "password" }` |

| POST | `/api/auth/login` | ❌ | Retorna JWT token | `{ "email", "password" }` |# Dry-run de instalação

| GET | `/api/auth/me` | ✅ | Dados do usuário logado | - |./scripts/helm-helper.sh dry-run dev



#### Perfil# Instalar no cluster

./scripts/helm-helper.sh install dev

| Método | Endpoint | Auth? | Descrição |

|--------|----------|-------|-----------|# Ver status

| GET | `/api/profile/:username` | ❌ | Perfil público de um usuário |./scripts/helm-helper.sh status prod

| PUT | `/api/users/me` | ✅ | Atualiza perfil do usuário |

| POST | `/api/users/me/profile-picture` | ✅ | Upload de foto (multipart) |# Port-forward

./scripts/helm-helper.sh port-forward dev

#### Links

# Ver logs

| Método | Endpoint | Auth? | Descrição | Body |./scripts/helm-helper.sh logs prod backend

|--------|----------|-------|-----------|------|```

| GET | `/api/links` | ✅ | Lista links do usuário | - |

| POST | `/api/links` | ✅ | Cria novo link | `{ "title", "url" }` |## �🕹️ Páginas da Aplicação Frontend

| PUT | `/api/links/:id` | ✅ | Atualiza link | `{ "title", "url" }` |

| DELETE | `/api/links/:id` | ✅ | Deleta link | - |A interface do usuário é dividida nas seguintes rotas principais:

| POST | `/api/links/:id/cover-image` | ✅ | Upload capa (multipart) | - |

- `/login`: Página de login para acessar o painel de administração

#### Analytics- `/admin`: Painel privado onde o usuário logado pode gerenciar seu perfil, links e imagens

- `/:username`: A página de perfil pública de um usuário, visível para todos os visitantes

| Método | Endpoint | Auth? | Descrição |

|--------|----------|-------|-----------|## 📚 Documentação da API

| GET | `/r/:linkId` | ❌ | Registra clique e redireciona |

| GET | `/api/analytics/:linkId` | ✅ | Estatísticas do link |Todas as rotas, exceto registro, login e redirecionamento, são protegidas e exigem um token JWT no cabeçalho: `x-auth-token`.



#### Redes Sociais### Autenticação (`/api/auth`)



| Método | Endpoint | Auth? | Descrição | Body || Método | Endpoint   | Protegida? | Descrição                        | Corpo (JSON)                                  |

|--------|----------|-------|-----------|------||--------|------------|------------|----------------------------------|------------------------------------------------|

| GET | `/api/social-icons` | ✅ | Lista ícones do usuário | - || POST   | /register  | Não        | Registra um novo usuário.        | `{ "username": "...", "email": "...", "password": "..." }` |

| POST | `/api/social-icons` | ✅ | Adiciona ícone | `{ "platform", "url" }` || POST   | /login     | Não        | Autentica um usuário e retorna um token. | `{ "email": "...", "password": "..." }` |

| PUT | `/api/social-icons/:id` | ✅ | Atualiza URL | `{ "url" }` || GET    | /me        | Sim        | Retorna os dados do usuário logado. | N/A                                           |

| DELETE | `/api/social-icons/:id` | ✅ | Remove ícone | - |

### Links (`/api/links`)

**Platforms suportadas:** `instagram`, `twitter`, `facebook`, `tiktok`, `youtube`, `linkedin`, `github`, `whatsapp`

| Método | Endpoint              | Protegida? | Descrição                          | Corpo (JSON)                                  |

**Autenticação:** Enviar header `x-auth-token: <JWT_TOKEN>`|--------|-----------------------|------------|------------------------------------|------------------------------------------------|

| POST   | /                     | Sim        | Cria um novo link para o usuário.  | `{ "title": "...", "url": "..." }` |

### Estrutura do Banco de Dados| GET    | /                     | Sim        | Lista todos os links do usuário.   | N/A                                           |

| PUT    | /:id                  | Sim        | Atualiza um link específico.       | `{ "title": "...", "url": "..." }` (campos opcionais) |

```sql| DELETE | /:id                  | Sim        | Deleta um link específico.         | N/A                                           |

-- Tabela de usuários| POST   | /:linkId/cover-image  | Sim        | Faz o upload da imagem de capa.    | Multipart: Campo coverImage do tipo File       |

users

├── id (UUID, PK)### Uploads (`/api/users`)

├── username (VARCHAR, UNIQUE)

├── email (VARCHAR, UNIQUE)| Método | Endpoint                | Protegida? | Descrição                        | Corpo (Multipart Form)         |

├── password_hash (VARCHAR)|--------|-------------------------|------------|----------------------------------|-------------------------------|

├── display_name (VARCHAR)| POST   | /me/profile-picture     | Sim        | Faz o upload da foto de perfil.  | Campo `profilePicture` do tipo File |

├── bio (TEXT)

├── profile_image_url (TEXT)### Redirecionamento e Análise

├── background_image_url (TEXT)

├── created_at (TIMESTAMPTZ)| Método | Endpoint                  | Protegida? | Descrição                                      |

└── updated_at (TIMESTAMPTZ)|--------|---------------------------|------------|------------------------------------------------|

| GET    | /r/:linkId                | Não        | Registra um clique e redireciona para a URL final. |

-- Tabela de links| GET    | /api/analytics/:linkId    | Sim        | Retorna as estatísticas de clique para um link. |

links

├── id (UUID, PK)## 🏛️ Arquitetura

├── user_id (UUID, FK → users)

├── title (VARCHAR)### Componentes

├── url (VARCHAR)

├── display_order (INTEGER)```

├── cover_image_url (TEXT)┌─────────────────────────────────────────────────────────────┐

├── color_hash (VARCHAR)│                         USUÁRIO                              │

├── created_at (TIMESTAMPTZ)└─────────────────┬───────────────────────────────────────────┘

└── updated_at (TIMESTAMPTZ)                  │

                  ▼

-- Tabela de ícones sociais         ┌────────────────┐

social_icons         │     Ingress    │  (nginx)

├── id (UUID, PK)         └────────┬───────┘

├── user_id (UUID, FK → users)                  │

├── platform (VARCHAR) -- instagram, twitter, etc.         ┌────────┴────────┐

├── url (VARCHAR)         │                 │

├── created_at (TIMESTAMPTZ)         ▼                 ▼

└── updated_at (TIMESTAMPTZ)  ┌──────────┐      ┌──────────┐

  │ Frontend │      │ Backend  │  (Node.js + Express)

-- Tabela de analytics  │ (React)  │      │ (3 pods) │

analytics_clicks  └──────────┘      └────┬─────┘

├── id (UUID, PK)                         │

├── link_id (UUID, FK → links)                         ▼

├── clicked_at (TIMESTAMPTZ)                  ┌──────────────┐

├── ip_hash (VARCHAR)                  │  PostgreSQL  │  (CloudNativePG)

├── country_code (VARCHAR)                  │  (3 replicas)│

└── city (VARCHAR)                  └──────────────┘

``````



**Relacionamentos:**### GitOps Flow

- Um `user` pode ter múltiplos `links`

- Um `user` pode ter múltiplos `social_icons````

- Um `link` pode ter múltiplos `analytics_clicks`┌──────────────┐      ┌─────────────────┐      ┌──────────────┐

- Deleção em cascata: ao deletar usuário, todos os links e ícones são removidos│   linktree   │──────│ GitHub Actions  │──────│   ghcr.io    │

│ (app code)   │ push │ (build images)  │ push │  (registry)  │

**Schema completo:** [db-init/init.sql](db-init/init.sql)└──────────────┘      └────────┬────────┘      └──────────────┘

                               │

---                               │ update tags

                               ▼

## 🏗️ Arquitetura e Infraestrutura                      ┌─────────────────┐

                      │ argocd-gitops   │

### Fluxo GitOps Completo                      │ (config repo)   │

                      └────────┬────────┘

```                               │

┌─────────────┐                               │ detect

│  Developer  │ git push                               ▼

└──────┬──────┘                      ┌─────────────────┐       ┌──────────────┐

       │                      │     ArgoCD      │──────▶│  Kubernetes  │

       ▼                      │  (sync engine)  │ apply │   Cluster    │

┌─────────────────┐                      └─────────────────┘       └──────────────┘

│  GitHub Actions │ (CI/CD Pipeline)```

└──────┬──────────┘

       │## 🔐 Segurança e Boas Práticas

       ├─────────► Build Backend Image → ghcr.io/periclesanfe/linktree-backend:SHA

       ├─────────► Build Frontend Image → ghcr.io/periclesanfe/linktree-frontend:SHA### Implementações de Segurança

       │

       ▼- ✅ **Helmet**: Headers de segurança HTTP

┌──────────────────┐- ✅ **CORS**: Configuração restrita de origens

│ argocd-gitops    │ (GitOps Repository)- ✅ **Rate Limiting**: Proteção contra abuso

│ (config updates) │- ✅ **JWT**: Tokens com expiração

└──────┬───────────┘- ✅ **bcryptjs**: Hash seguro de senhas

       │- ✅ **Environment Variables**: Secrets via ConfigMap/Secret

       ▼ Auto-sync- ✅ **Structured Logging**: Winston com níveis apropriados

┌──────────────┐- ✅ **Error Handling**: Middleware centralizado de erros

│   ArgoCD     │ Detecta mudança no Git- ✅ **Health Checks**: Liveness e Readiness probes

└──────┬───────┘

       │### 12-Factor App Compliance

       ▼ Apply manifests

┌──────────────────────────────────┐| Fator | Implementação |

│        Kubernetes Cluster         │|-------|---------------|

├───────────────────────────────────┤| I. Codebase | ✅ Git (único repo, múltiplos deploys) |

│ ┌─────────┐      ┌──────────┐    │| II. Dependencies | ✅ package.json + Docker |

│ │Frontend │◄─────│ Ingress  │    │| III. Config | ✅ Environment variables (.env, ConfigMap) |

│ │(3 pods) │      │ (nginx)  │    │| IV. Backing Services | ✅ PostgreSQL como serviço externo |

│ └─────────┘      └──────────┘    │| V. Build, Release, Run | ✅ GitHub Actions → ArgoCD → K8s |

│                                   │| VI. Processes | ✅ Stateless (sessão via JWT) |

│ ┌─────────┐                       │| VII. Port Binding | ✅ Express self-contained |

│ │Backend  │                       │| VIII. Concurrency | ✅ Horizontal scaling (K8s replicas) |

│ │(3 pods) │                       │| IX. Disposability | ✅ Graceful shutdown (SIGTERM) |

│ └────┬────┘                       │| X. Dev/Prod Parity | ✅ Docker + Helm values.{env}.yaml |

│      │                            │| XI. Logs | ✅ Winston structured logging |

│      ▼                            │| XII. Admin Processes | ✅ Migration jobs |

│ ┌──────────────┐                  │

│ │ PostgreSQL   │ (CloudNativePG)  │## 🚨 Monitoramento e Observabilidade

│ │ (3 replicas) │ High Availability│

│ └──────────────┘                  │### Health Checks

└───────────────────────────────────┘

``````bash

# Backend health endpoint

### Componentes Principaiscurl http://localhost:8000/api/health



1. **GitHub Actions** (`.github/workflows/gitops-cicd.yml`)# Resposta:

   - Valida Helm chart{

   - Faz build das imagens Docker  "status": "healthy",

   - Publica no GitHub Container Registry  "timestamp": "2024-11-08T10:30:00.000Z",

   - Atualiza repositório GitOps com novas tags  "uptime": 3600,

  "environment": "production"

2. **ArgoCD**}

   - Monitora repositório GitOps```

   - Detecta mudanças automaticamente

   - Sincroniza estado desejado (Git) com estado atual (Kubernetes)### Logs

   - Fornece UI para visualização e rollback

```bash

3. **Helm Chart** (`helm/`)# Ver logs em tempo real

   - Define todos os recursos Kuberneteskubectl logs -f deployment/linktree-prod-backend -n prod

   - Suporta múltiplos ambientes (dev, prod)

   - Configurável via `values.yaml`# Filtrar por erro

kubectl logs deployment/linktree-prod-backend -n prod | grep ERROR

4. **CloudNativePG**

   - Operador Kubernetes para PostgreSQL# Filtrar por nível (JSON logs)

   - Gerencia backup automáticokubectl logs deployment/linktree-prod-backend -n prod | jq 'select(.level=="error")'

   - Fornece alta disponibilidade```

   - Replica streaming entre pods

## 🤝 Contribuindo

### Princípios 12-Factor App

1. Fork o projeto

| Fator | Implementação |2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`

|-------|---------------|3. Commit suas mudanças: `git commit -m 'feat: adiciona nova funcionalidade'`

| **I. Codebase** | ✅ Único repositório Git, múltiplos deploys (dev/prod) |4. Push para a branch: `git push origin feature/nova-funcionalidade`

| **II. Dependencies** | ✅ `package.json` + Docker (dependências isoladas) |5. Abra um Pull Request

| **III. Config** | ✅ Environment variables via ConfigMaps/Secrets |

| **IV. Backing Services** | ✅ PostgreSQL como serviço anexado |## 📚 Documentação Adicional

| **V. Build, Release, Run** | ✅ GitHub Actions → ArgoCD → Kubernetes |

| **VI. Processes** | ✅ Stateless (JWT, sem sessões em memória) |- [Guia de Setup GitOps](docs/GITOPS_SETUP.md) - Setup completo do zero

| **VII. Port Binding** | ✅ Express self-contained na porta 8000 |- [Guia de Deployment](docs/DEPLOYMENT.md) - Deploy e troubleshooting

| **VIII. Concurrency** | ✅ Horizontal scaling (replicas no K8s) |- [Helm Chart README](helm/README.md) - Documentação do chart

| **IX. Disposability** | ✅ Graceful shutdown, fast startup |- [Setup Guide](helm/SETUP_GUIDE.md) - Instalação do Helm

| **X. Dev/Prod Parity** | ✅ Mesmo Docker, diferente apenas configs |

| **XI. Logs** | ✅ Winston structured logging (stdout) |## 📝 Licença

| **XII. Admin Processes** | ✅ Migration como Kubernetes Job |

Este projeto é open source e está disponível sob a [MIT License](LICENSE).

### Segurança Implementada

## 👥 Autores

- 🛡️ **Helmet**: Headers de segurança HTTP

- 🔒 **CORS**: Whitelist de origens permitidas- **periclesanfe** - [GitHub](https://github.com/periclesanfe)

- ⏱️ **Rate Limiting**: Proteção contra abuso de API

- 🔑 **JWT**: Autenticação stateless com expiração## 🙏 Agradecimentos

- 🔐 **bcryptjs**: Hash seguro de senhas (salt rounds: 10)

- 📝 **Winston Structured Logging**: Logs em JSON para auditoria- Professores e orientadores

- 🚫 **Input Validation**: Validação de todos os inputs- Comunidade Cloud Native

- 🔄 **HTTPS Ready**: Preparado para TLS/SSL- Contribuidores do projeto



------



## 📚 Documentação Adicional**Feito com ❤️ e DevOps Best Practices**


Para informações mais detalhadas sobre deployment e configuração:

- **[Setup Local Completo](docs/SETUP_LOCAL.md)** - Guia passo a passo para rodar localmente com Minikube
- **[Setup GitOps](docs/GITOPS_SETUP.md)** - Configuração completa do ArgoCD e GitOps
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Deploy em produção e troubleshooting
- **[Gerenciamento de Variáveis](docs/ENV_MANAGEMENT.md)** - Como funcionam as env vars em cada ambiente

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Commit suas mudanças: `git commit -m 'feat: adiciona nova feature'`
4. Push para a branch: `git push origin feature/minha-feature`
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**Péricles Anfe**
- GitHub: [@periclesanfe](https://github.com/periclesanfe)
- Projeto: Trabalho acadêmico de DevOps e Cloud Native

---

**Desenvolvido com ❤️ usando as melhores práticas de DevOps e Cloud Native**
