const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  console.log('🚀 [1/4] Starting Headless Chrome in background (zero windows, zero mouse movement)...');
  
  // Point to the user's installed Google Chrome
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true, // "true" means 100% invisible!
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  console.log('🌐 [2/4] Headless Browser opened in RAM! Navigating to website...');
  const page = await browser.newPage();
  
  // Set realistic viewport
  await page.setViewport({ width: 1280, height: 720 });
  
  // Navigate to an example live site
  await page.goto('https://quotes.toscrape.com/', { waitUntil: 'domcontentloaded' });
  
  console.log('📝 [3/4] Interacting with the webpage (Extracting quotes & author)...');
  const pageTitle = await page.title();
  
  // Extract top quote from the webpage without opening any screen
  const topQuote = await page.$eval('.quote .text', el => el.innerText);
  const author = await page.$eval('.quote .author', el => el.innerText);
  
  console.log(`\n--- EXTRACTED DATA (Captured silently in background) ---`);
  console.log(`Page Title: "${pageTitle}"`);
  console.log(`Quote: ${topQuote}`);
  console.log(`Author: ${author}`);
  console.log(`--------------------------------------------------------\n`);

  // Take a real screenshot as 100% tangible proof
  const screenshotPath = path.join(__dirname, 'headless_proof.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`📸 [4/4] Proof screenshot saved at: ${screenshotPath}`);

  await browser.close();
  console.log('✅ Done! Headless browser closed automatically. Your screen was never touched.');
})();
