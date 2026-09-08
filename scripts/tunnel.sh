#!/usr/bin/env bash
# Brings up the named Cloudflare tunnel that gives this machine stable public hostnames.
#
# Slack refuses any redirect_uri it has not been shown before, so the hostname the server is
# reachable on cannot change between restarts the way a quick tunnel's does. A named tunnel
# fixes the hostname to this machine; everything here is written to be re-runnable, so the
# login, the tunnel and each route are created once and skipped forever after.

set -uo pipefail

TUNNEL_NAME="${TUNNEL_NAME:-darwin-dev}"
CF_DIR="$HOME/.cloudflared"
CERT="$CF_DIR/cert.pem"
CONFIG="$CF_DIR/config.yml"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env"

BOLD="$(tput bold 2>/dev/null || true)"
DIM="$(tput dim 2>/dev/null || true)"
CYAN="$(tput setaf 6 2>/dev/null || true)"
GREEN="$(tput setaf 2 2>/dev/null || true)"
RED="$(tput setaf 1 2>/dev/null || true)"
RESET="$(tput sgr0 2>/dev/null || true)"

say() { printf "%s\n" "$*"; }
ok() { printf "%s✓%s %s\n" "$GREEN" "$RESET" "$*"; }
warn() { printf "%s!%s %s\n" "$RED" "$RESET" "$*"; }
step() { printf "\n%s%s%s\n" "$BOLD" "$*" "$RESET"; }

cleanup_cursor() { tput cnorm 2>/dev/null || true; }
trap cleanup_cursor EXIT INT TERM

# Arrow-key menu. Writes the chosen index to SELECTED_INDEX. Kept free of bash-4 constructs so
# it still runs on the bash 3.2 that ships with macOS.
choose() {
    local options=("$@")
    local count=${#options[@]}
    local selected=0
    local key rest i

    tput civis 2>/dev/null || true

    while true; do
        for i in $(seq 0 $((count - 1))); do
            if [ "$i" -eq "$selected" ]; then
                printf "  %s❯ %s%s\033[K\n" "$CYAN" "${options[$i]}" "$RESET"
            else
                printf "    %s%s%s\033[K\n" "$DIM" "${options[$i]}" "$RESET"
            fi
        done

        IFS= read -rsn1 key
        if [ "$key" = $'\x1b' ]; then
            IFS= read -rsn2 -t 1 rest
            case "$rest" in
                '[A') selected=$((selected - 1)); [ "$selected" -lt 0 ] && selected=$((count - 1)) ;;
                '[B') selected=$((selected + 1)); [ "$selected" -ge "$count" ] && selected=0 ;;
            esac
        elif [ -z "$key" ]; then
            break
        fi

        printf "\033[%dA" "$count"
    done

    tput cnorm 2>/dev/null || true
    SELECTED_INDEX=$selected
}

read_config_value() {
    python3 - "$CONFIG" "$1" <<'PY'
import re, sys
path, key = sys.argv[1], sys.argv[2]
try:
    text = open(path).read()
except OSError:
    sys.exit(0)
match = re.search(rf"^#\s*{re.escape(key)}:\s*(\S+)\s*$", text, re.M)
print(match.group(1) if match else "", end="")
PY
}

list_routes() {
    python3 - "$CONFIG" <<'PY'
import re, sys
try:
    text = open(sys.argv[1]).read()
except OSError:
    sys.exit(0)
pairs = re.findall(r"-\s*hostname:\s*(\S+)\s*\n\s*service:\s*(\S+)", text)
for hostname, service in pairs:
    print(f"{hostname}\t{service}")
PY
}

command -v cloudflared >/dev/null || {
    warn "cloudflared is not installed. brew install cloudflared"
    exit 1
}

command -v python3 >/dev/null || {
    warn "python3 is required."
    exit 1
}

step "Cloudflare account"
if [ -f "$CERT" ]; then
    ok "already logged in ($CERT)"
