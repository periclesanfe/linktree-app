# Configuração de CI/CD - Deploy Automático

Este guia explica como configurar o deploy automático para a VM do Google Cloud sempre que você commitar para a branch `main`.

## 📋 Pré-requisitos

1. Repositório GitHub configurado
2. VM do Google Cloud rodando
3. Acesso SSH à VM
4. Git instalado na VM

## 🔑 Passo 1: Configurar SSH Key para GitHub Actions

### 1.1. Gerar par de chaves SSH (se ainda não tiver)

Na sua máquina local:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
```

Isso criará dois arquivos:
- `~/.ssh/github_actions_deploy` (chave privada)
- `~/.ssh/github_actions_deploy.pub` (chave pública)

### 1.2. Adicionar chave pública à VM

Copie o conteúdo da chave pública para a VM:

```bash
# Ver conteúdo da chave pública
cat ~/.ssh/github_actions_deploy.pub

# Copiar para a VM (substitua VM_USER e VM_IP)
ssh VM_USER@VM_IP "mkdir -p ~/.ssh && chmod 700 ~/.ssh"
cat ~/.ssh/github_actions_deploy.pub | ssh VM_USER@VM_IP "cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

### 1.3. Testar conexão SSH

```bash
ssh -i ~/.ssh/github_actions_deploy VM_USER@VM_IP
```

Se conectar sem pedir senha, está funcionando!

## 🔒 Passo 2: Configurar Secrets no GitHub

Vá para o repositório no GitHub:

1. Clique em **Settings** (Configurações)
2. No menu lateral, clique em **Secrets and variables** → **Actions**
3. Clique em **New repository secret**

Adicione os seguintes secrets:

### Secret 1: SSH_PRIVATE_KEY

**Nome:** `SSH_PRIVATE_KEY`

**Valor:** Conteúdo completo da chave privada

```bash
cat ~/.ssh/github_actions_deploy
```

Copie TODO o conteúdo, incluindo as linhas:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

### Secret 2: VM_IP

**Nome:** `VM_IP`

**Valor:** Endereço IP da sua VM (ex: `35.223.99.165`)

### Secret 3: VM_USER

**Nome:** `VM_USER`

**Valor:** Usuário SSH da VM (ex: `xxmra` ou o seu usuário)

### Secret 4: PROJECT_DIR

**Nome:** `PROJECT_DIR`

**Valor:** Caminho completo do projeto na VM

Exemplo: `/home/xxmra/linktree`

Para descobrir o caminho:
```bash
ssh VM_USER@VM_IP "pwd && ls -la"
```

## 🚀 Passo 3: Preparar a VM para Deploy Automático

### 3.1. Garantir que o repositório está clonado e configurado

SSH na VM e execute:

```bash
# Navegar para o diretório do projeto
cd /home/SEU_USUARIO/linktree  # Ajuste o caminho

# Configurar git para não pedir credenciais
git config --global credential.helper store

# Fazer pull para testar
git pull origin main
```

### 3.2. Garantir que o .env.production existe

```bash
# Verificar se o arquivo existe
ls -la .env.production

# Se não existir, criar com as variáveis necessárias
cat > .env.production << 'EOF'
# Database
POSTGRES_USER=linktree_user
POSTGRES_PASSWORD=SUA_SENHA_SEGURA
POSTGRES_DB=linktree
DB_HOST=db
DB_PORT=5432
DB_NAME=linktree

# Backend
JWT_SECRET=SEU_JWT_SECRET
NODE_ENV=production
PORT=3000

# CORS
CORS_ORIGIN=http://SEU_IP,http://SEU_DOMINIO

# Database URL
DATABASE_URL=postgresql://linktree_user:SUA_SENHA_SEGURA@db:5432/linktree
EOF

chmod 600 .env.production
```

### 3.3. Testar deploy manual

