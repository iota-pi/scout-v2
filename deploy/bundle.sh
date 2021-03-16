#!/usr/bin/env bash
set -euo pipefail
base_dir="$(dirname "$(dirname "$(realpath "$0")")")"
cd "$base_dir"

poetry export --format requirements.txt --without-hashes > /tmp/requirements.txt
pip install -r /tmp/requirements.txt --target /tmp/package

zip_file="$(realpath ./package.zip)"
rm -f "$zip_file"
(cd /tmp/package; zip -qr "$zip_file" .)
(cd "$base_dir/src"; zip -qgr "$zip_file" .)
