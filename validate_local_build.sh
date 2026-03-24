#!/bin/sh

set -eu

repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$repo_dir"

if [ -f package-lock.json ]; then
  npm ci
else
  npm install --no-fund --no-audit
fi

npm run build
CI=1 npm test -- --watch=false --browsers=ChromeHeadless

printf 'Validated verifier UI build and tests\n'