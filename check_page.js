const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  const pages = await browser.pages();
  const page = pages[0];
  console.log('Title:', await page.title());
  console.log('URL:', page.url());
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('Body snippet:\n', bodyText);
})();
