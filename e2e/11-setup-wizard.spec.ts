// ============================================================
// LEXORA — E2E Test 11: Setup Wizard (быстрая настройка AI)
// Новый сценарий для обычных пользователей: 2 варианта
// (Бесплатно / Платно) с объяснением преимуществ.
//
// Покрывает:
//  - онбординг первого запуска (SetupWizardGate в App): мастер
//    показывается автоматически для «чистых» настроек;
//  - бесплатный путь «Без ключей» (применение → мастер закрывается);
//  - платный путь OpenAI (валидация ключа sk-…, применение);
//  - «Пропустить — настроить вручную» (advanced);
//  - повторное открытие мастера из Настроек («AI-модели» →
//    «Сменить сценарий» → «Открыть мастер настройки») с финальным
//    экраном «Готово!».
// ============================================================

import { test, expect, type Page } from '@playwright/test';
import { mockTauriIpc } from './helpers/tauri-mock';

// The wizard copy below is Russian: run these flows with the Russian UI.
test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('lexora-interface-locale', 'ru'));
});

// Настройки «новой установки»: setupProfile и все AI-поля намеренно
// отсутствуют — дефолты через `??` делают isSettingsAiPristine() == true,
// поэтому SetupWizard первого запуска предлагается автоматически.
const PRISTINE_GET_SETTINGS = {
    primaryLanguage: 'en',
    interfaceLanguage: 'en',
    customBaseUrl: null,
    cloudflareAccountId: null,
    ttsVoice: 'default',
    stickerCount: 2,
    stickerOpacity: 0.9,
    stickerSources: ['all'],
    quietHoursStart: null,
    quietHoursEnd: null,
    offlineMode: false,
    writingPrivacyMode: false,
    writingAutoCheck: false,
    fallbackEnabled: true,
    hotkeyTranslate: 'CmdOrCtrl+Shift+L',
    hotkeyStickers: 'CmdOrCtrl+Shift+S',
    // НЕТ setupProfile / aiProvider / aiModel / imageModel / ttsEngine
};

async function setupDialog(page: Page) {
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(
        dialog.getByRole('heading', { name: 'Как настроить Lexora?' }),
    ).toBeVisible();
    return dialog;
}

