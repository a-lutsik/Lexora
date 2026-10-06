#!/usr/bin/env bash
# ============================================================
# LEXORA — настройка подписи кода для release.yml
#
# Читает секреты из окружения шага и:
#   1. экспортирует в $GITHUB_ENV ТОЛЬКО непустые значения —
#      пустой APPLE_ID / AZURE_* всё равно заставил бы Tauri
#      пытаться нотаризовать / подписывать и уронил бы сборку;
#   2. генерирует src-tauri/tauri.signing.conf.json — override
#      для `tauri build --config` (JSON merge patch поверх tauri.conf.json);
#   3. пишет в $GITHUB_OUTPUT: args, mode, notarize.
#
# Нет секретов → сборка идёт без подписи (как раньше), с warning.
# Секреты заданы частично → ошибка: релиз не должен молча остаться
# неподписанным из-за опечатки в имени секрета.
#
# Использование: configure-signing.sh <macos|windows|linux>
# ============================================================
set -euo pipefail

platform="${1:?usage: configure-signing.sh <macos|windows|linux>}"
config_path="src-tauri/tauri.signing.conf.json"

mode="unsigned"
notarize="false"
args=""

github_env="${GITHUB_ENV:-/dev/null}"
github_output="${GITHUB_OUTPUT:-/dev/null}"

# export_env NAME... — добавляет в $GITHUB_ENV непустые переменные
# (heredoc-синтаксис: значение может быть многострочным).
export_env() {
  local name delimiter
  for name in "$@"; do
    if [[ -n "${!name:-}" ]]; then
      delimiter="LEXORA_EOF_$RANDOM$RANDOM"
      {
        echo "${name}<<${delimiter}"
        echo "${!name}"
        echo "${delimiter}"
      } >>"$github_env"
    fi
  done
}

# count_set NAME... — сколько из переменных непусты
count_set() {
  local name count=0
  for name in "$@"; do
    [[ -n "${!name:-}" ]] && count=$((count + 1))
  done
  echo "$count"
}

# require_all_or_none LABEL NAME... — частичный набор секретов = ошибка.
# Возвращает 0, если заданы все; 1, если не задано ни одного.
require_all_or_none() {
  local label="$1"
  shift
  local set_count
  set_count="$(count_set "$@")"
  if [[ "$set_count" -eq 0 ]]; then
    return 1
  fi
  if [[ "$set_count" -ne "$#" ]]; then
    echo "::error::${label}: заданы не все секреты (${set_count} из $#). Нужны: $*"
    exit 1
  fi
  return 0
}

write_config() {
  # $1 — JS-выражение, возвращающее объект override (читает process.env)
  node -e "require('fs').writeFileSync(process.argv[1], JSON.stringify($1, null, 2) + '\n')" "$config_path"
  args="--config ${config_path}"
}

case "$platform" in
  macos)
    if require_all_or_none "macOS-подпись" APPLE_CERTIFICATE APPLE_CERTIFICATE_PASSWORD APPLE_SIGNING_IDENTITY; then
      mode="developer-id"
      export_env APPLE_CERTIFICATE APPLE_CERTIFICATE_PASSWORD APPLE_SIGNING_IDENTITY
      # hardenedRuntime обязателен для нотаризации; entitlements — в Entitlements.plist.
      # Для ad-hoc-сборок он остаётся false в tauri.conf.json (иначе Apple Silicon убивает процесс).
      write_config "{ bundle: { macOS: { signingIdentity: process.env.APPLE_SIGNING_IDENTITY, hardenedRuntime: true } } }"

      if require_all_or_none "macOS-нотаризация" APPLE_ID APPLE_PASSWORD APPLE_TEAM_ID; then
        notarize="true"
        export_env APPLE_ID APPLE_PASSWORD APPLE_TEAM_ID
      else
        echo "::warning::Нотаризация пропущена (нет APPLE_ID / APPLE_PASSWORD / APPLE_TEAM_ID): приложение подписано, но Gatekeeper всё равно покажет предупреждение."
      fi
    else
      echo "::warning::Секреты Apple не заданы — macOS-сборка будет подписана ad-hoc (нужен «Разрешить Lexora.command»)."
    fi
    ;;

  windows)
    if require_all_or_none "Windows-подпись (Azure Artifact Signing)" \
      AZURE_CLIENT_ID AZURE_CLIENT_SECRET AZURE_TENANT_ID \
      AZURE_SIGNING_ENDPOINT AZURE_SIGNING_ACCOUNT AZURE_SIGNING_PROFILE; then
      mode="azure"
      export_env AZURE_CLIENT_ID AZURE_CLIENT_SECRET AZURE_TENANT_ID
      write_config "{ bundle: { windows: { signCommand: 'artifact-signing-cli -e ' + process.env.AZURE_SIGNING_ENDPOINT + ' -a ' + process.env.AZURE_SIGNING_ACCOUNT + ' -c ' + process.env.AZURE_SIGNING_PROFILE + ' -d Lexora %1' } } }"
    elif [[ -n "${WINDOWS_CERT_THUMBPRINT:-}" ]]; then
      # Сертификат уже импортирован предыдущим шагом workflow (PFX → Cert:\CurrentUser\My)
      mode="pfx"
      write_config "{ bundle: { windows: { certificateThumbprint: process.env.WINDOWS_CERT_THUMBPRINT, digestAlgorithm: 'sha256', timestampUrl: 'http://timestamp.digicert.com' } } }"
    else
      echo "::warning::Секреты Windows-подписи не заданы — установщик будет неподписанным (SmartScreen покажет «Неизвестный издатель»)."
    fi
    ;;

  linux) ;;

  *)
    echo "::error::Неизвестная платформа: ${platform}"
    exit 1
    ;;
esac

{
  echo "mode=${mode}"
  echo "notarize=${notarize}"
  echo "args=${args}"
} >>"$github_output"

echo "Подпись (${platform}): mode=${mode}, notarize=${notarize}"
