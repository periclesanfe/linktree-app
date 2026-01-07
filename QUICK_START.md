# 🚀 Quick Start - Deploy no Google Cloud

## Passo 1: Preparar o ambiente na VM

```bash
# 1. Navegue para a pasta RAIZ do projeto (não linktree-app!)
cd ~
pwd  # Deve mostrar: /home/xxmrafxx

# 2. Certifique-se de que está na pasta correta
# Estrutura esperada:
# ~/linktree/
#   ├── docker-compose.prod.yml
#   ├── deploy.sh
#   ├── .env.production (você vai criar)
#   ├── linktree-backend/
#   └── linktree-app/

# Se o projeto ainda não está na VM, clone:
git clone SEU_REPOSITORIO linktree
cd linktree

# OU se já clonou, vá para a pasta correta:
cd ~/linktree  # ← IMPORTANTE: pasta RAIZ!
```

## Passo 2: Obter o IP da VM

```bash
# Execute na VM para ver seu IP externo
curl ifconfig.me
```

Anote este IP (exemplo: `34.123.45.67`)

## Passo 3: Criar o arquivo .env.production

```bash
# Na pasta ~/linktree, crie o arquivo:
nano .env.production
```

Cole o seguinte conteúdo (e AJUSTE os valores):

```env
# PostgreSQL Configuration
POSTGRES_USER=linktree_user
POSTGRES_PASSWORD=SuaSenhaForte123!@#
POSTGRES_DB=linktree_db

# JWT Secret - Gere uma chave forte
JWT_SECRET=SuaChaveJWTMuitoSecreta123!@#456

# Backend URL - Substitua pelo IP da VM obtido acima
VITE_BACKEND_URL=http://34.123.45.67:3000
```

**⚠️ IMPORTANTE:**
- Troque `34.123.45.67` pelo IP REAL da sua VM
- Use senhas FORTES e diferentes das mostradas acima
- Salve com `CTRL+X`, depois `Y`, depois `ENTER`

## Passo 4: Verificar se está tudo certo

```bash
# Certifique-se de estar na pasta correta
pwd
# Deve mostrar: /home/xxmrafxx/linktree

# Liste os arquivos
ls -la

# Você deve ver:
# - deploy.sh
# - docker-compose.prod.yml
# - .env.production (que você acabou de criar)
# - linktree-backend/
# - linktree-app/
```

## Passo 5: Fazer logout e login (devido ao Docker)

```bash
# Como o Docker foi instalado, você precisa fazer logout e login
exit

# Depois, reconecte via SSH novamente
# E volte para a pasta:
cd ~/linktree
```

## Passo 6: Executar o deploy

```bash
# Garanta que está na pasta correta
cd ~/linktree

# Torne o script executável (se necessário)
chmod +x deploy.sh

# Execute o deploy
./deploy.sh
```

## Passo 7: Verificar se funcionou

```bash
# Ver status dos containers
docker compose -f docker-compose.prod.yml ps

# Deve mostrar 3 containers rodando:
# - linktree-postgres (database)
# - linktree-backend
# - linktree-frontend

# Ver logs
docker compose -f docker-compose.prod.yml logs -f
```

## Passo 8: Acessar a aplicação

No seu navegador:
- **Frontend**: `http://SEU_IP_EXTERNO`
- **Backend**: `http://SEU_IP_EXTERNO:3000`

Exemplo: `http://34.123.45.67`

---

## ⚠️ Troubleshooting

### Erro: "variáveis não definidas"
```bash
# Certifique-se de que o .env.production existe
cat .env.production

# Se não existir, crie conforme Passo 3
```

### Erro: "permission denied" no Docker
```bash
# Você precisa fazer logout e login novamente
exit
# Reconecte via SSH
```

### Containers não sobem
```bash
# Ver logs detalhados
docker compose -f docker-compose.prod.yml logs

# Reiniciar tudo
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### Porta já em uso
```bash
# Ver o que está usando a porta
sudo lsof -i :80
sudo lsof -i :3000

# Parar tudo do Docker
docker compose -f docker-compose.prod.yml down
```
