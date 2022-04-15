#!/usr/bin/env bash
# shellcheck disable=SC2029

source sync.env

echo "> updating source code..."
rsync \
    --verbose \
    --include "api/.env" \
    --include 'api/mosquitto/config/mosquitto.conf' \
    --exclude ".git" \
    --exclude-from ".gitignore" \
    --exclude-from "api/.gitignore" \
    --rsync-path="sudo rsync" \
    -aze "ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no -i $PRIVATE_KEY" \
    . "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"


