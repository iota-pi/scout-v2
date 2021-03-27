#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$(realpath "$0")")"

environment="$(./tf.sh output environment)"
code_bucket="crosscode-lambdas"
version="$(./version.sh src)"

dest="s3://$code_bucket/$APP_NAME/$environment/$version"
existing_files=$(aws s3 ls "$dest/" || true)
if [[ -n $existing_files && -z ${FORCE_UPDATE:-} ]]; then
  echo "No changes to $lambda, skipping build and deploy."
  echo "Set the FORCE_UPDATE env variable to force an update."
  echo "Already built version is: $version"
  echo
  continue
fi

../ci.sh bundle