else
    say "opening a browser to authorize this machine..."
    cloudflared tunnel login || { warn "login failed"; exit 1; }
    [ -f "$CERT" ] || { warn "login did not produce $CERT"; exit 1; }
    ok "logged in"
fi

# Cloudflare reports a live tunnel's deleted_at as the zero timestamp rather than omitting it,
# so emptiness is not the test for whether a tunnel is gone.
tunnel_id() {
    cloudflared tunnel list --output json 2>/dev/null | python3 -c "
import json, sys
try:
    tunnels = json.load(sys.stdin)
except Exception:
    sys.exit(0)
name = sys.argv[1]
for tunnel in tunnels:
    deleted = (tunnel.get('deleted_at') or '').strip()
    if tunnel.get('name') == name and (not deleted or deleted.startswith('0001-01-01')):
        print(tunnel['id'])
        break
" "$TUNNEL_NAME" 2>/dev/null
}

step "Tunnel"
TUNNEL_ID="$(tunnel_id)"

if [ -n "$TUNNEL_ID" ]; then
    ok "$TUNNEL_NAME already exists ($TUNNEL_ID)"
else
    say "creating $TUNNEL_NAME..."
    if ! cloudflared tunnel create "$TUNNEL_NAME" 2>&1 | sed 's/^/  /'; then
        say "  ${DIM}create did not succeed — checking whether it already exists${RESET}"
    fi

    TUNNEL_ID="$(tunnel_id)"
    if [ -n "$TUNNEL_ID" ]; then
        ok "using existing $TUNNEL_NAME ($TUNNEL_ID)"
    else
        warn "could not create or find a tunnel named $TUNNEL_NAME"
        warn "list them with: cloudflared tunnel list"
        exit 1
    fi
fi

CREDENTIALS="$CF_DIR/$TUNNEL_ID.json"
if [ ! -f "$CREDENTIALS" ]; then
    warn "no credentials file at $CREDENTIALS"
    warn "this tunnel was likely created on another machine or from the dashboard."
    warn "recreate it here with: cloudflared tunnel delete $TUNNEL_NAME && ./scripts/tunnel.sh"
    exit 1
fi

step "Zone"
DOMAIN="$(read_config_value domain)"
if [ -n "$DOMAIN" ]; then
    ok "using $DOMAIN"
else
    printf "  base domain on Cloudflare (e.g. anjan.site): "
    read -r DOMAIN
    DOMAIN="$(printf "%s" "$DOMAIN" | tr -d '[:space:]')"
    [ -n "$DOMAIN" ] || { warn "a domain is required"; exit 1; }
fi

if [ ! -f "$CONFIG" ]; then
    cat > "$CONFIG" <<EOF
# domain: $DOMAIN
tunnel: $TUNNEL_NAME
credentials-file: $CREDENTIALS

ingress:
  - service: http_status:404
EOF
    ok "wrote $CONFIG"
else
    python3 - "$CONFIG" "$DOMAIN" <<'PY'
import re, sys
path, domain = sys.argv[1:3]
text = open(path).read()
if re.search(r"^#\s*domain:", text, re.M):
    text = re.sub(r"^#\s*domain:.*$", f"# domain: {domain}", text, count=1, flags=re.M)
else:
    text = f"# domain: {domain}\n" + text
open(path, "w").write(text)
PY
fi

