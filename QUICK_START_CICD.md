# 🚀 Quick Start - Deploy Automático

Configuração rápida do CI/CD em 3 passos.

## Passo 1: Execute o script de setup

```bash
./setup-cicd.sh
```

O script vai:
- ✅ Gerar chaves SSH
- ✅ Adicionar chave à VM
- ✅ Testar conexão
- ✅ Mostrar valores dos secrets

## Passo 2: Configure os secrets no GitHub

Vá para: `https://github.com/SEU_USUARIO/SEU_REPO/settings/secrets/actions`

Clique em "New repository secret" e adicione 4 secrets:

| Nome | Descrição | Onde encontrar |
|------|-----------|----------------|
| `SSH_PRIVATE_KEY` | Chave privada SSH | O script mostrará no terminal |
| `VM_IP` | IP da VM | Ex: `35.223.99.165` |
| `VM_USER` | Usuário SSH | Ex: `xxmra` |
| `PROJECT_DIR` | Caminho do projeto na VM | Ex: `/home/xxmra/linktree` |

## Passo 3: Teste o deploy

```bash
# Fazer qualquer alteração
echo "test" > test.txt

# Commit e push para main
git add .
git commit -m "test: CI/CD"
git push origin main
```

Acompanhe em: `https://github.com/SEU_USUARIO/SEU_REPO/actions`

## ✅ Pronto!

Agora todo commit para `main` fará deploy automático! 🎉

## 📚 Documentação Completa

Para mais detalhes, veja [SETUP_CI_CD.md](SETUP_CI_CD.md)

## 🔍 Troubleshooting Rápido

**Erro de permissão SSH:**
```bash
# Adicione a chave manualmente
cat ~/.ssh/github_actions_deploy.pub | ssh VM_USER@VM_IP "cat >> ~/.ssh/authorized_keys"
```

**Deploy não roda:**
- Verifique se os 4 secrets estão configurados
- Verifique se a branch é `main`
- Veja os logs em GitHub Actions

**Aplicação não sobe:**
```bash
# SSH na VM e verifique
ssh VM_USER@VM_IP
cd PROJECT_DIR
docker compose -f docker-compose.prod.yml ps
docker logs linktree-backend
```