test.describe('Setup Wizard — first-run onboarding (App gate)', () => {
    test.beforeEach(async ({ page }) => {
        await mockTauriIpc(page, { get_settings: PRISTINE_GET_SETTINGS });
        await page.goto('/#/vocabulary');
        await setupDialog(page);
    });

    test('shows both scenario cards with advantage badges', async ({ page }) => {
        const dialog = page.getByRole('dialog');

        // Две карточки: Бесплатно / Платно.
        await expect(
            dialog.getByRole('button', { name: 'Выбрать сценарий: Бесплатно' }),
        ).toBeVisible();
        await expect(
            dialog.getByRole('button', { name: 'Выбрать сценарий: Платно' }),
        ).toBeVisible();

        // Объяснение преимуществ: бейджи карточек + тексты-теглайны.
        await expect(dialog.locator('.setup-badge--free')).toHaveText('Без оплаты');
        await expect(dialog.locator('.setup-badge--paid')).toHaveText('Лучшее качество');
        await expect(
            dialog.getByText(/один бесплатный ключ Google Gemini включает/),
        ).toBeVisible();
        await expect(
            dialog.getByText(/Один ключ OpenAI или Google Gemini с оплатой по использованию/),
        ).toBeVisible();

        // Ссылка «Пропустить» — единственная кнопка подвала: шаг 1 выбирается кликом по карточке.
        await expect(
            dialog.getByRole('button', { name: 'Пропустить — настроить вручную' }),
        ).toBeVisible();
        await expect(dialog.getByRole('button', { name: 'Продолжить' })).toHaveCount(0);
        await expect(dialog.getByRole('button', { name: /Назад/ })).toHaveCount(0);
        await expect(dialog.getByText('Шаг 1 из 3')).toBeVisible();
        await expect(dialog.locator('.setup-step')).toHaveCount(3);
        await expect(
            dialog.getByText('Никаких карт и обязательств. Сценарий можно сменить в любой момент в Настройках → AI-модели.'),
        ).toBeVisible();
    });

    test('free «Без ключей» path applies and closes onboarding', async ({ page }) => {
        const dialog = page.getByRole('dialog');

        await dialog
            .getByRole('button', { name: 'Выбрать сценарий: Бесплатно' })
            .click();
        await expect(
            dialog.getByRole('heading', { name: 'Бесплатный сценарий' }),
        ).toBeVisible();

        // Преимущество бесплатного варианта без ключей.
        const zeroVariant = dialog.getByRole('button', { name: /^Без ключей:/ });
        await expect(zeroVariant).toBeVisible();
        await expect(
            dialog.getByText('Перевод по встроенному словарю'),
        ).toBeVisible();
        await zeroVariant.click();

        // keyKind 'none' → сразу экран подтверждения.
        await expect(
            dialog.getByRole('heading', { name: 'Проверьте и включите' }),
        ).toBeVisible();
        await expect(
            dialog.getByText('Так будут работать возможности после включения:'),
        ).toBeVisible();
        await expect(dialog.getByText('Офлайн-словарь')).toBeVisible();
        await expect(dialog.getByText('Фото-сток')).toBeVisible();
        await expect(dialog.getByText('Системный голос')).toBeVisible();

        await dialog
            .getByRole('button', { name: 'Включить выбранный сценарий' })
            .click();

        // После применения настроек gate размонтирует мастер (возврат в приложение).
        await expect(dialog).toHaveCount(0);
    });

    test('paid OpenAI key path validates key and applies', async ({ page }) => {
        const dialog = page.getByRole('dialog');

        await dialog
            .getByRole('button', { name: 'Выбрать сценарий: Платно' })
            .click();
        await expect(
            dialog.getByRole('heading', { name: 'Платный сценарий' }),
        ).toBeVisible();
        await expect(dialog.getByText('OpenAI — один ключ на всё')).toBeVisible();
        await expect(dialog.getByText('Google Gemini + AI-иллюстрации')).toBeVisible();

        await dialog
            .getByRole('button', { name: /^OpenAI — один ключ на всё:/ })
            .click();
        await expect(
            dialog.getByRole('heading', { name: 'Вставьте ключ' }),
        ).toBeVisible();

        const next = dialog.getByRole('button', { name: 'Продолжить к проверке' });
        await expect(next).toBeDisabled();
        await dialog.getByLabel(/API(-ключ| key) — OpenAI/i).fill('sk-proj-e2e-test-key');
        await expect(next).toBeEnabled();
        await next.click();

        await expect(
            dialog.getByRole('heading', { name: 'Проверьте и включите' }),
        ).toBeVisible();
        // Оптимистичная сводка: перевод включён оптимистичным ключом OpenAI.
        await expect(dialog.getByText('AI-перевод (OpenAI)')).toBeVisible();

        await dialog
            .getByRole('button', { name: 'Сохранить ключ и включить сценарий' })
            .click();

        await expect(dialog).toHaveCount(0);
    });

    test('recommended free Gemini key path applies the Gemini package', async ({ page }) => {
        const dialog = page.getByRole('dialog');
        await dialog
            .getByRole('button', { name: 'Выбрать сценарий: Бесплатно' })
            .click();

        const gemini = dialog.getByRole('button', { name: /^Google Gemini — один бесплатный ключ:/ });
        await expect(gemini).toContainText('Рекомендуем');
        await gemini.click();

        await dialog.getByLabel(/API(-ключ| key) — Gemini/i).fill('AIzaSyD-e2e-test-key-0123456789abcd');
        await dialog.getByRole('button', { name: 'Продолжить к проверке' }).click();
        await expect(dialog.getByText('AI-перевод (Gemini)')).toBeVisible();
        await expect(dialog.getByText('Нейроголос (Gemini)')).toBeVisible();

        await dialog
            .getByRole('button', { name: 'Сохранить ключ и включить сценарий' })
            .click();
        await expect(dialog).toHaveCount(0);
    });

    test('skip link hides the wizard (advanced profile)', async ({ page }) => {
        const dialog = page.getByRole('dialog');
        await dialog
            .getByRole('button', { name: 'Пропустить — настроить вручную' })
            .click();
        await expect(dialog).toHaveCount(0);
    });
});

test.describe('Setup Wizard — from Settings (AI-модели → Сменить сценарий)', () => {
    test.beforeEach(async ({ page }) => {
        // Дефолтный mock: сценарий уже выбран (advanced) → мастер не открывается сам.
        await mockTauriIpc(page);
        await page.goto('/#/settings');
        await page.waitForSelector('.settings-page', { timeout: 10_000 });
    });

    test('re-runs free scenario and shows the final «Готово!» screen', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /^(Settings|Настройки)$/ })).toBeVisible();
        const change = page.getByRole('button', { name: /Сменить сценарий|Change scenario/ });
        await expect(change).toBeVisible();

        // «Сменить сценарий» раскрывает выбор пакета; мастер — кнопкой внутри.
        await change.click();
        await page
            .getByRole('button', { name: /Открыть мастер настройки|Open setup wizard/ })
            .click();
        const dialog = await setupDialog(page);

        await dialog
            .getByRole('button', { name: 'Выбрать сценарий: Бесплатно' })
            .click();
        await dialog.getByRole('button', { name: /^Без ключей:/ }).click();
        await dialog
            .getByRole('button', { name: 'Включить выбранный сценарий' })
            .click();

        // Внутри Настроек мастер не размонтируется → виден экран «Готово!».
        await expect(
            dialog.getByRole('heading', { name: 'Готово!' }),
        ).toBeVisible({ timeout: 8000 });
        await expect(dialog.getByText('Без ключей включён')).toBeVisible();
        await expect(dialog.getByText('Включено ✓')).toBeVisible();

        await dialog.getByRole('button', { name: 'Закрыть мастер' }).click();
        await expect(dialog).toHaveCount(0);
    });
});