# A hostname on some other zone cannot resolve to this tunnel, so it is not a route — it is a
# leftover. Left in place it would go on to poison .env and the Slack redirect URL.
prune_foreign_routes() {
    local foreign hostname service

    foreign="$(list_routes | grep -v "\.$DOMAIN	" || true)"
    [ -n "$foreign" ] || return 0

    warn "these routes are not on $DOMAIN:"
    while IFS=$'\t' read -r hostname service; do
        [ -n "$hostname" ] || continue
        printf "    %s -> %s\n" "$hostname" "$service"
    done <<EOF
$foreign
EOF

    say ""
    choose "Remove them" "Keep them"
    [ "$SELECTED_INDEX" -eq 0 ] || return 0

    python3 - "$CONFIG" "$DOMAIN" <<'PY'
import re, sys
path, domain = sys.argv[1:3]
lines = open(path).read().split("\n")
kept, index = [], 0
while index < len(lines):
    match = re.match(r"\s*-\s*hostname:\s*(\S+)", lines[index])
    if match and not match.group(1).endswith("." + domain):
        index += 1
        while index < len(lines) and not re.match(r"\s*-\s", lines[index]) and lines[index].strip():
            index += 1
        continue
    kept.append(lines[index])
    index += 1
open(path, "w").write("\n".join(kept))
PY
    ok "removed"
}

prune_foreign_routes

add_route() {
    local subdomain port hostname

    printf "  subdomain (just the label, e.g. %sapi%s): " "$BOLD" "$RESET"
    read -r subdomain
    subdomain="$(printf "%s" "$subdomain" | tr -d '[:space:]' | tr '[:upper:]' '[:lower:]')"

    if ! printf "%s" "$subdomain" | grep -qE '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'; then
        warn "'$subdomain' is not a valid subdomain label"
        return 1
    fi

    printf "  local port (just the number, e.g. %s4402%s): " "$BOLD" "$RESET"
    read -r port

    if ! printf "%s" "$port" | grep -qE '^[0-9]+$' || [ "$port" -lt 1 ] || [ "$port" -gt 65535 ]; then
        warn "'$port' is not a valid port"
        return 1
    fi

    hostname="$subdomain.$DOMAIN"

    if list_routes | grep -q "^$hostname	"; then
        warn "$hostname is already mapped — remove it from $CONFIG first"
        return 1
    fi

    python3 - "$CONFIG" "$hostname" "$port" "$DOMAIN" <<'PY'
import re, sys
path, hostname, port, domain = sys.argv[1:5]
text = open(path).read()

if not re.search(r"^#\s*domain:", text, re.M):
    text = f"# domain: {domain}\n" + text

entry = f"  - hostname: {hostname}\n    service: http://localhost:{port}\n"
catch_all = re.search(r"^\s*-\s*service:\s*http_status:404\s*$", text, re.M)

if catch_all:
    text = text[: catch_all.start()] + entry + text[catch_all.start() :]
else:
    text = text.rstrip("\n") + "\n" + entry + "  - service: http_status:404\n"

open(path, "w").write(text)
PY

    say "  routing DNS..."
    if cloudflared tunnel route dns "$TUNNEL_NAME" "$hostname" >/dev/null 2>&1; then
        ok "$hostname -> localhost:$port"
    else
        ok "$hostname -> localhost:$port ${DIM}(DNS record already existed)${RESET}"
    fi

    return 0
}

remove_route() {
    local routes hostname service options count

    routes="$(list_routes)"
    if [ -z "$routes" ]; then
        warn "nothing to remove"
        return 0
    fi

    options=()
    while IFS=$'\t' read -r hostname service; do
        [ -n "$hostname" ] || continue
        options[${#options[@]}]="$hostname -> $service"
    done <<EOF
$routes
EOF

    count=${#options[@]}
    options[$count]="Cancel"

    say ""
    choose "${options[@]}"
    [ "$SELECTED_INDEX" -lt "$count" ] || return 0

    hostname="$(printf "%s" "${options[$SELECTED_INDEX]}" | awk '{print $1}')"

    python3 - "$CONFIG" "$hostname" <<'PY'
import re, sys
path, hostname = sys.argv[1:3]
lines = open(path).read().split("\n")
kept, index = [], 0
while index < len(lines):
    match = re.match(r"\s*-\s*hostname:\s*(\S+)", lines[index])
    if match and match.group(1) == hostname:
        index += 1
        while index < len(lines) and not re.match(r"\s*-\s", lines[index]) and lines[index].strip():
            index += 1
        continue
    kept.append(lines[index])
    index += 1
open(path, "w").write("\n".join(kept))
PY

    ok "removed $hostname from the ingress"
    say "  ${DIM}its DNS record still exists — delete with: cloudflared tunnel route dns --overwrite-dns${RESET}"
}

sync_env() {
    local routes hostname service port key

    routes="$(list_routes)"
    [ -n "$routes" ] || return 0

    while IFS=$'\t' read -r hostname service; do
        case "$hostname" in
            *".$DOMAIN") ;;
            *) continue ;;
        esac

        port="${service##*:}"
        case "$port" in
            4402) key="PUBLIC_API_URL" ;;
            4100) key="VM_PUBLIC_URL" ;;
            *) continue ;;
        esac

        python3 - "$ENV_FILE" "$key" "https://$hostname" <<'PY'
