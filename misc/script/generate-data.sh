#!/bin/bash

set -eo pipefail

export PATH="tools/bin:$PATH"

LANGUAGE=${LANGUAGE:-fr-FR}
LATEST_VERSION=${LATEST_VERSION:-0.0.0}

DATA="{ \"latestVersion\": \"${LATEST_VERSION}\", \"language\": \"${LANGUAGE}\", \"abilities\": [] }"
ABILITIES=$(ls pkg/core/abilities/*)

for ability in $ABILITIES; do
  ability_translation=$(cat "$ability" | yq -o json eval "{ \"label\": .label[\"${LANGUAGE}\"], \"description\": .description[\"${LANGUAGE}\"], \"cost\": .cost }")
  DATA=$(echo $DATA | jq --argjson a "${ability_translation}" '.abilities += [$a]')
done

DATA=$(echo $DATA | jq '.abilities = ( .abilities | sort_by(.label) )')

echo $DATA | jq -r