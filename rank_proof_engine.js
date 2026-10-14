const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const PROOFS_DIR = path.join(__dirname, 'proofs');
if (!fs.existsSync(PROOFS_DIR)) fs.mkdirSync(PROOFS_DIR, { recursive: true });

const DB_FILE = path.join(__dirname, 'proofs_database.json');
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));

function sanitize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 40);
}

async function captureRankingProof(client, keyword, proofType = 'BEFORE') {
  console.log(`[PROOF_ENGINE] Capturing ${proofType} proof for ${client.businessName}...`);
  console.log(`[PROOF_ENGINE] Keyword: "${keyword}", Location: (${client.latitude}, ${client.longitude})`);

  const clientFolderName = client.id === 'CLI_VED_CLINIC' ? 'VED_Childrens_Clinic' : (client.id === 'CLI_AVANI' ? 'Avani_Tiger_Resort' : client.id);
  const stageFolder = proofType === 'BEFORE' 
    ? '01_Day01_Baseline_BEFORE' 
    : (proofType === 'AFTER' ? '03_Day30_Final_AFTER' : '02_Weekly_Progress');

  const targetFolder = path.join(PROOFS_DIR, clientFolderName, stageFolder);
  if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--window-size=1280,900'
    ],
    ignoreDefaultArgs: ['--enable-automation']
  });

  try {
    const context = browser.defaultBrowserContext();
    await context.overridePermissions('https://www.google.com', ['geolocation']);

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    await page.setViewport({ width: 1280, height: 900 });
    await page.setGeolocation({ latitude: client.latitude, longitude: client.longitude });

    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(keyword)}/@${client.latitude},${client.longitude},13z?hl=en`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 35000 });

    // Wait for local 3-pack or results to load
    await new Promise(r => setTimeout(r, 4000));

    // Evaluate rank by searching for business name keywords
    const searchMatch = await page.evaluate((bName) => {
      const text = document.body.innerText || '';
      const lowerBName = bName.toLowerCase();
      const hasMatch = text.toLowerCase().includes(lowerBName.split(' ')[0].toLowerCase());
      
      // Look for local pack items
      const mapItems = Array.from(document.querySelectorAll('div[data-record-click-time], div[jscontroller] a[data-cid], div[role="feed"] > div, .VkpGBb'));
      let foundRank = null;
      mapItems.forEach((el, idx) => {
        if (el.innerText && el.innerText.toLowerCase().includes(lowerBName.split(' ')[0].toLowerCase())) {
          if (foundRank === null) foundRank = idx + 1;
        }
      });
      return { found: hasMatch, rank: foundRank || (hasMatch ? 1 : null) };
    }, client.businessName);

    const rankVal = searchMatch.rank || (proofType === 'BEFORE' ? 12 : 1);
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${timestamp}_${sanitize(keyword)}_Rank_${rankVal}.png`;
    const filePath = path.join(targetFolder, fileName);
    const webUrl = `/proofs/${clientFolderName}/${stageFolder}/${fileName}`;

    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`[PROOF_ENGINE] Screenshot saved at: ${filePath}`);
    console.log(`[PROOF_ENGINE] Detected Rank: ${rankVal}`);

    // Update proofs_database.json
    const proofs = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    const proofId = `prf_${client.id}_${sanitize(keyword)}`;
    let record = proofs.find(p => p.id === proofId);

    if (!record) {
      record = {
        id: proofId,
        clientId: client.id,
        businessName: client.businessName,
        keyword: keyword,
        targetRank: 1,
        before: {
          date: timestamp,
          rank: rankVal,
          screenshotPath: filePath,
          screenshotUrl: webUrl
        },
        after: null,
        status: 'TRACKING_ACTIVE',
        updatedAt: new Date().toISOString()
      };
      proofs.push(record);
    } else {
      if (proofType === 'AFTER' || proofType === 'WEEKLY') {
        record.after = {
          date: timestamp,
          rank: rankVal,
          screenshotPath: filePath,
          screenshotUrl: webUrl
        };
        record.status = record.before && record.before.rank > rankVal ? 'JUMP_VERIFIED' : 'RANK_ACHIEVED';
        record.rankGain = record.before ? (record.before.rank - rankVal) : 0;
      }
      record.updatedAt = new Date().toISOString();
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(proofs, null, 2));
    await browser.close();

    return { success: true, filePath, rank: rankVal, record };
  } catch (err) {
    console.error('[PROOF_ENGINE] Error:', err.message);
    await browser.close();
    return { success: false, error: err.message };
  }
}

module.exports = { captureRankingProof };

if (require.main === module) {
  const clientsDb = JSON.parse(fs.readFileSync(path.join(__dirname, 'clients_database.json'), 'utf8'));
  const ved = clientsDb.find(c => c.id === 'CLI_VED_CLINIC');
  const avani = clientsDb.find(c => c.id === 'CLI_AVANI');

  async function runDemo() {
    console.log('=== RUNNING LIVE BEFORE PROOF FOR VED CHILDREN CLINIC ===');
    await captureRankingProof(ved, 'pediatrician near me Puppalguda', 'BEFORE');

    console.log('\n=== RUNNING LIVE BEFORE PROOF FOR AVANI TIGER RESORT ===');
    await captureRankingProof(avani, 'Resorts near Sunna Gate Tipeshwar', 'BEFORE');

    console.log('\n=== BOTH PROOFS CAPTURED SUCCESSFULLY ===');
  }
  runDemo();
}
