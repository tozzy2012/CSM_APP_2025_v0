-- ============================================================================
-- Zapper CS Platform - Database Schema
-- PostgreSQL + TimescaleDB
-- ============================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- ============================================================================
-- TABELAS DO MÓDULO CRM (servico-crm)
-- ============================================================================

-- Tabela de Tenants (Organizações)
CREATE TABLE tenants (
    tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'starter', -- starter, professional, enterprise
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, suspended, cancelled
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Contas (Clientes do tenant)
CREATE TABLE accounts (
    account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    industry VARCHAR(100),
    company_size VARCHAR(50), -- 1-10, 11-50, 51-200, 201-1000, 1000+
    address TEXT,
    lifecycle_stage VARCHAR(50) DEFAULT 'onboarding', -- onboarding, adoption, renewal, expansion, churn
    csm_owner_id UUID, -- ID do CSM responsável (do sistema de identidade externo)
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, domain)
);

CREATE INDEX idx_accounts_tenant ON accounts(tenant_id);
CREATE INDEX idx_accounts_csm ON accounts(csm_owner_id);
CREATE INDEX idx_accounts_stage ON accounts(lifecycle_stage);

-- Tabela de Contatos
CREATE TABLE contacts (
    contact_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    job_title VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, email)
);

CREATE INDEX idx_contacts_account ON contacts(account_id);
CREATE INDEX idx_contacts_email ON contacts(email);

-- Tabela de Assinaturas
CREATE TABLE subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    mrr DECIMAL(10, 2) NOT NULL, -- Monthly Recurring Revenue
    arr DECIMAL(10, 2) NOT NULL, -- Annual Recurring Revenue
    currency VARCHAR(3) DEFAULT 'USD',
    start_date DATE NOT NULL,
    renewal_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- active, cancelled, expired
    licenses_purchased INTEGER DEFAULT 1,
    licenses_active INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_account ON subscriptions(account_id);
CREATE INDEX idx_subscriptions_renewal ON subscriptions(renewal_date);

-- ============================================================================
-- TABELAS DO MÓDULO DE ATIVIDADES (servico-atividades)
-- ============================================================================

-- Tabela de Atividades (Timeline)
CREATE TABLE activities (
    activity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- note, call, meeting, email, system
    subject VARCHAR(500),
    description TEXT,
    created_by_user_id UUID, -- ID do usuário que criou (CSM)
    activity_date TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}', -- Dados adicionais (participantes, anexos, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activities_account ON activities(account_id);
CREATE INDEX idx_activities_date ON activities(activity_date DESC);
CREATE INDEX idx_activities_type ON activities(activity_type);

