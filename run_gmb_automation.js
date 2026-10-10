const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = 'C:\\Users\\anjiy\\AppData\\Local\\Google\\Chrome\\User Data';
const PROFILE_DIR = 'Profile 1';
const IMAGE_PATH = path.join(__dirname, 'avani_tiger_resort_pool.jpg');
const CTA_URL = 'https://avanitigerresorts.com/contact-us/';

const POST_TEXT = `🐅 Escape into the Wild at Avani Tiger Resort! 🌿
Plan your perfect weekend getaway near Tipeshwar Wildlife Sanctuary! Experience thrilling jungle tiger safaris, luxury cottage stays, serene nature walks, and authentic local cuisines.

✨ Why choose Avani Tiger Resort?
Luxury & Cozy Cottage Stay
🚙 Safari Assistance & Guided Tours
🏊 Swimming Pool & Outdoor Relaxation
🍽️ Delicious Homestyle Food

🌐 Website: avanitigerresorts.com
📍 Sunna Gate, Tipeshwar Wildlife Sanctuary, Maharashtra`;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForPort(port, timeout = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(`http://127.0.0.1:${port}/json/version`, (res) => {
        if (res.statusCode === 200) resolve();
        else retry();
      });
      req.on('error', retry);
      function retry() {
        if (Date.now() - start > timeout) {
          reject(new Error(`Timeout waiting for port ${port}`));
        } else {
          setTimeout(check, 500);
        }
      }
    };
    check();
  });
}

