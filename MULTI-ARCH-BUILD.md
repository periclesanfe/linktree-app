# Solução para Problema de Arquitetura de Imagens Docker

## Problema Identificado

As imagens Docker geradas pelo pipeline CI/CD no GitHub Actions são construídas apenas para arquitetura **amd64**. Isso causa problemas ao executar em ambientes **arm64** (como Docker Desktop em Apple Silicon / macOS M1/M2/M3), resultando no erro:

```
Back-off pulling image "ghcr.io/periclesanfe/linktree-frontend:xxxxx":
Error response from daemon: no matching manifest for linux/arm64/v8 in the manifest list entries
```

## Estado Atual

- **Frontend**: Funcionando com imagem local `linktree-frontend:v2` (construída manualmente para arm64)
  - 2 pods saudáveis rodando
  - API URL corretamente configurada
  - Revisão 13 do Rollout está estável

- **Backend**: Funcionando corretamente

- **Limitação**: O ArgoCD Rollout mostra status "Degraded" porque tentativas de deploy com imagens do GHCR falham devido à incompatibilidade de arquitetura

## Opções de Solução

### Opção 1: Build Multi-Arquitetura no CI/CD (RECOMENDADO)

Atualizar o pipeline GitHub Actions para construir imagens para múltiplas arquiteturas.

**Arquivo**: `.github/workflows/gitops-cicd.yml`

**Modificações necessárias**:

#### Para o Backend (linha ~97):
```yaml
- name: Build and push Backend
  uses: docker/build-push-action@v5
  with:
    context: ./linktree-backend
    file: ./linktree-backend/Dockerfile
    push: true
    platforms: linux/amd64,linux/arm64  # ADICIONAR ESTA LINHA
    tags: ${{ steps.meta.outputs.tags }}
    labels: ${{ steps.meta.outputs.labels }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

#### Para o Frontend (linha ~160):
```yaml
- name: Build and push Frontend
  uses: docker/build-push-action@v5
  with:
    context: ./linktree-app
    file: ./linktree-app/Dockerfile
    push: true
    platforms: linux/amd64,linux/arm64  # ADICIONAR ESTA LINHA
    tags: ${{ steps.meta.outputs.tags }}
    labels: ${{ steps.meta.outputs.labels }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
    build-args: |
      VITE_BACKEND_URL=${{ steps.backend-url.outputs.url }}
```

**Vantagens**:
- Solução permanente e escalável
- Funciona em qualquer ambiente (amd64 ou arm64)
- Não requer mudanças nos manifestos Kubernetes/Helm
- Suporta tanto ambientes de desenvolvimento (local) quanto produção (cloud)

**Desvantagens**:
- Build levemente mais lento (2x o trabalho)
- Usa mais espaço no registry

**Nota sobre cache**: O cache do GitHub Actions (`cache-from: type=gha, cache-to: type=gha,mode=max`) continuará funcionando normalmente com builds multi-arch.

### Opção 2: Criar Ambiente de Desenvolvimento Separado

Criar arquivos de valores Helm específicos para desenvolvimento local com imagens locais.

**Criar novo arquivo**: `helm/linktree/values.dev-local.yaml`

```yaml
backend:
  image:
    repository: linktree-backend
    tag: dev-local
    pullPolicy: IfNotPresent

frontend:
  image:
    repository: linktree-frontend
    tag: dev-local
    pullPolicy: IfNotPresent
```

**Atualizar ArgoCD Application** para dev usar valores locais:

```bash
kubectl patch application linktree-dev-frontend -n argocd --type=json -p='[
  {"op": "add", "path": "/spec/source/helm/valueFiles/-", "value": "values.dev-local.yaml"}
]'
```

**Vantagens**:
- Separação clara entre dev e prod
- Não afeta pipeline de CI/CD
- Permite customizações específicas para desenvolvimento

**Desvantagens**:
- Requer manutenção de múltiplos arquivos de valores
- Necessita builds manuais locais
- Divergência entre ambientes dev e prod

### Opção 3: Usar Docker Buildx com QEMU (Desenvolvimento Local)

Permitir que o Docker local construa para múltiplas arquiteturas usando emulação.

**Setup único**:
```bash
# Instalar QEMU para emulação de arquiteturas
docker run --rm --privileged multiarch/qemu-user-static --reset -p yes

# Criar builder multi-arquitetura
docker buildx create --name multiarch --driver docker-container --use
docker buildx inspect --bootstrap
```

**Builds**:
```bash
# Backend
cd linktree-backend
docker buildx build --platform linux/amd64,linux/arm64 \
  -t ghcr.io/periclesanfe/linktree-backend:dev \
  --push .

# Frontend
cd ../linktree-app
docker buildx build --platform linux/amd64,linux/arm64 \
  --build-arg VITE_BACKEND_URL=https://api.linktree.yourdomain.com \
  -t ghcr.io/periclesanfe/linktree-frontend:dev \
  --push .
```

**Vantagens**:
- Permite testar builds multi-arch localmente
- Útil para desenvolvimento e testes
- Imagens compatíveis com GHCR

**Desvantagens**:
- Builds locais são mais lentos (emulação)
- Ainda requer modificar CI/CD para produção
- Setup adicional em cada máquina de dev

## Comandos Úteis para Debug

### Verificar arquitetura de uma imagem
```bash
docker manifest inspect ghcr.io/periclesanfe/linktree-frontend:TAG | grep architecture
```

### Build local com arquitetura específica
```bash
# Para arm64 (Apple Silicon)
docker build --platform linux/arm64 -t linktree-frontend:local .

# Para amd64
docker build --platform linux/amd64 -t linktree-frontend:local .
```

### Verificar status do Rollout
```bash
kubectl argo rollouts get rollout linktree-prod-linktree-frontend -n prod
```

### Abortar rollout com falha
```bash
kubectl argo rollouts abort linktree-prod-linktree-frontend -n prod
```

### Verificar logs de pod com problema de imagem
```bash
kubectl describe pod <POD_NAME> -n prod | grep -A 10 "Events:"
```

## Recomendação Final

**Implementar Opção 1** - Build Multi-Arquitetura no CI/CD

Esta é a solução mais robusta e alinhada com as melhores práticas de DevOps:
1. Uma única imagem funciona em qualquer plataforma
2. Não requer configurações especiais por ambiente
3. Preparado para cenários futuros (ex: migração para ARM em cloud)
4. Simples de implementar (apenas adicionar uma linha no workflow)

## Próximos Passos

1. Aplicar modificações no arquivo `.github/workflows/gitops-cicd.yml`
2. Fazer commit e push para disparar novo build
3. Aguardar build completar e verificar que ambas as arquiteturas foram geradas:
   ```bash
   docker manifest inspect ghcr.io/periclesanfe/linktree-frontend:latest
   ```
4. Atualizar imagens no cluster e verificar rollouts

## Referências

- [Docker Buildx Multi-platform Images](https://docs.docker.com/build/building/multi-platform/)
- [GitHub Actions Docker Build Push](https://github.com/docker/build-push-action)
- [Argo Rollouts Documentation](https://argoproj.github.io/argo-rollouts/)
