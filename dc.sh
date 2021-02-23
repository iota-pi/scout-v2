#!/usr/bin/env bash
set -euo pipefail

set -a
source .secrets.*
set +a
docker-compose $@
