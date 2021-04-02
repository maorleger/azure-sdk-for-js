#!/bin/sh

set -e

echo "Using node $(node -v) to run JS samples"

for SAMPLE in javascript/*.js; do
  node ${SAMPLE}
done

echo "Using node $(node -v) to run TS samples"

for SAMPLE in typescript/dist/*.js; do
  node ${SAMPLE}
done
