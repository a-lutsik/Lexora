#!/bin/bash
# Снимает карантин Gatekeeper с Lexora после установки из DMG.
# Нужен, пока приложение не подписано Apple Developer ID и не нотаризовано.
set -euo pipefail

APP=""
for candidate in \
  "/Applications/Lexora.app" \
  "$HOME/Applications/Lexora.app" \
  "/Volumes/Lexora/Lexora.app"
do
  if [ -d "$candidate" ]; then
    APP="$candidate"
    break
  fi
done

if [ -z "$APP" ]; then
  echo "Lexora.app не найдено."
  echo "Сначала перетащите Lexora в папку Applications, затем снова запустите этот файл."
  read -r -p "Нажмите Enter, чтобы закрыть…"
  exit 1
fi

echo "Разрешаю запуск: $APP"
xattr -cr "$APP"
# Ad-hoc без Hardened Runtime — иначе Apple Silicon сразу убивает процесс.
codesign --remove-signature "$APP" 2>/dev/null || true
codesign --force --deep --sign - "$APP"
echo "Готово. Открываю Lexora…"
open "$APP"
