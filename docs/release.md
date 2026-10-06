# Релиз Lexora: сборка и подпись установщиков

Сборку делает [release.yml](../.github/workflows/release.yml), подпись настраивает
[configure-signing.sh](../.github/scripts/configure-signing.sh). Подпись **опциональна**:
пока секретов нет, workflow собирает неподписанные установщики и пишет warning.
Секреты добавляются в GitHub: *Settings → Secrets and variables → Actions → New repository secret*.

## Что получается

| ОС | Артефакт | Подпись |
|---|---|---|
| macOS | `Lexora_<ver>_universal.dmg` (Intel + Apple Silicon) | Developer ID + нотаризация |
| Windows | `Lexora_<ver>_x64-setup.exe` (NSIS, установка на пользователя, без прав администратора) | Azure Artifact Signing **или** PFX-сертификат |
| Linux | AppImage / deb (экспериментально) | — |

Ключ AI-провайдера пользователь вводит при первом запуске в мастере настройки
(`SetupWizard`), а не в установщике.

## Как выпустить версию

1. Поднять версию в `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` и `package.json`
   (workflow упадёт, если они расходятся или не совпадают с тегом).
2. `git tag v0.1.1 && git push origin v0.1.1`
3. Получится **draft** GitHub Release с инсталляторами; проверить и опубликовать вручную.

**Пробная сборка без публикации:** *Actions → Release → Run workflow*. Инсталляторы окажутся в
*Artifacts* этого запуска. Так стоит проверить Windows-сборку до первого тега.

## macOS: подпись и нотаризация

Нужен Apple Developer Program (99 $/год).

1. В Xcode или на developer.apple.com создать сертификат **Developer ID Application**, экспортировать
   его из Keychain как `.p12` (с паролем).
2. `base64 -i certificate.p12 | pbcopy` — в буфер попадёт значение для секрета.
3. На appleid.apple.com создать **пароль приложения** (app-specific password).

| Секрет | Значение |
|---|---|
| `APPLE_CERTIFICATE` | `.p12` в base64 |
| `APPLE_CERTIFICATE_PASSWORD` | пароль от `.p12` |
| `APPLE_SIGNING_IDENTITY` | `Developer ID Application: Имя (TEAMID)` — см. `security find-identity -v -p codesigning` |
| `APPLE_ID` | Apple ID (e-mail) |
| `APPLE_PASSWORD` | пароль приложения из п. 3 |
| `APPLE_TEAM_ID` | Team ID (10 символов) |

Первые три включают подпись и `hardenedRuntime`, последние три — нотаризацию.
Если заданы только первые три, приложение подписано, но не нотаризовано: Gatekeeper всё равно
предупредит. Набор секретов неполный — workflow падает с ошибкой (чтобы релиз не ушёл
неподписанным из-за опечатки).

Без секретов остаётся прежнее поведение: ad-hoc подпись из `tauri.conf.json`
(`signingIdentity: "-"`, `hardenedRuntime: false`) и «Разрешить Lexora.command» для пользователей.
`hardenedRuntime` включается только вместе с Developer ID: на ad-hoc-сборке он убивает процесс
на Apple Silicon.

## Windows: два варианта подписи

Если заданы оба, приоритет у Azure.

### A. Azure Artifact Signing (бывший Trusted Signing)

Обычно дешевле EV-сертификата. Нужна проверка личности/организации в Azure; доступность зависит
от страны.

| Секрет | Значение |
|---|---|
| `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID` | App Registration, которой выдана роль подписанта профиля сертификата (*Certificate Profile Signer*) в аккаунте подписи |
| `AZURE_SIGNING_ENDPOINT` | например `https://wus2.codesigning.azure.net` |
| `AZURE_SIGNING_ACCOUNT` | имя аккаунта подписи |
| `AZURE_SIGNING_PROFILE` | имя профиля сертификата |

Workflow ставит `artifact-signing-cli` (`cargo install`, кэшируется) и подключает его через
`bundle.windows.signCommand`: подписываются и `Lexora.exe`, и сам установщик.

### B. Обычный сертификат (OV/EV, `.pfx`)

| Секрет | Значение |
|---|---|
| `WINDOWS_CERTIFICATE` | `.pfx` в base64. PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("certificate.pfx"))`; macOS/Linux: `base64 -i certificate.pfx` |
| `WINDOWS_CERTIFICATE_PASSWORD` | пароль экспорта `.pfx` |

OV-сертификат даёт предупреждение SmartScreen, пока не наберётся репутация; EV — сразу.

## Если что-то пошло не так

- **Ошибка «заданы не все секреты»** — в `configure-signing.sh` частично задан набор (см. текст ошибки).
- **Нотаризация зависла/отклонена** — логи: `xcrun notarytool log <id>` с теми же Apple ID/паролем.
- **Windows: «Неизвестный издатель»** — установщик собран без подписи (смотреть warning в шаге
  *Configure code signing*) либо у сертификата ещё нет репутации.
- Сгенерированный override лежит в `src-tauri/tauri.signing.conf.json` (только в CI, в git не попадает).
