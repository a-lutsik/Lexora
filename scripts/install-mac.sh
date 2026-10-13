#!/usr/bin/env bash
# ============================================================
# LEXORA — build the app from this checkout and install it into
# /Applications (macOS), without a DMG.
#
#   bash scripts/install-mac.sh
#   LEXORA_SIGN_IDENTITY="Apple Development: Name (TEAMID)" bash scripts/install-mac.sh
#
# Signing: macOS ties the Accessibility permission to the app's code
# signature. An ad-hoc signature changes with every build, so the permission
# has to be granted again after each reinstall. With a certificate the
# signature stays stable and the permission survives. The identity is taken
# from LEXORA_SIGN_IDENTITY, else the first valid code-signing identity in the
# keychain; with none, the app stays ad-hoc signed (and a warning is shown).
# See "Creating a local certificate" at the end of this output if you have none.
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

SIGN_IDENTITY="${LEXORA_SIGN_IDENTITY:-}"
if [[ -z "$SIGN_IDENTITY" ]]; then
  # SHA-1 hash of the first valid code-signing identity (unambiguous even if
  # several certificates share a name).
  SIGN_IDENTITY="$(security find-identity -v -p codesigning 2>/dev/null \
    | awk '/^ *[0-9]+\) [0-9A-F]{40} /{print $2; exit}')"
fi

if [[ -n "$SIGN_IDENTITY" ]]; then
  echo "==> Signing ${APP_NAME}.app with identity ${SIGN_IDENTITY}"
  codesign --force --deep --sign "$SIGN_IDENTITY" \
    --entitlements "${ROOT}/src-tauri/Entitlements.plist" \
    --timestamp=none "$BUNDLE"
  codesign --verify --deep --strict "$BUNDLE"
  SIGNED_STABLE=1
else
  SIGNED_STABLE=0
  echo "WARNING: no code-signing identity found; the app stays ad-hoc signed." >&2
  echo "         The Accessibility permission must be re-granted after every reinstall." >&2
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
Accessibility → enable ${APP_NAME}.
MSG

if [[ "$SIGNED_STABLE" == "1" ]]; then
  echo "Signed with a stable identity: the permission is kept across reinstalls"
  echo "(after the first grant; remove the old Lexora entry once with the − button)."
else
  cat <<MSG

Creating a local certificate (one time, free, no Apple account needed):
  Keychain Access → menu Keychain Access → Certificate Assistant →
  Create a Certificate… → Name: "Lexora Local Signing",
  Identity Type: Self Signed Root, Certificate Type: Code Signing → Create.
Then run this script again (it will pick the certificate up), or set
  LEXORA_SIGN_IDENTITY="Lexora Local Signing"
MSG
fi
