#!/bin/sh
set -eu

# Build-time env only. No runtime `env.js` injection.

exec "$@"
