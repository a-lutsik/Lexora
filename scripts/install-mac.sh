#!/usr/bin/env bash
# ============================================================
# LEXORA — build the app from this checkout and install it into
# /Applications (macOS), without a DMG.
#
#   bash scripts/install-mac.sh
#
# What it does: builds Lexora.app, quits a running Lexora, moves the old
# /Applications/Lexora.app to the Trash folder (nothing is deleted), copies
# the new one in, clears the download quarantine flag and opens it.
# The app data (vocabulary, settings) lives outside the .app and is kept.
# ============================================================
set -euo pipefail

APP_NAME="Lexora"
DEST="/Applications/${APP_NAME}.app"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUNDLE="${ROOT}/src-tauri/target/release/bundle/macos/${APP_NAME}.app"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This script installs the macOS app and must run on a Mac." >&2
  exit 1
fi

for tool in node npm cargo; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Missing '$tool'. Install Node.js and Rust (https://rustup.rs), then retry." >&2
    exit 1
  fi
done

cd "$ROOT"
echo "==> Installing frontend dependencies"
npm install

echo "==> Building ${APP_NAME}.app (first build takes several minutes)"
npm run tauri build -- --bundles app

if [[ ! -d "$BUNDLE" ]]; then
  echo "Build finished but ${BUNDLE} was not found." >&2
  exit 1
fi

echo "==> Quitting a running ${APP_NAME}"
osascript -e "tell application \"${APP_NAME}\" to quit" >/dev/null 2>&1 || true
sleep 1
pkill -x "$(echo "$APP_NAME" | tr '[:upper:]' '[:lower:]')" >/dev/null 2>&1 || true

if [[ -d "$DEST" ]]; then
  BACKUP="${HOME}/.Trash/${APP_NAME}-previous-$(date +%Y%m%d-%H%M%S).app"
  echo "==> Moving the old app to ${BACKUP}"
  mv "$DEST" "$BACKUP"
fi

echo "==> Installing into /Applications"
cp -R "$BUNDLE" "$DEST"
xattr -dr com.apple.quarantine "$DEST" 2>/dev/null || true

echo "==> Opening ${APP_NAME}"
open "$DEST"

cat <<MSG

Installed. If the app does not open, run it from a terminal to see why:
  ${DEST}/Contents/MacOS/$(echo "$APP_NAME" | tr '[:upper:]' '[:lower:]')

For the writing check in other apps: System Settings → Privacy & Security →
Accessibility → enable ${APP_NAME} (macOS resets this for a new build).
MSG
