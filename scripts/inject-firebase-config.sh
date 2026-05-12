#!/usr/bin/env bash
# scripts/inject-firebase-config.sh
#
# Build-time Firebase config injection. Replaces __FB_<env>_<KEY>__
# placeholders in js/environment.js with real values from env vars.
# Fails (exit 1) if any required env var is empty or if any
# placeholder for the requested env remains after substitution.
#
# Usage:
#   scripts/inject-firebase-config.sh PROD       # called by pages.yml
#   scripts/inject-firebase-config.sh STAGING    # called by Cloudflare Pages build
#
# Required env vars (replace <ENV> with PROD or STAGING):
#   FB_<ENV>_API_KEY
#   FB_<ENV>_AUTH_DOMAIN
#   FB_<ENV>_PROJECT_ID
#   FB_<ENV>_STORAGE_BUCKET
#   FB_<ENV>_MESSAGING_SENDER_ID
#   FB_<ENV>_APP_ID
#   FB_<ENV>_MEASUREMENT_ID
#
# This script is intentionally idempotent: running it twice for the
# same env is a no-op the second time (placeholders are already gone).

set -euo pipefail

ENV_NAME="${1:-}"
if [ "$ENV_NAME" != "PROD" ] && [ "$ENV_NAME" != "STAGING" ]; then
  echo "Usage: $0 <PROD|STAGING>" >&2
  exit 1
fi

# Resolve target file relative to repo root so the script works from any cwd.
script_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
FILE="$repo_root/js/environment.js"

if [ ! -f "$FILE" ]; then
  echo "::error::$FILE not found" >&2
  exit 1
fi

KEYS=(API_KEY AUTH_DOMAIN PROJECT_ID STORAGE_BUCKET MESSAGING_SENDER_ID APP_ID MEASUREMENT_ID)

missing=()
for key in "${KEYS[@]}"; do
  var_name="FB_${ENV_NAME}_${key}"
  value="${!var_name:-}"
  if [ -z "$value" ]; then
    missing+=("$var_name")
  fi
done

if [ ${#missing[@]} -gt 0 ]; then
  echo "::error::missing required env vars: ${missing[*]}" >&2
  echo "  Set these as GitHub repository Secrets (for PROD via pages.yml)" >&2
  echo "  or Cloudflare Pages environment variables (for STAGING)." >&2
  exit 1
fi

for key in "${KEYS[@]}"; do
  var_name="FB_${ENV_NAME}_${key}"
  value="${!var_name}"
  placeholder="__FB_${ENV_NAME}_${key}__"
  # Use | as sed delimiter — Firebase values never contain | but commonly contain /.
  # Escape any | that might appear in the value just in case.
  safe_value="${value//|/\\|}"
  sed -i "s|${placeholder}|${safe_value}|g" "$FILE"
done

# Sanity check: no placeholders for this env should remain.
if grep -q "__FB_${ENV_NAME}_" "$FILE"; then
  echo "::error::placeholders still in $FILE after injection:" >&2
  grep "__FB_${ENV_NAME}_" "$FILE" >&2
  exit 1
fi

echo "✓ Firebase $ENV_NAME config injected into js/environment.js"
