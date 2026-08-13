import { chromium } from 'playwright';

const url = process.env.URL || 'http://localhost:3000/cv';
const output = process.env.OUTPUT || 'cv.pdf';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto(url, { waitUntil: 'networkidle' });

await page.pdf({
  path: output,
  format: 'A4',
  printBackground: true,
  margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
});

await browser.close();
console.log(`✅ PDF saved: ${output}`);
