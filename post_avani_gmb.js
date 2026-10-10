const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = 'C:\\Users\\anjiy\\AppData\\Local\\Google\\Chrome\\User Data';
const PROFILE_DIR = 'Profile 1'; // MasewMedia
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

async function run() {
  console.log('🚀 [1/7] Launching Chrome with Profile 1 in background...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: false, // You can watch or let it run
    defaultViewport: { width: 1440, height: 900 },
    args: [
      `--profile-directory=${PROFILE_DIR}`,
      '--no-first-run',
      '--no-default-browser-check'
    ]
  });

  const pages = await browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('🌐 [2/7] Navigating to Google Search: "avani tiger resorts"...');
  await page.goto('https://www.google.com/search?q=avani+tiger+resorts', { waitUntil: 'domcontentloaded' });
  await delay(4000);

  // Take screenshot 1: Search page with Business Manager
  await page.screenshot({ path: path.join(__dirname, 'step1_search_page.png') });
  console.log('📸 Step 1 screenshot saved.');

  // Find Posts button or Add update button
  console.log('🔍 [3/7] Finding "Posts" or "Add update" button...');
  
  // Try various selectors for "Posts"
  let clicked = false;
  
  // Method 1: Evaluate by innerText or aria-label
  const postsClicked = await page.evaluate(() => {
    const allElements = Array.from(document.querySelectorAll('div, a, button, span'));
    for (const el of allElements) {
      const text = el.innerText ? el.innerText.trim() : '';
      const aria = el.getAttribute('aria-label') || '';
      if ((text === 'Posts' || aria === 'Posts' || text === 'Add update' || aria.includes('Add update')) && el.offsetHeight > 0) {
        el.click();
        return { success: true, text, tag: el.tagName };
      }
    }
    return { success: false };
  });

  if (postsClicked.success) {
    console.log(`👉 Clicked: ${postsClicked.text} (${postsClicked.tag})`);
    clicked = true;
  } else {
    console.log('⚠️ Could not find Posts button directly, looking for alternative...');
  }

  await delay(4000);
  await page.screenshot({ path: path.join(__dirname, 'step2_modal_opened.png') });
  console.log('📸 Step 2 screenshot saved.');

  // Check if "Add update" tab inside Posts modal needs to be clicked
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('div[role="tab"], button, span'));
    for (const tab of tabs) {
      if (tab.innerText && tab.innerText.includes('Add update') && tab.offsetHeight > 0) {
        tab.click();
        break;
      }
    }
  });
  await delay(2000);

  console.log('📸 [4/7] Uploading Photo: ' + IMAGE_PATH);
  const fileInputs = await page.$$('input[type="file"]');
  if (fileInputs.length > 0) {
    console.log(`Found ${fileInputs.length} file input(s). Uploading photo...`);
    await fileInputs[fileInputs.length - 1].uploadFile(IMAGE_PATH);
    console.log('✅ Photo uploaded!');
  } else {
    // If no direct file input, try clicking "Add photos" button
    console.log('Looking for Add photo button...');
    await page.evaluate(() => {
      const addPhotoBtn = Array.from(document.querySelectorAll('div, button, span')).find(el => 
        (el.innerText && el.innerText.includes('Add photos')) || (el.getAttribute('aria-label') && el.getAttribute('aria-label').includes('Add photos'))
      );
      if (addPhotoBtn) addPhotoBtn.click();
    });
    await delay(2000);
    const newFileInputs = await page.$$('input[type="file"]');
    if (newFileInputs.length > 0) {
      await newFileInputs[0].uploadFile(IMAGE_PATH);
      console.log('✅ Photo uploaded after button click!');
    }
  }

  await delay(3000);
  await page.screenshot({ path: path.join(__dirname, 'step3_photo_uploaded.png') });

  console.log('📝 [5/7] Entering post description...');
  const textareas = await page.$$('textarea');
  if (textareas.length > 0) {
    // Click and type description
    await textareas[0].click();
    await textareas[0].type(POST_TEXT, { delay: 5 });
    console.log('✅ Description entered!');
  } else {
    // Fallback: search for contenteditable
    const contentEditable = await page.$('div[contenteditable="true"]');
    if (contentEditable) {
      await contentEditable.click();
      await contentEditable.type(POST_TEXT, { delay: 5 });
      console.log('✅ Description entered in contenteditable!');
    }
  }

  await delay(2000);

  console.log('🔗 [6/7] Adding CTA button and link...');
  // Find CTA button dropdown or link input
  await page.evaluate((ctaLink) => {
    // Try to find button dropdown (Add a button (optional))
    const dropdowns = Array.from(document.querySelectorAll('div[role="combobox"], div[role="listbox"], select, div[aria-haspopup="listbox"]'));
    for (const dd of dropdowns) {
      dd.click();
      break;
    }
  }, CTA_URL);

  await delay(1500);

  // Select "Book" or "Learn more" or "Call now"
  await page.evaluate(() => {
    const options = Array.from(document.querySelectorAll('div[role="option"], li, span'));
    for (const opt of options) {
      const txt = opt.innerText ? opt.innerText.trim() : '';
      if (txt === 'Book' || txt === 'Learn more' || txt.includes('Book')) {
        opt.click();
        break;
      }
    }
  });

  await delay(1500);

  // Look for URL input field for the button
  const urlInputs = await page.$$('input[type="url"], input[type="text"]');
  for (const input of urlInputs) {
    const isLinkField = await page.evaluate(el => {
      const placeholder = (el.placeholder || '').toLowerCase();
      const aria = (el.getAttribute('aria-label') || '').toLowerCase();
      return placeholder.includes('link') || placeholder.includes('http') || aria.includes('link') || aria.includes('website');
    }, input);

    if (isLinkField) {
      await input.click({ clickCount: 3 });
      await input.type(CTA_URL, { delay: 5 });
      console.log('✅ CTA link entered!');
      break;
    }
  }

  await delay(2000);
  const previewPath = path.join(__dirname, 'step4_final_preview.png');
  await page.screenshot({ path: previewPath });
  console.log(`📸 Step 4 final preview saved at: ${previewPath}`);

  console.log('🚀 [7/7] Clicking "Post" button...');
  const postClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, div[role="button"], span'));
    for (const btn of buttons) {
      const text = btn.innerText ? btn.innerText.trim() : '';
      if (text === 'Post' && btn.offsetHeight > 0) {
        btn.click();
        return true;
      }
    }
    return false;
  });

  if (postClicked) {
    console.log('🎉 Post button clicked!');
  } else {
    console.log('⚠️ Could not auto-click Post button directly, see step4 preview.');
  }

  await delay(5000);
  const donePath = path.join(__dirname, 'step5_done_post.png');
  await page.screenshot({ path: donePath });
  console.log(`📸 Final Confirmation Screenshot: ${donePath}`);

  await browser.close();
  console.log('🏁 All done!');
}

run().catch(err => {
  console.error('Execution error:', err);
});
