#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="beefc871-7f86-43df-b2cd-e3c1ddd6119d"
ENVIRONMENT_NAME="production"
SERVICE_NAME="mountainzeng"

run_railway() {
  NPM_CONFIG_CACHE=/tmp/.npm-cache npx -y @railway/cli "$@"
}

echo "Checking Railway auth..."
run_railway whoami >/dev/null

echo "Ensuring project/service linkage..."
run_railway project link \
  -p "$PROJECT_ID" \
  -e "$ENVIRONMENT_NAME" \
  -s "$SERVICE_NAME" \
  >/dev/null

echo "Triggering redeploy for service: $SERVICE_NAME"
run_railway service redeploy \
  -s "$SERVICE_NAME" \
  -y \
  --json

echo "Redeploy request submitted."
