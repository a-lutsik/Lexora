// Сборка PDF: node docs/user-guide/build-pdf.mjs
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
const here = new URL('.', import.meta.url).pathname;
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file://' + resolve(here, 'guide.html'));
await page.waitForLoadState('networkidle');
await page.pdf({ path: resolve(here, 'Lexora-User-Guide.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true,
  displayHeaderFooter: true, headerTemplate: '<span></span>',
  footerTemplate: '<div style="font-size:8px;color:#888;width:100%;text-align:center;font-family:Helvetica">Lexora — руководство пользователя · <span class="pageNumber"></span></div>' });
await browser.close();
