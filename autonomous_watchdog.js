const fs = require('fs');
const path = require('path');
const { captureRankingProof } = require('./rank_proof_engine');

const TG_BOT_TOKEN = '8902678296:AAFkYWE_paqUsr1YTiq3riswDf_rrAoHZu4';
const TG_CHAT_ID = '8783399662';

const DB_FILE = path.join(__dirname, 'proofs_database.json');
const CLIENTS_FILE = path.join(__dirname, 'clients_database.json');

async function sendTelegramMessage(text) {
  try {
    const url = 'https://api.telegram.org/bot' + TG_BOT_TOKEN + '/sendMessage';
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text: text, parse_mode: 'Markdown' })
    });
  } catch (err) {
    console.error('[WATCHDOG] Telegram alert error:', err.message);
  }
}

async function sendTelegramPhoto(caption, imagePath) {
  try {
    if (!fs.existsSync(imagePath)) return;
    const url = 'https://api.telegram.org/bot' + TG_BOT_TOKEN + '/sendPhoto';
    const fileBuf = fs.readFileSync(imagePath);
    const formData = new FormData();
    formData.append('chat_id', TG_CHAT_ID);
    formData.append('caption', caption);
    formData.append('photo', new Blob([fileBuf], { type: 'image/png' }), path.basename(imagePath));

    await fetch(url, { method: 'POST', body: formData });
    console.log('[WATCHDOG] Photo sent to Telegram successfully.');
  } catch (err) {
    console.error('[WATCHDOG] Telegram sendPhoto error:', err.message);
  }
}

async function isOnline() {
  try {
    const res = await fetch('https://www.google.com', { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    return res.ok || res.status === 200 || res.status === 302;
  } catch (e) {
    return false;
  }
}

async function runAutonomousCheck() {
  console.log('[WATCHDOG] Checking system status at:', new Date().toLocaleString());

  const online = await isOnline();
  if (!online) {
    console.log('[WATCHDOG] Internet not available. Will retry later.');
    return;
  }

  if (!fs.existsSync(DB_FILE) || !fs.existsSync(CLIENTS_FILE)) return;

  const proofs = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  const clients = JSON.parse(fs.readFileSync(CLIENTS_FILE, 'utf8'));

  const now = new Date();

  for (const client of clients) {
    if (client.id !== 'CLI_AVANI' && client.id !== 'CLI_VED_CLINIC') continue;

    // Find proof record for this client
    const proof = proofs.find(p => p.clientId === client.id);
    let needsCheck = false;

    if (!proof || !proof.before) {
      needsCheck = true;
    } else {
      const lastCheck = new Date(proof.updatedAt || proof.before.date);
      const diffDays = (now - lastCheck) / (1000 * 60 * 60 * 24);
      if (diffDays >= 7) {
        needsCheck = true;
      }
    }

    if (needsCheck) {
      console.log(`[WATCHDOG] 7+ days elapsed for ${client.businessName}. Auto-capturing rank proof...`);
      const kw = client.id === 'CLI_VED_CLINIC' ? 'pediatrician near me Puppalguda' : 'Resorts near Sunna Gate Tipeshwar';
      const proofType = (proof && proof.before) ? 'AFTER' : 'BEFORE';

      const res = await captureRankingProof(client, kw, proofType);

      if (res.success) {
        const rankText = res.rank ? `Rank #${res.rank}` : 'Scanned';
        const msg = `🤖 *ANTIC MITRA AI — AUTONOMOUS WEEKLY PROOF*\n\n🏢 *${client.businessName}*\n🎯 Keyword: "${kw}"\n📊 Status: *${proofType} Check Done*\n🏆 Current Position: *${rankText}*\n\n✅ _Laptop was detected online. Proof captured automatically with zero manual interaction._`;
        await sendTelegramPhoto(msg, res.filePath);
      }
    } else {
      console.log(`[WATCHDOG] ${client.businessName} checked recently. Next auto-check in < 7 days.`);
    }
  }
}

// Export for server or background run
module.exports = { runAutonomousCheck };

if (require.main === module) {
  runAutonomousCheck();
  // Check every 6 hours silently
  setInterval(runAutonomousCheck, 6 * 60 * 60 * 1000);
}
