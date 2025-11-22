#!/usr/bin/env bash
set -euo pipefail

# === config ===
TENANT="0dc89d29-8657-4cbb-860f-96069f63d7cf"
SECRET="supersegredo_dev_csapp_ricardo_123"
ALG="HS256"

# gera token válido por ~8h
TOKEN=$(python - <<'PY'
from datetime import datetime, timedelta, timezone
from uuid import uuid4
from jose import jwt
TENANT = "0dc89d29-8657-4cbb-860f-96069f63d7cf"
now = datetime.now(timezone.utc)
print(jwt.encode({
  "sub": str(uuid4()),
  "org_id": TENANT,
  "email": "ricardo@example.com",
  "roles": ["admin"],
  "iat": int(now.timestamp()),
  "exp": int((now + timedelta(hours=8)).timestamp()),
}, "supersegredo_dev_csapp_ricardo_123", algorithm="HS256"))
PY
)

# injeta no .env do front
cd ~/gpt-csapp/client
awk -v t="$TOKEN" 'BEGIN{set=0}
  /^VITE_DEV_TOKEN=/ {print "VITE_DEV_TOKEN=" t; set=1; next}
  {print}
  END{if(!set) print "VITE_DEV_TOKEN=" t}' .env > .env.new && mv .env.new .env

# reinicia Vite
pkill -f "vite" 2>/dev/null || true
npm run dev -- --port 3003 --strictPort
