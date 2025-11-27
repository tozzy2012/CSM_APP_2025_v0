# ZAPPER CS APP - TECHNICAL GUIDE & RESTART PROCEDURES

## 🏗️ ARQUITETURA (TL;DR para Devs)

O projeto é uma aplicação web moderna containerizada via Docker Compose:

- **Frontend**: React + Vite + TypeScript + TailwindCSS + ShadcnUI. Roda na porta `3000`.
- **Backend**: Python FastAPI + SQLAlchemy + Pydantic. Roda na porta `8000`.
- **Database**: PostgreSQL com extensão TimescaleDB (para métricas temporais). Persistência via volume Docker `zapper_postgres_data`.
- **Cache/Queue**: Redis (usado para filas de tarefas e cache).
- **Auth**: WorkOS para autenticação SSO e gerenciamento de usuários.
- **Integração**: OpenAI GPT-4 para inteligência de contas.

Tudo é orquestrado pelo `docker-compose.yml` na raiz.

---

## 🚨 POST-MORTEM: O INCIDENTE DO "DATABASE WIPE"

**O que aconteceu:** Em 27/11/2025, o banco de dados foi apagado acidentalmente.
**Causa:** Execução do comando `docker-compose down -v`.
**Lição Aprendida:** O flag `-v` remove os **Named Volumes** (`zapper_postgres_data`), que é onde o Postgres salva os dados. Sem esse volume, o container sobe zerado.

### ⛔ O QUE JAMAIS FAZER
**NUNCA** execute:
❌ `docker-compose down -v` (Remove containers E volumes de dados)

---

## ✅ PROCEDIMENTOS DE RESTART (SAFE OPERATIONS)

### 1. Parar Serviços (Mantendo Dados)
```bash
docker-compose down
```
*Remove os containers e redes, mas MANTÉM os volumes de dados.*

### 2. Iniciar Serviços
```bash
docker-compose up -d
```
*Sobe todo o stack em background.*

### 3. Rebuild (Após instalar libs ou alterar Dockerfile)
Se você alterou `requirements.txt` (backend) ou `package.json` (frontend):
```bash
docker-compose up -d --build
```
*Recria as imagens e containers. Seguro para dados.*

### 4. Reiniciar Serviço Específico
Se apenas um serviço travou (ex: backend):
```bash
docker-compose restart zapper-backend
```

---

## 🛠️ TROUBLESHOOTING COMUM

**Erro: "No module named 'xyz'" no Backend**
- **Causa:** Nova dependência adicionada no `requirements.txt` mas o container está rodando com a imagem antiga.
- **Solução:** `docker-compose up -d --build zapper-backend`

**Erro: Conexão recusada no Frontend (Porta 3000)**
- **Causa:** O container do frontend pode ter caído ou ainda estar subindo.
- **Check:** `docker-compose logs -f zapper-frontend`

**Erro: Banco de dados vazio/zerado**
- **Causa:** Provável execução de `down -v` ou deleção manual do volume.
- **Recuperação:** Se não houver backup externo, os dados foram perdidos. Será necessário recriar usuários e dados iniciais.
