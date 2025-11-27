# COMO REINICIAR O ZAPPER CS APP DE FORMA SEGURA

ESTE GUIA EXPLICA COMO REINICIAR OS SERVIÇOS SEM PERDER DADOS.

## ⛔ O QUE JAMAIS FAZER

**NUNCA** execute o comando:
❌ `docker-compose down -v`

O flag `-v` significa "volumes", e ele **APAGA PERMANENTEMENTE** todo o banco de dados e arquivos salvos.

---

## ✅ COMO PARAR OS SERVIÇOS (SAFE STOP)

Para parar todos os containers (backend, frontend, banco, redis) de forma segura, mantendo seus dados salvos:

```bash
docker-compose down
```

Este comando para e remove os containers, mas **PRESERVA** os volumes onde os dados estão guardados.

---

## ✅ COMO INICIAR OS SERVIÇOS (SAFE START)

Para subir todos os serviços novamente:

```bash
docker-compose up -d
```

O `-d` (detach) libera seu terminal enquanto os serviços rodam em segundo plano.

---

## 🔄 CENÁRIOS COMUNS

### 1. Reiniciar apenas um serviço (ex: Backend travou)
Se você precisa reiniciar apenas um serviço específico sem mexer nos outros:

```bash
docker-compose restart zapper-backend
# ou
docker-compose restart zapper-frontend
```

### 2. Atualizou código ou instalou bibliotecas (Rebuild)
Se você alterou o `requirements.txt` ou `package.json` e precisa reconstruir o container:

```bash
docker-compose up -d --build
```
Isso recria os containers com as novas alterações, mas **NÃO APAGA O BANCO DE DADOS**.

---

## 📋 RESUMO DE COMANDOS

| Ação | Comando | Seguro para Dados? |
|------|---------|-------------------|
| **Parar tudo** | `docker-compose down` | ✅ **SIM** (Seguro) |
| **Iniciar tudo** | `docker-compose up -d` | ✅ **SIM** (Seguro) |
| **Ver logs** | `docker-compose logs -f` | ✅ **SIM** (Seguro) |
| **Reiniciar um** | `docker-compose restart [servico]` | ✅ **SIM** (Seguro) |
| **Reconstruir** | `docker-compose up -d --build` | ✅ **SIM** (Seguro) |
| **APAGAR TUDO** | `docker-compose down -v` | ❌ **PERIGO: APAGA DADOS** |
