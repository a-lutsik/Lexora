// Build PDFs: node docs/user-guide/build-pdf.mjs
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
const here = new URL('.', import.meta.url).pathname;
const guides = [
  { src: 'guide.html', out: 'Lexora-User-Guide.pdf', footer: 'Lexora — руководство пользователя' },
  { src: 'guide.en.html', out: 'Lexora-User-Guide.en.pdf', footer: 'Lexora — User Guide' },
];
const browser = await chromium.launch();
for (const g of guides) {
  const page = await browser.newPage();
  await page.goto('file://' + resolve(here, g.src));
  await page.waitForLoadState('networkidle');
  await page.pdf({ path: resolve(here, g.out), format: 'A4', printBackground: true, preferCSSPageSize: true,
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: `<div style="font-size:8px;color:#888;width:100%;text-align:center;font-family:Helvetica">${g.footer} · <span class="pageNumber"></span></div>` });
  await page.close();
}
await browser.close();