-- Tabela de Tarefas
CREATE TABLE tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES accounts(account_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    assigned_to_user_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'open', -- open, in_progress, completed, cancelled
    priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high, urgent
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_account ON tasks(account_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to_user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due ON tasks(due_date);

-- ============================================================================
-- TABELAS DO MÓDULO DE INGESTÃO DE EVENTOS (servico-ingestao-eventos)
-- ============================================================================

-- Tabela de Eventos de Produto (Hypertable do TimescaleDB)
CREATE TABLE product_events (
    event_id UUID DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    account_id UUID NOT NULL,
    user_id VARCHAR(255), -- ID do usuário final no produto do cliente
    event_name VARCHAR(255) NOT NULL,
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    properties JSONB DEFAULT '{}',
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Converter para hypertable (TimescaleDB)
SELECT create_hypertable('product_events', 'event_timestamp', 
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

CREATE INDEX idx_product_events_account ON product_events(account_id, event_timestamp DESC);
CREATE INDEX idx_product_events_name ON product_events(event_name);
CREATE INDEX idx_product_events_tenant ON product_events(tenant_id, event_timestamp DESC);

-- Agregações Contínuas para Métricas de Adoção
CREATE MATERIALIZED VIEW daily_adoption_metrics
WITH (timescaledb.continuous) AS
SELECT
    tenant_id,
    account_id,
    time_bucket('1 day', event_timestamp) AS day,
    COUNT(DISTINCT user_id) AS active_users,
    COUNT(*) AS total_events,
    COUNT(DISTINCT event_name) AS unique_features_used,
    COUNT(DISTINCT session_id) AS sessions
FROM product_events
GROUP BY tenant_id, account_id, day
WITH NO DATA;

-- Política de refresh automático
SELECT add_continuous_aggregate_policy('daily_adoption_metrics',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

-- ============================================================================
-- TABELAS DO MÓDULO DE HEALTH SCORE (servico-healthscore)
-- ============================================================================

-- Tabela de Configuração de Scorecards
CREATE TABLE health_scorecards (
    scorecard_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, name)
);

-- Tabela de Componentes de Métricas do Scorecard
CREATE TABLE scorecard_components (
    component_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scorecard_id UUID NOT NULL REFERENCES health_scorecards(scorecard_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- ex: "Product Adoption", "Engagement"
    weight DECIMAL(5, 2) NOT NULL CHECK (weight >= 0 AND weight <= 100), -- Peso percentual
    metric_source VARCHAR(100) NOT NULL, -- ex: "product_events", "activities", "surveys"
    calculation_logic JSONB NOT NULL, -- Lógica de cálculo em formato JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scorecard_components ON scorecard_components(scorecard_id);

-- Tabela de Health Scores Históricos
CREATE TABLE health_scores (
    score_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    scorecard_id UUID NOT NULL REFERENCES health_scorecards(scorecard_id),
    score_value DECIMAL(5, 2) NOT NULL CHECK (score_value >= 0 AND score_value <= 100),
    status VARCHAR(50) NOT NULL, -- green, yellow, red
    component_scores JSONB, -- Scores individuais de cada componente
    calculated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_health_scores_account ON health_scores(account_id, calculated_at DESC);
CREATE INDEX idx_health_scores_status ON health_scores(status);

-- ============================================================================
-- TABELAS DO MÓDULO DE PLAYBOOKS (servico-playbooks)
-- ============================================================================

-- Tabela de Playbooks
CREATE TABLE playbooks (
    playbook_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    trigger_config JSONB NOT NULL, -- Configuração do gatilho (tipo, condições)
    actions_config JSONB NOT NULL, -- Lista de ações a executar
    created_by_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_playbooks_tenant ON playbooks(tenant_id);
CREATE INDEX idx_playbooks_active ON playbooks(is_active);

-- Tabela de Execuções de Playbooks
CREATE TABLE playbook_executions (
    execution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playbook_id UUID NOT NULL REFERENCES playbooks(playbook_id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL, -- pending, running, completed, failed
    triggered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    execution_log JSONB, -- Log detalhado da execução
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_executions_playbook ON playbook_executions(playbook_id);
CREATE INDEX idx_executions_account ON playbook_executions(account_id);
CREATE INDEX idx_executions_status ON playbook_executions(status);

-- ============================================================================
-- TABELAS DO MÓDULO DE IA (servico-inferencia-ia)
-- ============================================================================

-- Tabela de Previsões de Churn
CREATE TABLE churn_predictions (
    prediction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    churn_probability DECIMAL(5, 4) NOT NULL CHECK (churn_probability >= 0 AND churn_probability <= 1),
    risk_level VARCHAR(50) NOT NULL, -- low, medium, high, critical
    contributing_factors JSONB, -- Fatores que contribuem para o risco
    model_version VARCHAR(50) NOT NULL,
    predicted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_churn_predictions_account ON churn_predictions(account_id, predicted_at DESC);
CREATE INDEX idx_churn_predictions_risk ON churn_predictions(risk_level);

-- Tabela de Oportunidades de Expansão
CREATE TABLE expansion_opportunities (
    opportunity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    opportunity_type VARCHAR(100) NOT NULL, -- upsell, cross_sell, add_licenses
    confidence_score DECIMAL(5, 4) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    estimated_value DECIMAL(10, 2),
    reasoning TEXT,
    signals JSONB, -- Sinais comportamentais que indicam a oportunidade
    model_version VARCHAR(50) NOT NULL,
    identified_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'new', -- new, contacted, qualified, closed_won, closed_lost
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expansion_account ON expansion_opportunities(account_id, identified_at DESC);
CREATE INDEX idx_expansion_status ON expansion_opportunities(status);

-- Tabela de Recomendações de Next-Best-Action
CREATE TABLE nba_recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL, -- call, email, schedule_qbr, send_playbook, etc.
    priority VARCHAR(50) NOT NULL, -- low, medium, high, urgent
    reasoning TEXT NOT NULL,
    context JSONB, -- Contexto adicional para a recomendação
    recommended_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, dismissed, completed
    actioned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nba_account ON nba_recommendations(account_id, recommended_at DESC);
CREATE INDEX idx_nba_status ON nba_recommendations(status);

-- ============================================================================
-- TABELAS DO MÓDULO DE COLABORAÇÃO (Portal do Cliente)
-- ============================================================================

-- Tabela de Planos de Sucesso
CREATE TABLE success_plans (
    plan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    business_objectives JSONB, -- Lista de objetivos de negócio
    status VARCHAR(50) DEFAULT 'active', -- draft, active, completed, archived
    created_by_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_success_plans_account ON success_plans(account_id);

-- Tabela de Marcos (Milestones)
CREATE TABLE milestones (
    milestone_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES success_plans(plan_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_date DATE,
    status VARCHAR(50) DEFAULT 'not_started', -- not_started, in_progress, completed
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_milestones_plan ON milestones(plan_id);

-- ============================================================================
-- TABELAS DE SURVEYS (NPS, CSAT)
-- ============================================================================

-- Tabela de Surveys
CREATE TABLE surveys (
    survey_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    survey_type VARCHAR(50) NOT NULL, -- nps, csat, ces
    name VARCHAR(255) NOT NULL,
    questions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Respostas de Surveys
CREATE TABLE survey_responses (
    response_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL REFERENCES surveys(survey_id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(contact_id) ON DELETE SET NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    score INTEGER, -- Para NPS (0-10), CSAT (1-5)
    feedback TEXT,
    responses JSONB, -- Respostas completas
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_survey_responses_account ON survey_responses(account_id, submitted_at DESC);
CREATE INDEX idx_survey_responses_survey ON survey_responses(survey_id);

-- ============================================================================
-- FUNÇÕES E TRIGGERS
-- ============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas relevantes
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_scorecards_updated_at BEFORE UPDATE ON health_scorecards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scorecard_components_updated_at BEFORE UPDATE ON scorecard_components
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playbooks_updated_at BEFORE UPDATE ON playbooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expansion_opportunities_updated_at BEFORE UPDATE ON expansion_opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_success_plans_updated_at BEFORE UPDATE ON success_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON surveys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DADOS DE EXEMPLO (SEED)
-- ============================================================================

-- Inserir tenant de exemplo
INSERT INTO tenants (tenant_id, name, subdomain, plan) VALUES
('00000000-0000-0000-0000-000000000001', 'Acme Corporation', 'acme', 'professional');

-- Inserir conta de exemplo
INSERT INTO accounts (account_id, tenant_id, name, domain, industry, company_size, lifecycle_stage) VALUES
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 
 'TechStart Inc', 'techstart.com', 'Technology', '11-50', 'adoption');

-- Inserir contato de exemplo
INSERT INTO contacts (contact_id, account_id, tenant_id, first_name, last_name, email, job_title, is_primary) VALUES
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 
 '00000000-0000-0000-0000-000000000001', 'John', 'Doe', 'john.doe@techstart.com', 'CTO', TRUE);

-- Inserir assinatura de exemplo
INSERT INTO subscriptions (subscription_id, account_id, tenant_id, product_name, plan_name, mrr, arr, start_date, renewal_date, licenses_purchased) VALUES
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 
 '00000000-0000-0000-0000-000000000001', 'Zapper Platform', 'Professional', 499.00, 5988.00, 
 '2025-01-01', '2026-01-01', 10);

-- ============================================================================
-- VIEWS ÚTEIS
-- ============================================================================

-- View para resumo de contas com métricas agregadas
CREATE OR REPLACE VIEW account_summary AS
SELECT 
    a.account_id,
    a.tenant_id,
    a.name,
    a.lifecycle_stage,
    a.csm_owner_id,
    s.mrr,
    s.arr,
    s.renewal_date,
    s.licenses_purchased,
    s.licenses_active,
    (SELECT score_value FROM health_scores hs 
     WHERE hs.account_id = a.account_id 
     ORDER BY calculated_at DESC LIMIT 1) as latest_health_score,
    (SELECT status FROM health_scores hs 
     WHERE hs.account_id = a.account_id 
     ORDER BY calculated_at DESC LIMIT 1) as health_status,
    (SELECT COUNT(*) FROM activities act 
     WHERE act.account_id = a.account_id 
     AND act.activity_date > CURRENT_TIMESTAMP - INTERVAL '30 days') as activities_last_30_days,
    (SELECT MAX(activity_date) FROM activities act 
     WHERE act.account_id = a.account_id) as last_activity_date
FROM accounts a
LEFT JOIN subscriptions s ON a.account_id = s.account_id AND s.status = 'active';

COMMENT ON VIEW account_summary IS 'Resumo consolidado de contas com métricas principais';
