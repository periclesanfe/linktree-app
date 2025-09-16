# Projeto Linktree Clone

Este projeto é uma implementação full-stack de uma aplicação clone do Linktree, desenvolvida como parte da disciplina **[Nome da Disciplina]**. A aplicação permite que usuários se cadastrem, criem uma página de perfil pública e adicionem uma lista de links personalizáveis.

O ambiente de desenvolvimento é totalmente containerizado usando Docker e VS Code Dev Containers, garantindo uma experiência de setup rápida e consistente.

## ✨ Funcionalidades

- 🔐 **Autenticação Completa:** Sistema de registro e login com tokens JWT, com rotas protegidas para gerenciamento.
- 👤 **Página de Perfil Pública:** Cada usuário possui uma página `/:username` customizável e acessível publicamente.
- 🔗 **Gerenciamento de Links (CRUD):** Usuários logados têm um painel administrativo para criar, visualizar, atualizar e deletar seus links.
- 🎨 **Personalização de Perfil e Links:** Funcionalidade de upload de imagem de perfil e de capas para cada link.
- 📈 **Análise de Cliques:** Um sistema de redirecionamento que contabiliza os cliques em cada link, com uma API para consultar as estatísticas.
- 📱 **Interface Reativa:** Frontend construído em React com Vite, TypeScript e Tailwind CSS, oferecendo uma experiência de usuário moderna e interativa.

## 🚀 Tecnologias Utilizadas

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, React Router, Axios
- **Backend:** Node.js, Express.js
- **Banco de Dados:** PostgreSQL
- **Infraestrutura e DevOps:** Docker, Docker Compose, VS Code Dev Containers
- **Autenticação:** JWT (JSON Web Tokens), bcryptjs
- **Upload de Arquivos:** Multer

## 📋 Pré-requisitos

Para executar este projeto, você precisará ter as seguintes ferramentas instaladas:

- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Visual Studio Code](https://code.visualstudio.com/)
- A extensão [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) da Microsoft no VS Code.

## ⚙️ Começando (Setup Local)

Siga estes passos para configurar e executar o ambiente de desenvolvimento.

### 1. Clonar o Repositório

```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd <nome-do-repositorio>
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo chamado `.env` na raiz do projeto. Este arquivo não será enviado para o GitHub e conterá suas senhas e segredos.

Copie e cole o conteúdo abaixo no seu arquivo `.env`:

```env
# Credenciais para o Banco de Dados PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=suasenhaforte # Troque por uma senha segura
POSTGRES_DB=linktree_db

# Segredo para a Autenticação JWT
JWT_SECRET=segredo_jwt_super_secreto_e_aleatorio # Troque por uma string aleatória longa
```

### 3. Abrir no Dev Container

Abra a pasta raiz do projeto no VS Code.

Abra a Paleta de Comandos (`Cmd+Shift+P` no Mac, `Ctrl+Shift+P` no Windows).

Procure e execute o comando: `Dev Containers: Reopen in Container`.

Aguarde o VS Code construir e iniciar os contêineres. Isso pode levar alguns minutos na primeira vez.

### 4. A Aplicação está no Ar!

O comando acima executa o `docker-compose up` automaticamente. Ao final do processo:

- O Frontend estará acessível em: http://localhost:5173
- A API Backend estará acessível em: http://localhost:3000

Você pode se conectar ao Banco de Dados usando uma extensão do VS Code com os dados do seu `.env` e o host `database`.

## 🕹️ Páginas da Aplicação Frontend

A interface do usuário é dividida nas seguintes rotas principais:

- `/login`: Página de login para acessar o painel de administração.
- `/admin`: Painel privado onde o usuário logado pode gerenciar seu perfil, links e imagens.
- `/:username`: A página de perfil pública de um usuário, visível para todos os visitantes.

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