async function main() {
  console.log('🚀 [1/7] Spawning Chrome with remote debugging on port 9222 and Profile 1...');
  
  const chromeProcess = spawn(CHROME_PATH, [
    `--remote-debugging-port=9222`,
    `--user-data-dir=${USER_DATA_DIR}`,
    `--profile-directory=${PROFILE_DIR}`,
    '--no-first-run',
    '--no-default-browser-check'
  ], {
    detached: true,
    stdio: 'ignore'
  });
  chromeProcess.unref();

  console.log('⏳ Waiting for Chrome debugging interface to be ready...');
  await waitForPort(9222);
  console.log('✅ Chrome debugging port 9222 is active!');

  console.log('🔌 Connecting Puppeteer to live Chrome session...');
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
    defaultViewport: null
  });

  const pages = await browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();

  console.log('🌐 [2/7] Navigating to Google Search for Avani Tiger Resort...');
  await page.goto('https://www.google.com/search?q=avani+tiger+resorts', { waitUntil: 'domcontentloaded' });
  await delay(4000);

  // Take screenshot 1: Search page with Business Manager
  const step1Path = path.join(__dirname, 'gmb_step1_search.png');
  await page.screenshot({ path: step1Path });
  console.log(`📸 Step 1 screenshot saved at: ${step1Path}`);

  // Find and click "Posts" button
  console.log('🔍 [3/7] Finding and clicking "Posts" button...');
  const clickedPosts = await page.evaluate(() => {
    // Look through all clickable elements
    const elements = Array.from(document.querySelectorAll('div, a, button, span'));
    for (const el of elements) {
      const text = (el.innerText || '').trim();
      const aria = (el.getAttribute('aria-label') || '').trim();
      if ((text === 'Posts' || aria === 'Posts' || text === 'Add update') && el.offsetHeight > 0) {
        el.click();
        return { success: true, text, aria, tag: el.tagName };
      }
    }
    return { success: false };
  });

  console.log('Posts click result:', JSON.stringify(clickedPosts));
  await delay(4000);

  const step2Path = path.join(__dirname, 'gmb_step2_modal.png');
  await page.screenshot({ path: step2Path });
  console.log(`📸 Step 2 screenshot saved at: ${step2Path}`);

  // Check if "Add update" tab/option inside the Posts dialog needs to be selected
  console.log('Checking for Add update tab...');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('div[role="tab"], button, span, div[role="button"]'));
    for (const t of tabs) {
      if ((t.innerText || '').includes('Add update') && t.offsetHeight > 0) {
        t.click();
        break;
      }
    }
  });
  await delay(2000);

  // Upload photo
  console.log('📸 [4/7] Uploading pool photo: ' + IMAGE_PATH);
  let fileInput = await page.$('input[type="file"]');
  if (!fileInput) {
    // Try clicking "Add photos" button to reveal file input
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('div, button, span'));
      for (const b of btns) {
        if ((b.innerText || '').includes('Add photo') || (b.getAttribute('aria-label') || '').includes('Add photo')) {
          b.click();
          break;
        }
      }
    });
    await delay(2000);
    fileInput = await page.$('input[type="file"]');
  }

  if (fileInput) {
    await fileInput.uploadFile(IMAGE_PATH);
    console.log('✅ Photo successfully uploaded to GMB post!');
  } else {
    console.log('⚠️ Could not locate file input directly, continuing to description...');
  }
  await delay(3000);

  // Type post description
  console.log('📝 [5/7] Typing post description...');
  const textarea = await page.$('textarea');
  if (textarea) {
    await textarea.click();
    await textarea.type(POST_TEXT, { delay: 10 });
    console.log('✅ Description entered in textarea!');
  } else {
    const contentEditable = await page.$('div[contenteditable="true"]');
    if (contentEditable) {
      await contentEditable.click();
      await contentEditable.type(POST_TEXT, { delay: 10 });
      console.log('✅ Description entered in contenteditable!');
    }
  }
  await delay(2000);

  // CTA button dropdown and link
  console.log('🔗 [6/7] Adding CTA button and link...');
  await page.evaluate(() => {
    const dropdown = document.querySelector('div[role="listbox"], div[role="combobox"], select');
    if (dropdown) dropdown.click();
  });
  await delay(1500);

  await page.evaluate(() => {
    const options = Array.from(document.querySelectorAll('div[role="option"], li, span'));
    for (const opt of options) {
      const txt = (opt.innerText || '').trim();
      if (txt === 'Book' || txt === 'Learn more' || txt.includes('Book') || txt.includes('Learn')) {
        opt.click();
        break;
      }
    }
  });
  await delay(1500);

  // Type URL into CTA link field
  const urlInputs = await page.$$('input[type="url"], input[type="text"]');
  for (const input of urlInputs) {
    const isLink = await page.evaluate(el => {
      const ph = (el.placeholder || '').toLowerCase();
      const ar = (el.getAttribute('aria-label') || '').toLowerCase();
      return ph.includes('link') || ph.includes('http') || ar.includes('link') || ar.includes('web');
    }, input);
    if (isLink) {
      await input.click({ clickCount: 3 });
      await input.type(CTA_URL, { delay: 10 });
      console.log('✅ CTA URL entered:', CTA_URL);
      break;
    }
  }
  await delay(2000);

  const previewScreenshot = path.join(__dirname, 'gmb_step3_filled_preview.png');
  await page.screenshot({ path: previewScreenshot });
  console.log(`📸 Step 3 filled preview screenshot saved at: ${previewScreenshot}`);

  // Click Post
  console.log('🚀 [7/7] Clicking "Post" button...');
  const posted = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, div[role="button"], span'));
    for (const b of buttons) {
      if ((b.innerText || '').trim() === 'Post' && b.offsetHeight > 0) {
        b.click();
        return true;
      }
    }
    return false;
  });

  if (posted) {
    console.log('🎉 "Post" button clicked successfully!');
  } else {
    console.log('ℹ️ Check preview screenshot to confirm.');
  }

  await delay(5000);
  const finalScreenshot = path.join(__dirname, 'gmb_final_result.png');
  await page.screenshot({ path: finalScreenshot });
  console.log(`📸 Final result screenshot saved at: ${finalScreenshot}`);

  console.log('✅ ALL STEPS FINISHED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('Fatal error:', err);
});
