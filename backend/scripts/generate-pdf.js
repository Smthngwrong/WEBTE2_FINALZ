import puppeteer from 'puppeteer-core';

const [, , url, outputPath, executablePath] = process.argv;

if (!url || !outputPath || !executablePath) {
    console.error('Usage: node generate-pdf.js <url> <outputPath> <executablePath>');
    process.exit(1);
}

const browser = await puppeteer.launch({
    executablePath,
    env: { ...process.env, HOME: '/tmp' },
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--user-data-dir=/tmp/chromium-data',
    ],
    headless: true,
});

const page = await browser.newPage();

await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
await page.waitForSelector('.swagger-ui .opblock', { timeout: 15000 }).catch(() => {});
await page.emulateMediaType('print');

await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `
        <div style="width: 100%; font-size: 10px; text-align: center; color: #555; padding: 0 20px;">
            WEBTE2 API Documentation
        </div>
    `,
    footerTemplate: `
        <div style="width: 100%; font-size: 10px; text-align: center; color: #555; padding: 0 20px;">
            Page <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
    `,
    margin: {
        top: '60px',
        bottom: '60px',
        left: '20px',
        right: '20px',
    },
});

await browser.close();
