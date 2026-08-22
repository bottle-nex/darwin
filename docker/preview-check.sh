#!/usr/bin/env bash
set -euo pipefail

RUNNER="${MATCHA_PREVIEW_RUNNER:-/opt/matcha/preview-runner/index.js}"
PREVIEW_DIR="${MATCHA_PREVIEW_DIR:-/home/user/preview}"
ENV_FILE="${PREVIEW_DIR}/check-env.json"
LOG_FILE="${PREVIEW_DIR}/preview-check.log"
TIMEOUT_SECONDS=120
KILL_GRACE_SECONDS=10

mkdir -p "${PREVIEW_DIR}"

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
    echo "usage: preview-check [targetId ...]"
    echo
    echo "Mounts every target in matcha_preview/manifest.json in a real browser and reports"
    echo "why any of them failed. Exits 0 only when every target renders."
    exit 0
fi

if [ ! -f "${ENV_FILE}" ]; then
    echo "preview-check: ${ENV_FILE} is missing — the preview pipeline did not set this sandbox up" >&2
    exit 2
fi

WORKSPACE_ROOT=$(jq -r '.workspaceRoot' "${ENV_FILE}")
NEXT_APP_DIR=$(jq -r '.nextAppDir' "${ENV_FILE}")
BASE_URL=$(jq -r '.baseUrl' "${ENV_FILE}")
MODE=$(jq -r '.mode' "${ENV_FILE}")

jq -c --arg root "${WORKSPACE_ROOT}" --arg mode "${MODE}" \
    '{workspaceRoot: $root, detect: .detect, mode: $mode}' \
    "${ENV_FILE}" > "${PREVIEW_DIR}/scaffold-in.json"
node "${RUNNER}" scaffold --input "${PREVIEW_DIR}/scaffold-in.json" --output "${PREVIEW_DIR}/scaffold-out.json"

if [ "$#" -gt 0 ]; then
    TARGETS=$(printf '%s\n' "$@" | jq -R . | jq -sc .)
else
    TARGETS=null
fi

jq -nc --arg baseUrl "${BASE_URL}" --arg root "${WORKSPACE_ROOT}" --arg appDir "${NEXT_APP_DIR}" \
    --argjson targets "${TARGETS}" \
    '{baseUrl: $baseUrl, workspaceRoot: $root, nextAppDir: $appDir, navigationTimeoutMs: 45000}
     + (if $targets == null then {} else {targetIds: $targets} end)' \
    > "${PREVIEW_DIR}/check-in.json"
run_check() {
    setsid bash -c 'exec node "$1" check --input "$2" --output "$3" > "$4" 2>&1' bash \
        "${RUNNER}" "${PREVIEW_DIR}/check-in.json" "${PREVIEW_DIR}/check-out.json" "${LOG_FILE}" &
    local check_pid=$!

    (
        sleep "${TIMEOUT_SECONDS}"
        if kill -0 "${check_pid}" 2>/dev/null; then
            echo "preview-check: timed out after ${TIMEOUT_SECONDS}s" >> "${LOG_FILE}"
            kill -TERM -- "-${check_pid}" 2>/dev/null || kill -TERM "${check_pid}" 2>/dev/null || true
            sleep "${KILL_GRACE_SECONDS}"
            kill -KILL -- "-${check_pid}" 2>/dev/null || kill -KILL "${check_pid}" 2>/dev/null || true
        fi
    ) &
    local watchdog_pid=$!
    local status=0

    if wait "${check_pid}"; then
        status=0
    else
        status=$?
    fi
    kill "${watchdog_pid}" 2>/dev/null || true
    wait "${watchdog_pid}" 2>/dev/null || true
    cat "${LOG_FILE}"
    return "${status}"
}

run_check

jq -r '.results[]
    | if .ok
      then "PASS  \(.targetId) / \(.stateId)"
      else "FAIL  \(.targetId) / \(.stateId)        \(.problem)\n\(.detail | tostring | split("\n") | map("        " + .) | join("\n"))"
      end' "${PREVIEW_DIR}/check-out.json"

if [ "$(jq -r '.ok' "${PREVIEW_DIR}/check-out.json")" = "true" ]; then
    echo
    echo "every target renders"
    exit 0
fi

echo
echo "some targets did not render — fix the target file and run preview-check again"
exit 1
