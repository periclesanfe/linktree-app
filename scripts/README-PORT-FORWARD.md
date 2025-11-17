# 🌐 Gerenciamento de Port-Forwards

Scripts para gerenciar exposição de portas da aplicação Linktree de forma robusta.

---

## 📁 Scripts Disponíveis

### 1. `port-forward.sh` - Gerenciador Standalone

Script independente para iniciar, parar e monitorar port-forwards.

#### Uso Básico

```bash
# Iniciar port-forwards para DEV (padrão)
./scripts/port-forward.sh start

# Iniciar port-forwards para PROD
./scripts/port-forward.sh start prod

# Parar port-forwards
./scripts/port-forward.sh stop dev

# Ver status
./scripts/port-forward.sh status dev

# Reiniciar port-forwards
./scripts/port-forward.sh restart dev
```

#### Portas Usadas

| Ambiente | Frontend | Backend |
|----------|----------|---------|
| **DEV**  | 5173     | 8000    |
| **PROD** | 5174     | 8001    |

---

## ✅ Melhorias Implementadas

### 1. **Validação de Services**
Antes de criar port-forwards, verifica se os services existem no cluster:
```bash
# Se service não existir, exibe erro e sai
Service linktree-dev-frontend não encontrado!
Execute: kubectl get svc -n dev
```

### 2. **Verificação de PIDs**
Garante que o processo de port-forward foi iniciado com sucesso:
```bash
✓ Frontend port-forward ativo (PID: 12345) → http://localhost:5173
✓ Backend port-forward ativo (PID: 12346) → http://localhost:8000
```

### 3. **Retry Logic**
Tenta estabelecer conexão com retry automático:
```bash
# Tenta 5 vezes com intervalo de 2-3 segundos
Tentativa 1/5 - Backend ainda não está respondendo...
Tentativa 2/5 - Backend ainda não está respondendo...
✓ Backend respondendo em http://localhost:8000
```

### 4. **Health Check Automático**
Valida conectividade após port-forward:
```bash
✓ Backend respondendo em http://localhost:8000
{
  "status": "healthy",
  "timestamp": "2024-11-17T15:30:00.000Z",
  "uptime": 42,
  "environment": "development"
}
```

### 5. **Logs de Diagnóstico**
Salva logs em `/tmp` para troubleshooting:
```bash
/tmp/pf-dev-frontend.log
/tmp/pf-dev-backend.log
```

### 6. **Detecção de Portas em Uso**
Identifica e libera portas ocupadas:
```bash
⚠️  Porta 5173 já está em uso!
→ Liberando porta...
✓ Porta liberada
```

---

## 🔧 Troubleshooting

### Problema: Port-forward não inicia

**Sintoma:**
```bash
✗ Não foi possível estabelecer port-forward do frontend
```

**Solução:**
```bash
# 1. Verificar se service existe
kubectl get svc -n dev | grep linktree

# 2. Verificar se pod está running
kubectl get pods -n dev | grep linktree

# 3. Ver logs do port-forward
cat /tmp/pf-dev-frontend.log

# 4. Tentar manualmente
kubectl port-forward -n dev svc/linktree-dev-frontend 5173:80
```

---

### Problema: Backend não responde

**Sintoma:**
```bash
⚠️  Tentativa 5/5 - Backend ainda não está respondendo...
⚠️  Backend não respondeu após 5 tentativas
```

**Solução:**
```bash
# 1. Verificar se deployment está ready
kubectl get deployment -n dev linktree-dev-backend

# 2. Ver logs do backend
kubectl logs -n dev deployment/linktree-dev-backend --tail=50

# 3. Verificar health do pod
kubectl exec -n dev deployment/linktree-dev-backend -- curl localhost:8000/api/health

# 4. Verificar se database está conectado
kubectl get pods -n dev | grep postgresql
```

---

### Problema: Porta já está em uso

**Sintoma:**
```bash
⚠️  Porta 8000 já está em uso!
```

**Solução:**
```bash
# 1. Identificar processo usando a porta
lsof -i :8000

# 2. Matar processo
kill -9 <PID>

# Ou usar o script (faz isso automaticamente)
./scripts/port-forward.sh restart dev
```

---

### Problema: Port-forward cai após alguns minutos

**Sintoma:**
Port-forward funciona inicialmente mas para de responder.

