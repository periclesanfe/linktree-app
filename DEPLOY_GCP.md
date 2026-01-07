# Guia de Deploy no Google Cloud Platform (GCP)

Este guia mostra como hospedar sua aplicação Linktree em uma VM do Google Cloud.

## 📋 Pré-requisitos

- Conta no Google Cloud Platform (novo usuário tem $300 de crédito grátis)
- Projeto criado no GCP
- Conhecimento básico de terminal/SSH

## 🚀 Passo a Passo

### 1. Criar a VM no Google Cloud

#### 1.1 Acesse o Google Cloud Console
- Acesse: https://console.cloud.google.com/
- Faça login com sua conta Google

#### 1.2 Criar uma VM (Compute Engine)
1. No menu lateral, vá em **Compute Engine** > **VM instances**
2. Clique em **CREATE INSTANCE**
3. Configure a VM:

**Configurações Recomendadas:**
```
Nome: linktree-server
Região: us-central1 (ou mais próxima de você)
Zona: us-central1-a

Tipo de máquina:
- Série: E2
- Tipo: e2-medium (2 vCPUs, 4 GB RAM) - Recomendado
  OU
- Tipo: e2-small (2 vCPUs, 2 GB RAM) - Mínimo para funcionar

Disco de inicialização:
- Sistema operacional: Ubuntu
- Versão: Ubuntu 22.04 LTS
- Tipo de disco: Balanced persistent disk
- Tamanho: 20 GB (mínimo)

Firewall:
✅ Permitir tráfego HTTP
✅ Permitir tráfego HTTPS
```

4. Clique em **CREATE**

#### 1.3 Configurar regras de Firewall
1. No menu lateral, vá em **VPC Network** > **Firewall**
2. Clique em **CREATE FIREWALL RULE**
3. Configure:
```
Nome: allow-linktree-ports
Targets: All instances in the network
Source IP ranges: 0.0.0.0/0
Protocols and ports:
  ✅ tcp:3000 (Backend API)
  ✅ tcp:80 (Frontend)
  ✅ tcp:443 (HTTPS - futuro)
```
4. Clique em **CREATE**

### 2. Conectar à VM via SSH

#### 2.1 Conectar pelo navegador
1. Na lista de VMs, clique em **SSH** ao lado da sua VM
2. Uma janela de terminal será aberta no navegador

#### 2.2 OU Conectar via terminal local (opcional)
```bash
# Instale o Google Cloud SDK primeiro
# https://cloud.google.com/sdk/docs/install

gcloud compute ssh linktree-server --zone=us-central1-a
```

### 3. Configurar a VM

#### 3.1 Atualizar o sistema
```bash
sudo apt update && sudo apt upgrade -y
```

#### 3.2 Instalar Git
```bash
sudo apt install git -y
```

#### 3.3 Clonar o repositório
```bash
# Se seu repositório for privado, configure as credenciais do Git primeiro
git clone https://github.com/SEU_USUARIO/BRICELE-LINKTREE.git
cd BRICELE-LINKTREE/linktree
```

**OU**, se preferir, você pode enviar os arquivos via SCP:
```bash
# No seu computador local, execute:
gcloud compute scp --recurse ./linktree linktree-server:~/ --zone=us-central1-a
```

### 4. Configurar variáveis de ambiente

#### 4.1 Obter o IP externo da VM
```bash
# Na VM, execute:
curl ifconfig.me
```
Anote este IP (exemplo: 34.123.45.67)

#### 4.2 Editar arquivo de configuração
```bash
cd ~/BRICELE-LINKTREE/linktree  # ou onde estiverem seus arquivos
nano .env.production
```

#### 4.3 Configurar as variáveis:
```env
# PostgreSQL Configuration
POSTGRES_USER=linktree_user
POSTGRES_PASSWORD=SenhaForte123!@#  # MUDE ISSO!
POSTGRES_DB=linktree_db

# JWT Secret - Gere uma senha forte e única
JWT_SECRET=MinhaChaveSecretaSuperSegura123!@#  # MUDE ISSO!

# Backend URL - Use o IP externo da VM que você anotou
VITE_BACKEND_URL=http://34.123.45.67:3000
```

**⚠️ IMPORTANTE:**
- Troque `34.123.45.67` pelo IP real da sua VM
- Use senhas fortes e únicas
- Nunca commite este arquivo no Git!

Salve e feche o arquivo (CTRL+X, Y, Enter)

### 5. Fazer o Deploy

#### 5.1 Executar o script de deploy
```bash
chmod +x deploy.sh
./deploy.sh
```

O script irá:
- ✅ Instalar Docker e Docker Compose
- ✅ Construir as imagens
- ✅ Iniciar os containers
- ✅ Mostrar os logs

#### 5.2 Aguardar a inicialização
Aguarde cerca de 1-2 minutos para todos os serviços iniciarem completamente.

### 6. Verificar se está funcionando

#### 6.1 Verificar status dos containers
```bash
cd ~/BRICELE-LINKTREE/linktree
docker compose -f docker-compose.prod.yml ps
```

Todos os serviços devem estar com status "Up" ou "healthy"

