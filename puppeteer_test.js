const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    page.on('pageerror', err => {
        console.error('PAGE ERROR:', err.toString());
    });
    page.on('error', err => {
        console.error('ERROR:', err.toString());
    });
    page.on('console', msg => {
        console.log('CONSOLE:', msg.text());
    });

    try {
        await page.goto('http://localhost:3001/dashboard/calendar', { waitUntil: 'networkidle0', timeout: 10000 });
        console.log('Page loaded successfully without critical crash (or it was caught)');
    } catch (e) {
        console.error('Navigation error:', e);
    }

    await browser.close();
})();
