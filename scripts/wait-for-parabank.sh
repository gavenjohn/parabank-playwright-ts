#!/usr/bin/env bash
# Polls the real application page, not just the port. Tomcat opens 8080
# well before it has finished deploying the WAR, so a port check passes
# too early and the first test fails with a 404.
set -e
for i in $(seq 1 60); do
  if curl -fsS http://localhost:8080/parabank/index.htm > /dev/null 2>\&1; then
    echo "ParaBank is up (after $((i\*5))s)"
    exit 0
  fi
  sleep 5
done
echo "ParaBank did not become ready in 5 minutes"
docker compose logs
exit 1