#### 6.2 Ver logs
```bash
# Ver todos os logs
docker compose -f docker-compose.prod.yml logs

# Ver logs em tempo real
docker compose -f docker-compose.prod.yml logs -f

# Ver logs de um serviço específico
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend
docker compose -f docker-compose.prod.yml logs database
```

#### 6.3 Acessar a aplicação
No seu navegador:
- **Frontend**: http://SEU_IP_EXTERNO
- **Backend API**: http://SEU_IP_EXTERNO:3000

Exemplo: http://34.123.45.67

## 🔧 Comandos Úteis

### Gerenciar containers
```bash
cd ~/BRICELE-LINKTREE/linktree

# Ver status
docker compose -f docker-compose.prod.yml ps

# Parar todos os serviços
docker compose -f docker-compose.prod.yml down

# Iniciar serviços
docker compose -f docker-compose.prod.yml up -d

# Reiniciar um serviço específico
docker compose -f docker-compose.prod.yml restart backend

# Ver logs em tempo real
docker compose -f docker-compose.prod.yml logs -f

# Reconstruir e reiniciar
docker compose -f docker-compose.prod.yml up -d --build
```

### Atualizar a aplicação
```bash
cd ~/BRICELE-LINKTREE/linktree

# Puxar últimas alterações
git pull

# Reconstruir e reiniciar
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

### Backup do banco de dados
```bash
# Criar backup
docker compose -f docker-compose.prod.yml exec database pg_dump -U linktree_user linktree_db > backup.sql

# Restaurar backup
docker compose -f docker-compose.prod.yml exec -T database psql -U linktree_user linktree_db < backup.sql
```

### Monitorar recursos
```bash
# Ver uso de recursos dos containers
docker stats

# Ver espaço em disco
df -h

# Ver memória
free -h
```

## 🌐 Configurar Domínio (Opcional)

### 1. Reservar IP estático
Por padrão, o IP da VM pode mudar se você parar e iniciar a VM.

1. No GCP Console, vá em **VPC Network** > **IP addresses**
2. Encontre o IP da sua VM
3. Clique em **RESERVE** para torná-lo estático
4. Dê um nome (ex: linktree-ip)

### 2. Configurar DNS
Se você tem um domínio (ex: meulinktree.com):

1. No seu provedor de DNS, adicione um registro A:
```
Tipo: A
Nome: @ (ou www)
Valor: SEU_IP_EXTERNO
TTL: 3600
```

2. Aguarde a propagação do DNS (pode levar até 24h)

### 3. Configurar SSL/HTTPS com Let's Encrypt

#### 3.1 Instalar Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

#### 3.2 Criar configuração Nginx reversa
Crie um arquivo `nginx-proxy.conf`:
```nginx
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 3.3 Obter certificado SSL
```bash
sudo certbot --nginx -d seudominio.com -d www.seudominio.com
```

## 🛡️ Segurança

### Recomendações:
1. **Firewall**: Mantenha apenas as portas necessárias abertas
2. **Senhas fortes**: Use senhas complexas no .env.production
3. **Updates**: Mantenha o sistema atualizado
4. **Backups**: Faça backups regulares do banco de dados
5. **HTTPS**: Configure SSL para produção
6. **Usuário não-root**: Evite executar como root

### Atualizar o sistema regularmente
```bash
sudo apt update && sudo apt upgrade -y
```

## 📊 Monitoramento

### Verificar saúde da aplicação
```bash
# Verificar se o backend está respondendo
curl http://localhost:3000/api/health

# Verificar se o frontend está respondendo
curl http://localhost
```

### Configurar restart automático
Os containers já estão configurados para reiniciar automaticamente com `restart: always`

## ❌ Solução de Problemas

### Container não inicia
```bash
# Ver logs detalhados
docker compose -f docker-compose.prod.yml logs [nome-do-servico]

# Reconstruir sem cache
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

### Banco de dados não conecta
```bash
# Verificar se o PostgreSQL está saudável
docker compose -f docker-compose.prod.yml ps

# Verificar logs do banco
docker compose -f docker-compose.prod.yml logs database

# Reiniciar o banco
docker compose -f docker-compose.prod.yml restart database
```

### Sem espaço em disco
```bash
# Limpar containers parados
docker container prune -f

# Limpar imagens não usadas
docker image prune -a -f

# Limpar volumes não usados (CUIDADO: pode apagar dados!)
docker volume prune -f
```

### Porta já em uso
```bash
# Ver o que está usando a porta 80 ou 3000
sudo lsof -i :80
sudo lsof -i :3000

# Matar processo se necessário
sudo kill -9 [PID]
```

## 💰 Custos Estimados

**VM e2-medium (2 vCPUs, 4 GB RAM):**
- ~$25-30/mês (sempre ligada)
- Free tier: 1x e2-micro (0.25-2 vCPUs, 1 GB RAM) - GRÁTIS permanentemente

**Otimizar custos:**
- Use e2-small ou e2-micro se possível
- Desligue a VM quando não estiver usando (desenvolvimento)
- Use snapshot para backups em vez de manter múltiplas VMs

## 📚 Recursos Adicionais

- [Documentação GCP](https://cloud.google.com/docs)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs dos containers
2. Verifique se as portas estão abertas no firewall
3. Verifique se as variáveis de ambiente estão corretas
4. Consulte a seção de Solução de Problemas acima

---

**Boa sorte com seu deploy! 🚀**
