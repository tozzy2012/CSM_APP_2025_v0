-- Create invites table
CREATE TABLE IF NOT EXISTS invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR NOT NULL,
    token VARCHAR NOT NULL UNIQUE,
    role VARCHAR NOT NULL,
    organization_id VARCHAR,
    invited_by VARCHAR REFERENCES users(id), -- Changed to VARCHAR to match users.id
    status VARCHAR NOT NULL DEFAULT 'pending', -- pending, accepted, revoked
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(email)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);
