#!/bin/sh

set -eu

repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$repo_dir"

wait_for_http() {
  url="$1"
  attempts="${2:-60}"
  while [ "$attempts" -gt 0 ]; do
    if response=$(curl -fsS "$url" 2>/dev/null); then
      printf '%s' "$response"
      return 0
    fi
    sleep 2
    attempts=$((attempts - 1))
  done
  return 1
}

kill_pid_if_running() {
  pid="$1"
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
  fi
}

kill_listener_on_port() {
  port="$1"
  pids=$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$pids" ]; then
    kill $pids 2>/dev/null || true
  fi
}

if [ -f package-lock.json ]; then
  npm ci
else
  npm install --no-fund --no-audit
fi

npm run build
CI=1 npm test -- --watch=false --browsers=ChromeHeadless

verifier_ui_smoke_port=${VERIFIER_UI_SMOKE_PORT:-4201}
smoke_log=$(mktemp "$repo_dir/verifier-ui-smoke.XXXXXX.log")
npm run start -- --port "$verifier_ui_smoke_port" >"$smoke_log" 2>&1 &
smoke_pid=$!

cleanup_smoke() {
  kill_pid_if_running "$smoke_pid"
  rm -f "$smoke_log"
}

trap cleanup_smoke EXIT INT TERM

if ! wait_for_http "http://localhost:$verifier_ui_smoke_port/" 90 >/dev/null; then
  kill_listener_on_port "$verifier_ui_smoke_port"
  cat "$smoke_log" >&2
  printf 'Verifier UI smoke test failed\n' >&2
  exit 1
fi

kill_pid_if_running "$smoke_pid"
trap - EXIT INT TERM
rm -f "$smoke_log"

printf 'Validated verifier UI build, tests, and smoke test\n'