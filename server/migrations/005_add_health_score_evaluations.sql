-- Migration: Add health_score_evaluations table
-- Description: Store detailed health score evaluation responses with pilar breakdown

CREATE TABLE IF NOT EXISTS health_score_evaluations (
    id VARCHAR(255) PRIMARY KEY,
    account_id VARCHAR(255) NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    evaluated_by VARCHAR(255) NOT NULL,
    evaluation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_score INTEGER NOT NULL,
    classification VARCHAR(50) NOT NULL,
    responses JSON NOT NULL,
    pilar_scores JSON,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_health_evaluations_account ON health_score_evaluations(account_id);
CREATE INDEX idx_health_evaluations_date ON health_score_evaluations(evaluation_date DESC);

-- Comments
COMMENT ON TABLE health_score_evaluations IS 'Stores detailed health score evaluations with individual question responses';
COMMENT ON COLUMN health_score_evaluations.responses IS 'JSON object mapping question IDs to response scores';
COMMENT ON COLUMN health_score_evaluations.pilar_scores IS 'JSON object with average scores per pilar';
