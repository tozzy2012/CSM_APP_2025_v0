# ⚡ Zapper CS Platform

> **A Plataforma de Customer Success AI-First que sua equipe realmente vai querer usar.**

O **Zapper CS** é uma solução de Customer Success (CS) B2B projetada para ser a antítese das ferramentas enterprise complexas e lentas. Focada em **simplicidade**, **design premium** e **inteligência proativa**, ela empodera times de CS a gerenciar onboarding, adoção e renovação sem a necessidade de um administrador de sistemas dedicado.

---

## 🎯 A Missão

As ferramentas tradicionais (Gainsight, Totango) são poderosas, mas muitas vezes descritas como "monstruosas" e difíceis de usar. O Zapper CS resolve isso com:
1.  **UX tipo "Notion"**: Interface limpa, rápida e intuitiva.
2.  **AI-First**: A IA não é um add-on, é o núcleo que sugere ações e resume dados.
3.  **Custo Eficiente**: Arquitetura otimizada para baixo custo operacional.

## 🚀 Funcionalidades Principais

*   **Customer 360º**: Visão unificada da saúde, riscos e dados do cliente em uma única tela.
*   **Health Score Flexível**: Motor de saúde multidimensional (Adoção, Engajamento, Suporte) configurável.
*   **Timeline Unificada**: Feed cronológico de emails, notas e reuniões (Mini-CRM).
*   **AI Copilot**: Sugestões proativas de "Next-Best-Action" para o CSM (ex: "Risco de Churn detectado").
*   **Automação de Playbooks**: Gatilhos inteligentes para automatizar tarefas repetitivas.

## 🛠️ Tech Stack

O projeto utiliza uma arquitetura moderna e pragmática (Monolito Modular) para garantir velocidade de desenvolvimento e facilidade de manutenção:

### Frontend (`/client`)
*   **Framework**: React + Vite (SPA de alta performance).
*   **Estilização**: TailwindCSS + Shadcn/UI (Design moderno e responsivo).
*   **Estado**: React Query (Gerenciamento de dados do servidor).

### Backend (`/server`)
*   **Framework**: Python FastAPI (Assíncrono, rápido e ideal para IA).
*   **Banco de Dados**: PostgreSQL (Dados relacionais e JSONB).
*   **ORM**: SQLAlchemy (Gerenciamento de dados).
*   **IA/ML**: Integração nativa com bibliotecas Python de Data Science.

### Infraestrutura
*   **Docker & Docker Compose**: Orquestração simples para rodar tudo localmente com um comando.

## 🏁 Como Rodar o Projeto

### Pré-requisitos
*   Docker e Docker Compose instalados.

### Passo a Passo

1.  **Clone o repositório**:
    ```bash
    git clone <seu-repo-url>
    cd zapper-cs
    ```

2.  **Configure as variáveis de ambiente**:
    *   Copie o arquivo `.env.example` para `.env` na raiz (se existir) ou verifique as configurações padrão no `docker-compose.yml`.

3.  **Inicie a aplicação**:
    ```bash
    docker-compose up --build
    ```

4.  **Acesse**:
    *   **Frontend**: [http://localhost:3003](http://localhost:3003)
    *   **Backend API**: [http://localhost:8000/docs](http://localhost:8000/docs) (Documentação Swagger automática)

## 📂 Estrutura do Projeto

```
zapper-cs/
├── client/             # Frontend React/Vite
│   ├── src/            # Código fonte da UI
│   └── ...
├── server/             # Backend FastAPI
│   ├── main.py         # Ponto de entrada da API
│   ├── models.py       # Modelos de Banco de Dados
│   ├── routers/        # Rotas da API
│   └── ...
├── docker-compose.yml  # Orquestração dos serviços
└── README.md           # Você está aqui
```

---
*Desenvolvido com foco em simplicidade e impacto.*
