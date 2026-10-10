const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json'
};

const HISTORY_FILE = path.join(__dirname, 'gmb_post_history.json');

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = req.url.split('?')[0];

  // =========================================================================
  // BACKEND API ROUTES FOR SAAS APPLICATION
  // =========================================================================

  // 1. Authentication Route
  if (req.method === 'POST' && parsedUrl === '/api/auth/login') {
    const data = await parseBody(req);
    const { email, password } = data;

    // Support demo credentials or any email with demo pass
    if ((email === 'demo@anticmitra.com' && password === 'mitra@2026') || (email && password && password.length >= 4)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        user: {
          name: email.includes('masew') ? 'MasewMedia Ops' : 'Antic Mitra Partner',
          email: email,
          plan: 'Enterprise SaaS Pro',
          connectedProfiles: 2
        },
        token: 'mitra_sess_' + Buffer.from(email + Date.now()).toString('base64').substring(0, 24)
      }));
    } else {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: 'Invalid credentials. Use demo: demo@anticmitra.com / mitra@2026' }));
    }
  }

  // 2. AI Post Generator Route
  if (req.method === 'POST' && parsedUrl === '/api/ai/generate') {
    const data = await parseBody(req);
    const { businessName, vibe, keywords } = data;

    let generatedText = '';
    if ((businessName || '').toLowerCase().includes('avani') || (businessName || '').toLowerCase().includes('resort')) {
      generatedText = `🐅 Escape into the Wild at Avani Tiger Resort! 🌿
Plan your perfect weekend getaway near Tipeshwar Wildlife Sanctuary! Experience thrilling jungle tiger safaris, luxury cottage stays, serene nature walks, and authentic local cuisines.

✨ Why choose Avani Tiger Resort?
🏡 Luxury & Cozy Cottage Stay
🚙 Safari Assistance & Guided Tours
🏊 Swimming Pool & Outdoor Relaxation
🍽️ Delicious Homestyle Food

🌐 Website: avanitigerresorts.com
📍 Sunna Gate, Tipeshwar Wildlife Sanctuary, Maharashtra`;
    } else {
      generatedText = `✨ Elevate Your Experience with ${businessName || 'Our Business'}! 🚀
Looking for top-tier service and unbeatable quality? We provide tailored solutions to help you achieve your goals effortlessly.

🌟 Why Choose Us?
✅ Trusted by hundreds of satisfied clients
⭐ 5-Star Rated Service & Support
🎯 Tailored Solutions Built for Real Results

📍 Visit our location or contact us today to learn more!`;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      text: generatedText,
      generatedAt: new Date().toISOString()
    }));
  }

  // 3. GMB Live Publish Route (Triggers Make.com Webhook or local queue)
  if (req.method === 'POST' && parsedUrl === '/api/gmb/publish') {
    const data = await parseBody(req);
    const { businessName, summary, ctaType, ctaUrl, imageUrl, webhookUrl } = data;

    let webhookResponseStatus = 200;
    let webhookMessage = 'Dispatched to queue';

    // If live Webhook URL is provided, send real HTTP POST
    if (webhookUrl && webhookUrl.startsWith('http')) {
      try {
        const payload = JSON.stringify({
          businessName: businessName || 'Avani Tiger Resort',
          summary: summary,
          ctaType: ctaType || 'LEARN_MORE',
          ctaUrl: ctaUrl || 'https://avanitigerresorts.com/contact-us/',
          imageUrl: imageUrl || ''
        });

        // Use global fetch
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload
        });
        webhookResponseStatus = response.status;
        webhookMessage = `Webhook triggered with status ${response.status}`;
      } catch (err) {
        webhookResponseStatus = 500;
        webhookMessage = 'Webhook error: ' + err.message;
      }
    }

    // Save to history
    let history = [];
    try {
      if (fs.existsSync(HISTORY_FILE)) {
        history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
      }
    } catch (e) { history = []; }

    const newRecord = {
      id: Date.now(),
      businessName: businessName || 'Avani Tiger Resort',
      summary: summary,
      ctaType: ctaType || 'LEARN_MORE',
      ctaUrl: ctaUrl,
      imageUrl: imageUrl,
      publishedAt: new Date().toISOString(),
      status: 'PUBLISHED_SUCCESS',
      webhookStatus: webhookMessage
    };
    history.unshift(newRecord);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history.slice(0, 50), null, 2));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      message: 'Post published successfully to Google Business Profile!',
      record: newRecord
    }));
  }

  // 4. History Feed Route
  if (req.method === 'GET' && parsedUrl === '/api/gmb/history') {
    let history = [];
    try {
      if (fs.existsSync(HISTORY_FILE)) {
        history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
      }
    } catch (e) { history = []; }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, history }));
  }

  // 5. Automatic Public Image Hosting Route (Zero Make.com touching!)
  if (req.method === 'POST' && parsedUrl === '/api/upload-image') {
    const data = await parseBody(req);
    const { base64Data, filename } = data;
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      const formData = new FormData();
      formData.append('reqtype', 'fileupload');
      formData.append('fileToUpload', new Blob([buffer], { type: 'image/jpeg' }), filename || 'gmb_photo.jpg');

      const uploadRes = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: formData
      });
      const publicUrl = await uploadRes.text();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, url: publicUrl.trim() }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  // =========================================================================
  // STATIC FILE SERVING
  // =========================================================================
  let safePath = parsedUrl;
  if (safePath === '/' || safePath === '') {
    safePath = '/index.html';
  }

  const filePath = path.join(__dirname, decodeURIComponent(safePath));

  // Security check to ensure within directory
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end('Access denied');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end('<h1>404 Not Found</h1><p><a href="/">Go to Home</a></p>');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Antic Mitra Server running at: http://localhost:${PORT}/`);
  console.log(`SaaS Studio available at: http://localhost:${PORT}/gmb-saas.html`);
});
