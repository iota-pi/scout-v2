#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$(realpath "$0")")"

outputs="$(./tf.sh output -json)"
environment=$(echo "$outputs" | jq -r ".environment.value")
code_bucket="crosscode-lambdas"
version="$(./version.sh api src)"

dest="s3://$code_bucket/$APP_NAME/$environment/$version"
existing_files=$(aws s3 ls "$dest/" || true)
if [[ -n $existing_files && -z ${FORCE_UPDATE:-} ]]; then
  echo "No changes to lambda, skipping build and deploy."
  echo "Set the FORCE_UPDATE env variable to force an update."
  echo "Already built version is: $version"
  exit
fi

(
  cd ..
  ./ci.sh bundle
  aws s3 cp "package.zip" "$dest/"
)

(
  cd ../api
  esbuild \
    index.ts \
    --outfile="build/lambda.js" \
    --bundle \
    --minify \
    --platform=node \
    --target=node14 \
    --external:aws-sdk
  (cd build && zip -r "../api.zip" .)
  aws s3 cp "api.zip" "$dest/"
)
