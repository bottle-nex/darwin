#!/usr/bin/env bash
# Re-points the chat connectors at whatever PUBLIC_API_URL currently is.
#
# Telegram delivers updates by pushing to a URL it stores server-side, so that URL has to be
# re-registered every time the tunnel hostname changes. Slack cannot be configured over an API
# at all — its redirect URL is allowlisted by hand in the app dashboard — so the best this can
# do is print the exact string to paste there.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env"

read_env() {
    python3 - "$ENV_FILE" "$1" <<'PY'
import re, sys
path, key = sys.argv[1], sys.argv[2]
try:
    text = open(path).read()
except OSError:
    sys.exit(0)
match = re.search(rf"^{re.escape(key)}=(.*)$", text, re.M)
print(match.group(1).strip().strip('"').strip("'") if match else "", end="")
PY
}

API_URL="$(read_env PUBLIC_API_URL)"
BOT_TOKEN="$(read_env TELEGRAM_BOT_TOKEN)"
WEBHOOK_SECRET="$(read_env TELEGRAM_WEBHOOK_SECRET)"

if [[ -z "$API_URL" ]]; then
    echo "PUBLIC_API_URL is not set in .env — start the tunnels first."
    exit 1
fi

echo "public api  : $API_URL"
echo ""

if [[ -z "$BOT_TOKEN" || -z "$WEBHOOK_SECRET" ]]; then
    echo "telegram    : skipped (TELEGRAM_BOT_TOKEN / TELEGRAM_WEBHOOK_SECRET not set)"
else
    TELEGRAM_HOOK="$API_URL/api/v1/connectors/telegram/webhook"
    RESPONSE="$(curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
        -H 'content-type: application/json' \
        -d "{\"url\":\"$TELEGRAM_HOOK\",\"secret_token\":\"$WEBHOOK_SECRET\",\"allowed_updates\":[\"message\",\"callback_query\"],\"drop_pending_updates\":true}")"

    if [[ "$RESPONSE" == *'"ok":true'* ]]; then
        echo "telegram    : webhook set -> $TELEGRAM_HOOK"
    else
        echo "telegram    : FAILED"
        echo "              $RESPONSE"
    fi
fi

SLACK_CLIENT_ID="$(read_env SLACK_CLIENT_ID)"
if [[ -z "$SLACK_CLIENT_ID" ]]; then
    echo "slack       : skipped (SLACK_CLIENT_ID not set)"
else
    echo "slack       : allowlist this redirect URL by hand at https://api.slack.com/apps"
    echo "              OAuth & Permissions -> Redirect URLs -> Add -> Save"
    echo ""
    echo "              $API_URL/api/v1/connectors/slack/callback"
fi

echo ""