```bash
# Parar containers
docker compose -f docker-compose.prod.yml --env-file .env.production down

# Reconstruir e iniciar
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Verificar status
docker compose -f docker-compose.prod.yml ps
```

## ✅ Passo 4: Testar o Pipeline

### 4.1. Fazer um commit de teste

Na sua máquina local:

```bash
# Criar um arquivo de teste
echo "# CI/CD Test" > TEST_CICD.md

# Adicionar ao git
git add TEST_CICD.md

# Commit
git commit -m "test: CI/CD pipeline"

# Push para main
git push origin main
```

### 4.2. Acompanhar o deploy

1. Vá para o GitHub
2. Clique na aba **Actions**
3. Você verá o workflow "Deploy to Google Cloud VM" rodando
4. Clique nele para ver os logs em tempo real

### 4.3. Verificar se funcionou

Após o deploy terminar:

```bash
# Verificar health check
curl http://SEU_IP/api/health

# SSH na VM e verificar containers
ssh VM_USER@VM_IP
docker compose -f docker-compose.prod.yml ps
docker logs linktree-backend --tail 50
```

## 🔄 Workflows Configurados

### 1. **deploy.yml** - Deploy Automático

**Trigger:** Push para branch `main`

**Passos:**
1. ✅ Checkout do código
2. ✅ Configurar SSH
3. ✅ Conectar na VM via SSH
4. ✅ Pull das últimas mudanças
5. ✅ Parar containers
6. ✅ Aplicar migrations do banco
7. ✅ Rebuild e restart dos containers
8. ✅ Limpar imagens antigas
9. ✅ Health check da aplicação

### 2. **ci.yml** - Testes e Build (opcional)

**Trigger:** Pull requests e pushes em outras branches

**Passos:**
1. ✅ Testes do backend
2. ✅ Testes do frontend
3. ✅ Build do Docker
4. ✅ Validação do docker-compose

## 🛠️ Troubleshooting

### Erro: "Permission denied (publickey)"

- Verifique se a chave privada foi adicionada corretamente ao secret `SSH_PRIVATE_KEY`
- Verifique se a chave pública está em `~/.ssh/authorized_keys` na VM

### Erro: "docker: command not found"

- Certifique-se de que o Docker está instalado na VM
- Adicione o usuário ao grupo docker: `sudo usermod -aG docker $USER`

### Erro: "git pull failed"

- Configure o git na VM: `git config --global credential.helper store`
- Ou clone o repo usando HTTPS com token de acesso

### Deploy não executa

- Verifique se os secrets estão configurados corretamente
- Verifique os logs do workflow no GitHub Actions

## 🔐 Segurança

- ✅ Chave privada nunca é exposta (fica apenas nos secrets do GitHub)
- ✅ Conexão SSH usa chave criptografada
- ✅ .env.production fica apenas na VM
- ✅ Secrets do GitHub são criptografados

## 📝 Manutenção

### Atualizar variáveis de ambiente

1. SSH na VM
2. Edite `.env.production`
3. Restart dos containers:
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.production restart
   ```

### Executar deploy manualmente

1. Vá para GitHub → Actions
2. Clique em "Deploy to Google Cloud VM"
3. Clique em "Run workflow" → "Run workflow"

## 🎯 Fluxo de Trabalho Recomendado

```
1. Criar feature branch
   git checkout -b feature/nova-funcionalidade

2. Fazer alterações e commits
   git add .
   git commit -m "feat: nova funcionalidade"

3. Push e criar Pull Request
   git push origin feature/nova-funcionalidade

4. Aguardar CI passar (testes)

5. Merge para main

6. Deploy automático é executado! 🚀
```

## ✨ Melhorias Futuras

- [ ] Adicionar notificações do Slack/Discord
- [ ] Implementar rollback automático em caso de erro
- [ ] Adicionar testes automatizados (unit, integration, e2e)
- [ ] Configurar ambientes de staging
- [ ] Implementar blue-green deployment
- [ ] Adicionar monitoramento com Prometheus/Grafana