**Solução:**
```bash
# 1. Verificar se pod foi restartado
kubectl get pods -n dev -w

# 2. Verificar eventos
kubectl get events -n dev | grep linktree

# 3. Usar script de monitoramento (cria um loop)
while true; do
  ./scripts/port-forward.sh status dev
  sleep 30
done

# 4. Ou reiniciar automaticamente
while true; do
  ./scripts/port-forward.sh restart dev
  sleep 300  # Reinicia a cada 5 minutos
done
```

---

## 🎯 Exemplos de Uso

### Cenário 1: Desenvolvimento Local

```bash
# Iniciar aplicação DEV
./scripts/apresentacao-modular.sh --auto

# Se port-forwards caírem, reiniciar manualmente
./scripts/port-forward.sh restart dev

# Acessar aplicação
open http://localhost:5173
```

### Cenário 2: Testar Prod e Dev Simultaneamente

```bash
# Iniciar DEV (portas 5173 e 8000)
./scripts/port-forward.sh start dev

# Iniciar PROD (portas 5174 e 8001)
./scripts/port-forward.sh start prod

# Verificar ambos
./scripts/port-forward.sh status dev
./scripts/port-forward.sh status prod

# Acessar
open http://localhost:5173  # DEV
open http://localhost:5174  # PROD
```

### Cenário 3: Debug de Problemas

```bash
# Ver status detalhado
./scripts/port-forward.sh status dev

# Ver logs do backend
kubectl logs -n dev deployment/linktree-dev-backend -f

# Testar health endpoint diretamente
curl http://localhost:8000/api/health | jq

# Ver métricas
kubectl top pods -n dev
```

---

## 📊 Monitoramento Contínuo

### Script de Monitoramento Simples

Crie um script `monitor-ports.sh`:

```bash
#!/bin/bash

while true; do
    clear
    echo "=== Monitoramento Port-Forwards - $(date) ==="
    echo ""

    # Status dos port-forwards
    ./scripts/port-forward.sh status dev

    echo ""
    echo "=== Testando Conectividade ==="

    # Testar backend
    if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
        echo "✓ Backend: OK"
    else
        echo "✗ Backend: FALHOU"
        echo "→ Reiniciando port-forward..."
        ./scripts/port-forward.sh restart dev
    fi

    # Testar frontend
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "✓ Frontend: OK"
    else
        echo "✗ Frontend: FALHOU"
    fi

    sleep 10
done
```

---

## 🔐 Segurança

### Port-Forwards em Produção

**Importante:** Port-forwards são para desenvolvimento/debug apenas!

Para produção, use:
- **Ingress Controller** (NGINX, Traefik)
- **LoadBalancer Service**
- **NodePort** (apenas em clusters locais)

```yaml
# Exemplo: Ingress para produção
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: linktree-prod-ingress
  namespace: prod
spec:
  ingressClassName: nginx
  rules:
  - host: linktree.yourdomain.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: linktree-prod-backend
            port:
              number: 8000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: linktree-prod-frontend
            port:
              number: 80
```

---

## 📚 Referências

- [Kubectl Port Forward Docs](https://kubernetes.io/docs/tasks/access-application-cluster/port-forward-access-application-cluster/)
- [Debugging Services](https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/)
- [Kubernetes Networking](https://kubernetes.io/docs/concepts/services-networking/)

---

## ✅ Checklist de Validação

Antes de apresentar ou fazer demo:

- [ ] Services existem no cluster (`kubectl get svc -n dev`)
- [ ] Pods estão running (`kubectl get pods -n dev`)
- [ ] Port-forwards estão ativos (`./scripts/port-forward.sh status dev`)
- [ ] Backend responde no health endpoint (`curl http://localhost:8000/api/health`)
- [ ] Frontend carrega no navegador (`open http://localhost:5173`)
- [ ] Não há conflitos de porta (`lsof -i :5173` e `lsof -i :8000`)
- [ ] Logs não mostram erros (`kubectl logs -n dev deployment/linktree-dev-backend`)

---

## 🎉 Conclusão

Com as melhorias implementadas:
- ✅ **Port-forwards confiáveis** com retry e validação
- ✅ **Diagnóstico automático** de problemas
- ✅ **Health checks** integrados
- ✅ **Logs detalhados** para troubleshooting
- ✅ **Gerenciamento fácil** via script standalone

**Agora suas apresentações terão exposição de portas 100% funcional!** 🚀
