const puppeteer = require('puppeteer-core');
const path = require('path');

async function testLogin() {
  console.log('Connecting to port 9222...');
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: null
  });

  const pages = await browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();

  console.log('Navigating to Google Search for avani tiger resorts...');
  await page.goto('https://www.google.com/search?q=avani+tiger+resorts', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));

  const screenshotPath = path.join(__dirname, 'test_login_gmb.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Saved screenshot:', screenshotPath);

  // Check page content to verify business manager
  const text = await page.evaluate(() => document.body.innerText);
  const manages = text.includes('Your business on Google') || text.includes('You manage this Business Profile');
  console.log('Manages Business Profile visible?', manages);

  return { manages };
}

testLogin().then(res => console.log('Result:', res)).catch(err => console.error('Error:', err));
