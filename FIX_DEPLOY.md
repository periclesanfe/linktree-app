# 🔧 COMANDOS PARA CORRIGIR O DEPLOY

## ⚠️ PROBLEMA ATUAL
Você está na pasta errada e as variáveis de ambiente não estão sendo lidas.

## ✅ SOLUÇÃO - Execute estes comandos na VM:

### 1️⃣ Pare tudo e limpe
```bash
# Navegue para a pasta CORRETA (raiz do projeto)
cd ~/linktree-app
cd ..  # Voltar uma pasta
pwd    # Deve mostrar: /home/xxmrafxx/linktree

# OU simplesmente:
cd ~/linktree

# Pare todos os containers
docker compose -f docker-compose.prod.yml down

# Limpe tudo (volumes, redes, etc)
docker compose -f docker-compose.prod.yml down -v
```

### 2️⃣ Verifique se está na pasta correta
```bash
# Deve estar em: /home/xxmrafxx/linktree
pwd

# Liste os arquivos
ls -la

# Você DEVE ver:
# - docker-compose.prod.yml
# - deploy.sh
# - linktree-backend/
# - linktree-app/
# - db-init/
```

### 3️⃣ Obtenha o IP da VM
```bash
IP_EXTERNO=$(curl -s ifconfig.me)
echo "Meu IP externo é: $IP_EXTERNO"
```

### 4️⃣ Crie o arquivo .env.production
```bash
# Na pasta ~/linktree (RAIZ!), crie o arquivo
nano .env.production
```

**Cole este conteúdo (e AJUSTE os valores):**
```env
# PostgreSQL Configuration
POSTGRES_USER=linktree_user
POSTGRES_PASSWORD=MinhaSenhaPostgres123!@#
POSTGRES_DB=linktree_db

# JWT Secret
JWT_SECRET=MinhaChaveJWTSecreta456!@#

# Backend URL - SUBSTITUA pelo IP que apareceu acima!
VITE_BACKEND_URL=http://SEU_IP_AQUI:3000
```

**⚠️ IMPORTANTE:**
- Troque `SEU_IP_AQUI` pelo IP real que você obteve
- Use senhas FORTES e diferentes destas
- Salve: `CTRL+X` → `Y` → `ENTER`

### 5️⃣ Verifique se o arquivo foi criado corretamente
```bash
# Deve estar em ~/linktree (não em ~/linktree-app!)
pwd

# Veja o conteúdo
cat .env.production

# Deve mostrar suas configurações (com IP correto e senhas)
```

### 6️⃣ Faça logout e login (necessário para Docker)
```bash
# Saia da VM
exit

# Reconecte via SSH novamente
# Depois volte para a pasta:
cd ~/linktree
```

### 7️⃣ Execute o deploy
```bash
# Certifique-se de estar na pasta correta
cd ~/linktree
pwd  # Deve mostrar: /home/xxmrafxx/linktree

# Execute o script de deploy
./deploy.sh
```

## 🔍 Verificar se funcionou

### Ver status dos containers
```bash
docker compose -f docker-compose.prod.yml ps

# Deve mostrar 3 containers rodando (Up):
# - linktree-postgres
# - linktree-backend
# - linktree-frontend
```

### Ver logs
```bash
# Ver logs de todos os containers
docker compose -f docker-compose.prod.yml logs

# OU ver logs em tempo real
docker compose -f docker-compose.prod.yml logs -f

# OU ver logs de um serviço específico
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend
docker compose -f docker-compose.prod.yml logs database
```

### Testar a aplicação
```bash
# Obter IP novamente
curl ifconfig.me

# Testar backend
curl http://localhost:3000/

# Testar frontend
curl http://localhost/
```

No navegador:
- Frontend: `http://SEU_IP_EXTERNO`
- Backend: `http://SEU_IP_EXTERNO:3000`

## 🆘 Se ainda der erro

### Erro: "permission denied, mkdir '/app/logs'"
```bash
# Reconstrua as imagens sem cache
cd ~/linktree
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

### Erro: "database linktree_user does not exist"
```bash
# O problema é que as variáveis não estão sendo lidas
# Certifique-se de:
# 1. Estar na pasta ~/linktree (não ~/linktree-app)
# 2. O arquivo .env.production existe em ~/linktree
# 3. As variáveis estão corretas no arquivo

# Verificar:
pwd
ls -la .env.production
cat .env.production
```

### Limpar tudo e recomeçar
```bash
cd ~/linktree

# Parar e remover TUDO
docker compose -f docker-compose.prod.yml down -v --rmi all

# Reconstruir do zero
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# Ver logs
docker compose -f docker-compose.prod.yml logs -f
```

## 📋 Checklist Final

- [ ] Está na pasta `~/linktree` (não `~/linktree-app`)
- [ ] Arquivo `.env.production` existe em `~/linktree`
- [ ] IP externo foi substituído no `.env.production`
- [ ] Senhas foram alteradas para senhas fortes
- [ ] Fez logout e login após instalar Docker
- [ ] Executou `./deploy.sh` da pasta `~/linktree`
- [ ] 3 containers estão rodando (ps)
- [ ] Não há erros nos logs

## 🎯 Comando único para rebuild completo
```bash
cd ~/linktree && \
docker compose -f docker-compose.prod.yml down -v && \
docker compose -f docker-compose.prod.yml build --no-cache && \
docker compose -f docker-compose.prod.yml up -d && \
docker compose -f docker-compose.prod.yml logs
```