import re, sys
path, key, value = sys.argv[1:4]
try:
    text = open(path).read()
except OSError:
    text = ""
pattern = re.compile(rf"^{re.escape(key)}=.*$", re.M)
if pattern.search(text):
    text = pattern.sub(f"{key}={value}", text, count=1)
else:
    text = text.rstrip("\n") + f"\n{key}={value}\n"
open(path, "w").write(text)
PY
        ok "$key=https://$hostname"
    done <<EOF
$routes
EOF
}

while true; do
    step "Routes on $DOMAIN"
    ROUTES="$(list_routes)"
    if [ -n "$ROUTES" ]; then
        while IFS=$'\t' read -r hostname service; do
            printf "  %s%s%s -> %s\n" "$CYAN" "$hostname" "$RESET" "$service"
        done <<EOF
$ROUTES
EOF
    else
        say "  ${DIM}none yet${RESET}"
    fi

    say ""
    choose "Add a subdomain" "Remove a subdomain" "Start the tunnel" "Quit"

    case "$SELECTED_INDEX" in
        0) add_route ;;
        1) remove_route ;;
        2) break ;;
        3) exit 0 ;;
    esac
done

if [ -z "$(list_routes)" ]; then
    warn "no routes configured — add at least one before starting."
    exit 1
fi

step "Environment"
sync_env

step "Connectors"
API_URL="$(python3 - "$ENV_FILE" <<'PY'
import re, sys
try:
    text = open(sys.argv[1]).read()
except OSError:
    sys.exit(0)
match = re.search(r"^PUBLIC_API_URL=(.*)$", text, re.M)
print(match.group(1).strip() if match else "", end="")
PY
)"

if [ -n "$API_URL" ]; then
    say "  Paste this into ${BOLD}api.slack.com/apps${RESET} -> OAuth & Permissions -> Redirect URLs:"
    say ""
    printf "    %s%s/api/v1/connectors/slack/callback%s\n" "$CYAN" "$API_URL" "$RESET"
    say ""
    say "  ${DIM}Event Subscriptions -> Request URL:${RESET}"
    printf "    %s%s/api/v1/connectors/slack/events%s\n" "$DIM" "$API_URL" "$RESET"
    say "  ${DIM}Interactivity -> Request URL:${RESET}"
    printf "    %s%s/api/v1/connectors/slack/interactions%s\n" "$DIM" "$API_URL" "$RESET"
    say ""
    printf "  press %sreturn%s once they are saved... " "$BOLD" "$RESET"
    read -r _

    if [ -x "$ROOT/scripts/register-connectors.sh" ]; then
        "$ROOT/scripts/register-connectors.sh" || warn "connector registration failed"
    fi
else
    warn "PUBLIC_API_URL is not set — map a route to port 4402 to enable the connectors."
fi

step "Running"
say "  ${DIM}ctrl-c stops the tunnel. Restart the server so it picks up .env.${RESET}"
say ""
exec cloudflared tunnel run "$TUNNEL_NAME"
