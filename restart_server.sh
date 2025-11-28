#!/bin/bash
echo "🔄 Restarting Zapper CS Server (Docker)..."

docker restart zapper-backend

echo "✅ Server restarted!"
echo "📜 Tailing logs (Ctrl+C to exit)..."
echo "==================================================="
docker logs -f zapper-backend
