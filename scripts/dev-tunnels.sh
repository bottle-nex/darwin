#!/usr/bin/env bash
# Exposes the two local services a sandbox has to reach, and points .env at them.
#
# The sandbox runs on E2B's infrastructure, so "localhost" inside it is the sandbox — every
# callback it makes needs a public address. The vm worker uses this ngrok account's reserved
# free domain — cloudflared's free "quick tunnels" have no uptime or DNS-propagation guarantee,
# and in practice one of two tunnels started together would sometimes just never resolve. The
# api server keeps the cloudflared quick tunnel, whose hostname is regenerated on every start
# and so is written back into .env here rather than by hand.

set -euo pipefail

VM_PORT="${VM_PORT:-4100}"
API_PORT="${API_PORT:-4402}"
NGROK_DOMAIN="${NGROK_DOMAIN:-liberalistic-stereographic-leila.ngrok-free.dev}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env"
RUN_DIR="$(mktemp -d)"

cleanup() {
    echo ""
    echo "stopping tunnels..."
    [[ -n "${NGROK_PID:-}" ]] && kill "$NGROK_PID" 2>/dev/null || true
    [[ -n "${CF_PID:-}" ]] && kill "$CF_PID" 2>/dev/null || true
    rm -rf "$RUN_DIR"
}
trap cleanup EXIT INT TERM

for tool in ngrok cloudflared; do
    command -v "$tool" >/dev/null || { echo "missing: $tool"; exit 1; }
done

echo "vm worker   :$VM_PORT  -> ngrok      $NGROK_DOMAIN"
ngrok http --url="https://$NGROK_DOMAIN" "$VM_PORT" --log=stdout > "$RUN_DIR/ngrok.log" 2>&1 &
NGROK_PID=$!

echo "api server  :$API_PORT  -> cloudflared (assigning hostname...)"
cloudflared tunnel --url "http://localhost:$API_PORT" > "$RUN_DIR/cf.log" 2>&1 &
CF_PID=$!

CF_URL=""
for _ in $(seq 1 40); do
    CF_URL="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$RUN_DIR/cf.log" 2>/dev/null | head -1 || true)"
    [[ -n "$CF_URL" ]] && break
    sleep 1
done

if [[ -z "$CF_URL" ]]; then
    echo "cloudflared never printed a hostname. its log:"
    tail -20 "$RUN_DIR/cf.log"
    exit 1
fi

NGROK_URL="https://$NGROK_DOMAIN"

# Rewrite in place so a restart of this script cannot leave the sandbox pointed at a hostname
# that stopped existing when the previous tunnel died.
python3 - "$ENV_FILE" "$NGROK_URL" "$CF_URL" <<'PY'
import re, sys
path, vm_url, api_url = sys.argv[1], sys.argv[2], sys.argv[3]
with open(path) as handle:
    text = handle.read()
for key, value in (("VM_PUBLIC_URL", vm_url), ("PUBLIC_API_URL", api_url)):
    pattern = re.compile(rf"^{key}=.*$", re.M)
    if pattern.search(text):
        text = pattern.sub(f"{key}={value}", text, count=1)
    else:
        text = text.rstrip("\n") + f"\n{key}={value}\n"
with open(path, "w") as handle:
    handle.write(text)
PY

echo ""
echo "  VM_PUBLIC_URL=$NGROK_URL"
echo "  PUBLIC_API_URL=$CF_URL"
echo ""
"$ROOT/scripts/register-connectors.sh" || echo "connector registration failed — run scripts/register-connectors.sh by hand"

echo "written to .env — restart the vm worker AND the server so they read it."
echo "ctrl-c here stops both tunnels."
echo ""

for _ in $(seq 1 20); do
    vm_health="$(curl -s -m 5 -H 'ngrok-skip-browser-warning: 1' "$NGROK_URL/health" 2>/dev/null || true)"
    [[ "$vm_health" == *'"ok":true'* ]] && { echo "vm worker reachable through the tunnel"; break; }
    sleep 1
done
[[ "${vm_health:-}" == *'"ok":true'* ]] || echo "vm worker NOT answering on $NGROK_URL/health — is it running on :$VM_PORT?"

wait
