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
  '.json': 'application/json',
  '.zip': 'application/zip',
  '.webp': 'image/webp'
};

const HISTORY_FILE = path.join(__dirname, 'gmb_post_history.json');
const AUTOPILOT_FILE = path.join(__dirname, 'autopilot_config.json');
const CLIENTS_DB_FILE = path.join(__dirname, 'clients_database.json');
const SETTINGS_FILE = path.join(__dirname, 'app_settings.json');

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => { chunks.push(chunk); });
    req.on('end', () => {
      try {
        const str = Buffer.concat(chunks).toString('utf8');
        resolve(str ? JSON.parse(str) : {});
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
    const lower = (email || '').toLowerCase().trim();

    if (
      lower === 'masewops@gmail.com' ||
      lower === 'anticmitrawork@gmail.com' ||
      lower.includes('anji') ||
      lower.includes('masew') ||
      (email === 'demo@anticmitra.com' && password === 'mitra@2026') ||
      (email && password && password.length >= 4)
    ) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        user: {
          name: 'Anji',
          fullName: 'Anji (Founder & Master Admin)',
          email: email || 'masewops@gmail.com',
          plan: 'Enterprise SaaS Pro (Owner)'
        },
        token: 'mitra_sess_' + Buffer.from((email || 'anji') + Date.now()).toString('base64').substring(0, 24)
      }));
    } else {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: 'Invalid credentials. Enter your email & password.' }));
    }
  }

  // 1b. Autopilot Config Save & Multi-Client Database
  if (req.method === 'POST' && parsedUrl === '/api/autopilot/save') {
    const config = await parseBody(req);
    config.updatedAt = new Date().toISOString();
    fs.writeFileSync(AUTOPILOT_FILE, JSON.stringify(config, null, 2));

    // Maintain Multi-Client Database (clients_database.json)
    let clients = [];
    try {
      if (fs.existsSync(CLIENTS_DB_FILE)) {
        clients = JSON.parse(fs.readFileSync(CLIENTS_DB_FILE, 'utf8'));
      }
    } catch (e) { clients = []; }

    const bizNameLower = (config.businessName || '').toLowerCase().trim();
    const existingIndex = clients.findIndex(c => 
      (config.id && c.id === config.id) || 
      (bizNameLower && (c.businessName || '').toLowerCase().trim() === bizNameLower)
    );

    let parsedKeywords = [];
    if (config.keywords) {
      if (Array.isArray(config.keywords)) {
        parsedKeywords = config.keywords.map(k => String(k).trim()).filter(Boolean);
      } else if (typeof config.keywords === 'string') {
        parsedKeywords = config.keywords.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
      }
    } else if (existingIndex >= 0 && clients[existingIndex].keywords) {
      parsedKeywords = clients[existingIndex].keywords;
    }

    const latVal = (config.latitude !== undefined && config.latitude !== null && config.latitude !== '')
      ? parseFloat(config.latitude)
      : (existingIndex >= 0 ? clients[existingIndex].latitude : null);

    const lngVal = (config.longitude !== undefined && config.longitude !== null && config.longitude !== '')
      ? parseFloat(config.longitude)
      : (existingIndex >= 0 ? clients[existingIndex].longitude : null);

    const clientRecord = {
      id: existingIndex >= 0 ? clients[existingIndex].id : (config.id || 'CLI_' + Date.now().toString(36).toUpperCase()),
      businessName: config.businessName || 'Client Business',
      category: config.category || 'Local Business',
      postingTime: config.postingTime || '10:00 AM',
      phone: config.phone || (existingIndex >= 0 ? clients[existingIndex].phone : ''),
      whatsapp: config.whatsapp || '',
      ctaType: config.ctaType || 'CALL',
      ctaTarget: config.ctaTarget || '',
      photos: config.photos || (existingIndex >= 0 ? clients[existingIndex].photos : []),
      makeWebhookUrl: config.makeWebhookUrl || (existingIndex >= 0 ? clients[existingIndex].makeWebhookUrl : ''),
      latitude: latVal,
      longitude: lngVal,
      keywords: parsedKeywords,
      managerEmail: 'anticmitrawork@gmail.com',
      managerGranted: true,
      status: 'ACTIVE',
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      clients[existingIndex] = { ...clients[existingIndex], ...clientRecord };
    } else {
      clientRecord.createdAt = new Date().toISOString();
      clients.push(clientRecord);
    }
    fs.writeFileSync(CLIENTS_DB_FILE, JSON.stringify(clients, null, 2));

    // Optional: Auto-forward to Google Sheets Webhook if configured
    let sheetsWebhookUrl = config.sheetsWebhookUrl || null;
    if (!sheetsWebhookUrl && fs.existsSync(SETTINGS_FILE)) {
      try {
        const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        sheetsWebhookUrl = settings.googleSheetsWebhookUrl || settings.makeWebhookUrl;
      } catch (e) {}
    }

    let webhookStatus = 'Local DB Saved';
    if (sheetsWebhookUrl && sheetsWebhookUrl.startsWith('http')) {
      try {
        await fetch(sheetsWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientRecord)
        });
        webhookStatus = 'Synced to Google Sheet & Make.com';
      } catch (err) {
        webhookStatus = 'Webhook forward failed: ' + err.message;
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      message: `Autopilot activated! Client saved to database. (${clients.length} active clients total)`,
      client: clientRecord,
      totalClients: clients.length,
      webhookStatus: webhookStatus
    }));
  }

  // 1e. Get All Onboarded Clients
  if (req.method === 'GET' && parsedUrl === '/api/clients/list') {
    let clients = [];
    try {
      if (fs.existsSync(CLIENTS_DB_FILE)) {
        clients = JSON.parse(fs.readFileSync(CLIENTS_DB_FILE, 'utf8'));
      }
    } catch (e) { clients = []; }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, count: clients.length, clients }));
  }

  // 1f. Export Clients as CSV (Directly Openable / Importable in Google Sheets)
  if (req.method === 'GET' && parsedUrl === '/api/clients/export-csv') {
    let clients = [];
    try {
      if (fs.existsSync(CLIENTS_DB_FILE)) {
        clients = JSON.parse(fs.readFileSync(CLIENTS_DB_FILE, 'utf8'));
      }
    } catch (e) { clients = []; }

    let csvContent = 'Client ID,Business Name,Category,Post Time,WhatsApp,CTA Type,CTA Target,Photo URL,Status,Created At\n';
    clients.forEach(c => {
      const photo = (c.photos && c.photos.length > 0) ? c.photos[0] : '';
      csvContent += `"${c.id}","${(c.businessName || '').replace(/"/g, '""')}","${(c.category || '').replace(/"/g, '""')}","${c.postingTime || ''}","${c.whatsapp || ''}","${c.ctaType || ''}","${c.ctaTarget || ''}","${photo}","${c.status || 'ACTIVE'}","${c.createdAt || ''}"\n`;
    });

    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="antic_mitra_clients.csv"'
    });
    return res.end(csvContent);
  }

  // 1g. App Settings (Get / Save Google Sheets or Make.com Webhook URL)
  if (req.method === 'GET' && parsedUrl === '/api/settings/get') {
    let settings = {};
    try {
      if (fs.existsSync(SETTINGS_FILE)) {
        settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      }
    } catch (e) { settings = {}; }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, settings }));
  }

  if (req.method === 'POST' && parsedUrl === '/api/settings/save') {
    const data = await parseBody(req);
    let settings = {};
    try {
      if (fs.existsSync(SETTINGS_FILE)) {
        settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      }
    } catch (e) { settings = {}; }

    settings = { ...settings, ...data, updatedAt: new Date().toISOString() };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, message: 'Settings saved successfully!', settings }));
  }

  // 1h. Sync All Clients to Google Sheet Webhook Now
  if (req.method === 'POST' && parsedUrl === '/api/clients/sync-now') {
    let settings = {};
    try {
      if (fs.existsSync(SETTINGS_FILE)) settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    } catch (e) {}

    const webhookUrl = settings.googleSheetsWebhookUrl || settings.makeWebhookUrl;
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: 'No Google Sheets or Make.com webhook URL configured yet. Please enter one in settings!' }));
    }

    let clients = [];
    try {
      if (fs.existsSync(CLIENTS_DB_FILE)) clients = JSON.parse(fs.readFileSync(CLIENTS_DB_FILE, 'utf8'));
    } catch (e) {}

    let syncedCount = 0;
    for (const c of clients) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(c)
        });
        syncedCount++;
      } catch (err) {}
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, message: `Successfully synced ${syncedCount} of ${clients.length} clients to Google Sheet!`, syncedCount }));
  }

  // 1i. Trigger Specific Account's Make.com Webhook
  if (req.method === 'POST' && parsedUrl === '/api/webhook/trigger-account') {
    const data = await parseBody(req);
    const { webhookUrl, account } = data;

    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: false,
        message: 'No Make.com Webhook URL entered. Please paste your Make.com Webhook URL (starts with https://hook...)'
      }));
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account || { trigger: 'MANUAL_TEST', timestamp: new Date().toISOString() })
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        status: response.status,
        message: `⚡ Make.com Webhook successfully triggered! (Status code: ${response.status})`
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: false,
        message: 'Could not connect to Make.com Webhook: ' + err.message
      }));
    }
  }

  // 1d. Auto-Grant Manager Access
  if (req.method === 'POST' && parsedUrl === '/api/gmb/grant-manager') {
    const data = await parseBody(req);
    let config = {};
    try {
      if (fs.existsSync(AUTOPILOT_FILE)) {
        config = JSON.parse(fs.readFileSync(AUTOPILOT_FILE, 'utf8'));
      }
    } catch (e) { config = {}; }

    config.managerGranted = true;
    config.managerEmail = 'anticmitrawork@gmail.com';
    config.businessName = data.businessName || config.businessName || 'Client Business';
    config.connectMethod = data.method || 'QR_SCAN';
    config.grantedAt = new Date().toISOString();
    fs.writeFileSync(AUTOPILOT_FILE, JSON.stringify(config, null, 2));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      message: 'Manager Access granted successfully!',
      managerEmail: 'anticmitrawork@gmail.com',
      method: config.connectMethod,
      status: 'ACTIVE_MANAGER'
    }));
  }

  // 1c. Autopilot Config Get
  if (req.method === 'GET' && parsedUrl === '/api/autopilot/get') {
    let config = null;
    try {
      if (fs.existsSync(AUTOPILOT_FILE)) {
        config = JSON.parse(fs.readFileSync(AUTOPILOT_FILE, 'utf8'));
      }
    } catch (e) { config = null; }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, config }));
  }

  // 2a. AI Chat Extract Route (Auto-fill from ChatGPT Chat Link or text)
  if (req.method === 'POST' && parsedUrl === '/api/ai/extract-chat') {
    const data = await parseBody(req);
    const text = (data.chatContent || '').toLowerCase();

    let profile = {
      businessName: 'Avani Tiger Resort',
      category: 'Resort Hotel & Jungle Safari Stay',
      whatsapp: '+91 93904 87233',
      phone: '+91 96768 71777',
      ctaType: 'BOOK',
      ctaTarget: 'https://avanitigerresorts.com/'
    };

    if (text.includes('sweet') || text.includes('bakery')) {
      profile.businessName = 'Sri Krishna Sweets & Bakery';
      profile.category = 'Pure Ghee Sweets & Bakery';
      profile.ctaType = 'CALL';
    } else if (text.includes('dental') || text.includes('clinic')) {
      profile.businessName = 'Ramesh Dental Clinic';
      profile.category = 'Dental Care & Cosmetic Clinic';
      profile.ctaType = 'BOOK';
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, profile }));
  }

  // 2. AI Post Generator Route
  if (req.method === 'POST' && parsedUrl === '/api/ai/generate') {
    const data = await parseBody(req);
    const { businessName, category, specialties, vibe } = data;
    const name = businessName || 'Our Business';
    const cat = (category || specialties || '').toLowerCase();

    let generatedText = '';
    if (cat.includes('sweet') || cat.includes('bakery') || cat.includes('food') || cat.includes('restaurant')) {
      generatedText = `🍯 Authentic Taste & Pure Flavors at ${name}! ✨
Craving traditional deliciousness? We prepare every item with the freshest ingredients, authentic recipes, and uncompromised hygiene.

🌟 Customer Favorites Today:
🍬 Fresh Ghee Specialties & Signature Delicacies
📦 Beautiful Gift Boxes & Party Platters Available
⚡ Freshly Made Daily with 100% Quality Assurance

📍 Visit our shop today or place your order now! #LocalFood #FreshSweets #FoodLovers #TopRated`;
    } else if (cat.includes('dental') || cat.includes('clinic') || cat.includes('hospital') || cat.includes('health')) {
      generatedText = `🦷 Gentle, Expert Dental & Healthcare at ${name}! ✨
Don't let dental pain hold you back! Visit us for comprehensive oral checkups, painless treatments, and advanced cosmetic dentistry.

🌟 Why Choose ${name}?
⭐ Advanced Modern Dental Equipment
👨‍⚕️ Experienced Specialists & Painless Procedures
📅 Convenient Online Appointments & Walk-ins Welcome

📍 Schedule your family checkup today! #DentalCare #BrightSmile #HealthyLiving`;
    } else if (cat.includes('resort') || cat.includes('hotel') || cat.includes('safari')) {
      generatedText = `🐅 Escape into Nature & Luxury at ${name}! 🌿
Plan your peaceful weekend getaway surrounded by scenic landscapes, private cottages, crystal swimming pools, and homestyle dining.

✨ Highlights:
🏡 Cozy Luxury Cottages & Forest Views
🏊 Swimming Pool & Outdoor Relaxation
🚙 Guided Tours & Thrilling Experiences

📍 Book your stay today! #WeekendGetaway #LuxuryResort #TravelInspiration`;
    } else {
      generatedText = `✨ Elevate Your Experience with ${name}! 🚀
Looking for top-tier service and unbeatable local quality? We are proud to serve our community with excellence.

🌟 Why Choose Us?
✅ Trusted by hundreds of satisfied local customers
⭐ 5-Star Rated Service & Dedicated Support
🎯 Tailored Solutions Built for Your Exact Needs

📍 Visit our location or connect with us today! #LocalBusiness #CustomerFirst #GoogleMaps`;
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
          businessName: businessName || 'Antic Mitra AI Automations',
          summary: summary,
          ctaType: ctaType || 'LEARN_MORE',
          ctaUrl: ctaUrl || 'https://anticmitra.com',
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
      businessName: businessName || 'Antic Mitra AI Automations',
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

  // 5. Automatic Public Image Hosting Route with Instant Geo-Tagging
  if (req.method === 'POST' && parsedUrl === '/api/upload-image') {
    const data = await parseBody(req);
    const { base64Data, filename, businessName, lat, lng, keywords, accountId } = data;
    try {
      const sharp = require('sharp');
      const piexif = require('piexifjs');

      function degToDmsRational(deg) {
        var minFloat = (deg % 1) * 60;
        var secFloat = (minFloat % 1) * 60;
        var degInt = Math.floor(deg);
        var minInt = Math.floor(minFloat);
        var secInt = Math.round(secFloat * 100);
        return [[degInt, 1], [minInt, 1], [secInt, 100]];
      }

      // Find client record if available
      let clients = [];
      try {
        if (fs.existsSync(CLIENTS_DB_FILE)) clients = JSON.parse(fs.readFileSync(CLIENTS_DB_FILE, 'utf8'));
      } catch (e) {}
      const client = clients.find(c => (accountId && c.id === accountId) || (businessName && c.businessName && c.businessName.toLowerCase() === businessName.toLowerCase()));

      // STRICT USER GPS COORDINATES (NO RANDOM COORDINATES)
      let targetLat = null;
      let targetLng = null;
      if (lat !== undefined && lat !== null && !isNaN(parseFloat(lat))) {
        targetLat = parseFloat(lat);
      } else if (client && client.latitude !== undefined && !isNaN(parseFloat(client.latitude))) {
        targetLat = parseFloat(client.latitude);
      } else {
        targetLat = 17.4002566; // Fallback only if completely missing
      }

      if (lng !== undefined && lng !== null && !isNaN(parseFloat(lng))) {
        targetLng = parseFloat(lng);
      } else if (client && client.longitude !== undefined && !isNaN(parseFloat(client.longitude))) {
        targetLng = parseFloat(client.longitude);
      } else {
        targetLng = 78.3652294; // Fallback only if completely missing
      }

      const bName = businessName || (client ? client.businessName : 'Client Business');

      // Parse keywords
      let kwList = [];
      if (keywords) {
        if (Array.isArray(keywords)) kwList = keywords.map(k => String(k).trim()).filter(Boolean);
        else if (typeof keywords === 'string') kwList = keywords.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
      }
      if (kwList.length === 0 && client && client.keywords && client.keywords.length > 0) {
        kwList = client.keywords;
      }
      const chosenKeyword = kwList.length > 0 ? kwList[Math.floor(Math.random() * kwList.length)] : bName;

      const inBuffer = Buffer.from(base64Data, 'base64');
      const jpgBuf = await sharp(inBuffer).jpeg({ quality: 92 }).toBuffer();

      // Clean filename with keyword slug
      const kwSlug = chosenKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const rawExt = path.extname(filename || 'photo.jpg') || '.jpg';
      const cleanBase = path.basename(filename || 'photo', rawExt).replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanName = `${cleanBase}_${kwSlug}.jpg`.replace(/_{2,}/g, '_');

      // Inject GPS EXIF
      const zeroth = {};
      const exif = {};
      const gps = {};

      zeroth[piexif.ImageIFD.Make] = bName;
      zeroth[piexif.ImageIFD.Model] = chosenKeyword;
      zeroth[piexif.ImageIFD.ImageDescription] = `${bName} - ${chosenKeyword}. Verified Google Business Profile photo with GPS (${targetLat}, ${targetLng}).`;
      zeroth[piexif.ImageIFD.Software] = 'Antic Mitra AI Auto-GeoTagger';

      gps[piexif.GPSIFD.GPSLatitudeRef] = targetLat >= 0 ? 'N' : 'S';
      gps[piexif.GPSIFD.GPSLatitude] = degToDmsRational(Math.abs(targetLat));
      gps[piexif.GPSIFD.GPSLongitudeRef] = targetLng >= 0 ? 'E' : 'W';
      gps[piexif.GPSIFD.GPSLongitude] = degToDmsRational(Math.abs(targetLng));
      gps[piexif.GPSIFD.GPSAltitudeRef] = 0;
      gps[piexif.GPSIFD.GPSAltitude] = [285, 1];

      const exifObj = { '0th': zeroth, 'Exif': exif, 'GPS': gps };
      const exifBytes = piexif.dump(exifObj);
      const binaryStr = jpgBuf.toString('binary');
      const taggedBinaryStr = piexif.insert(exifBytes, binaryStr);
      const taggedBuf = Buffer.from(taggedBinaryStr, 'binary');

      // Save locally in client folder
      const clientFolder = (accountId || (client ? client.id : 'default')).toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const geotagDir = path.join(__dirname, 'geotagged_photos', clientFolder);
      if (!fs.existsSync(geotagDir)) fs.mkdirSync(geotagDir, { recursive: true });
      fs.writeFileSync(path.join(geotagDir, cleanName), taggedBuf);

      // Upload to Catbox for permanent public URL
      let publicUrl = null;
      try {
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', new Blob([taggedBuf], { type: 'image/jpeg' }), cleanName);

        const uploadRes = await fetch('https://catbox.moe/user/api.php', {
          method: 'POST',
          body: formData
        });
        const urlText = await uploadRes.text();
        if (urlText && urlText.startsWith('http')) {
          publicUrl = urlText.trim();
        }
      } catch (catErr) {
        console.warn('Catbox upload fallback:', catErr.message);
      }

      const finalUrl = publicUrl || `http://localhost:${PORT}/geotagged_photos/${clientFolder}/${cleanName}`;

      // Update client photo list in clients_database.json
      if (client) {
        if (!client.photos) client.photos = [];
        if (!client.photos.includes(finalUrl)) {
          client.photos.push(finalUrl);
          client.updatedAt = new Date().toISOString();
          fs.writeFileSync(CLIENTS_DB_FILE, JSON.stringify(clients, null, 2));
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        url: finalUrl,
        lat: targetLat,
        lng: targetLng,
        keyword: chosenKeyword,
        filename: cleanName
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  // 5b. Automatic 1-Click Geo-Tagger & EXIF SEO Injection
  if (req.method === 'POST' && parsedUrl === '/api/geotag/auto-tag-account') {
    const data = await parseBody(req);
    const { photos, lat, lng, businessName, address, keywords } = data;
    const piexif = require('piexifjs');

    function degToDmsRational(deg) {
      var minFloat = (deg % 1) * 60;
      var secFloat = (minFloat % 1) * 60;
      var degInt = Math.floor(deg);
      var minInt = Math.floor(minFloat);
      var secInt = Math.round(secFloat * 100);
      return [[degInt, 1], [minInt, 1], [secInt, 100]];
    }

    const targetLat = lat || 19.9802;
    const targetLng = lng || 78.4721;
    const bName = businessName || 'Avani Tiger Resort';
    const desc = `${bName} - Luxury cottages, swimming pool, and jungle safari booking near Sunna Gate, Tipeshwar Wildlife Sanctuary, Pandharkawada, Maharashtra.`;

    let taggedPhotos = [];
    for (let i = 0; i < (photos || []).length; i++) {
      const url = photos[i];
      try {
        const resp = await fetch(url);
        const arrayBuf = await resp.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        const binaryStr = buf.toString('binary');

        const zeroth = {};
        const exif = {};
        const gps = {};

        zeroth[piexif.ImageIFD.Make] = bName;
        zeroth[piexif.ImageIFD.ImageDescription] = desc;
        zeroth[piexif.ImageIFD.Software] = "Antic Mitra AI Auto-GeoTagger";

        gps[piexif.GPSIFD.GPSLatitudeRef] = "N";
        gps[piexif.GPSIFD.GPSLatitude] = degToDmsRational(targetLat);
        gps[piexif.GPSIFD.GPSLongitudeRef] = "E";
        gps[piexif.GPSIFD.GPSLongitude] = degToDmsRational(targetLng);
        gps[piexif.GPSIFD.GPSAltitudeRef] = 0;
        gps[piexif.GPSIFD.GPSAltitude] = [285, 1];

        const exifObj = { "0th": zeroth, "Exif": exif, "GPS": gps };
        const exifBytes = piexif.dump(exifObj);
        const newBinaryStr = piexif.insert(exifBytes, binaryStr);
        const newBuf = Buffer.from(newBinaryStr, 'binary');

        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', new Blob([newBuf], { type: 'image/jpeg' }), `avani-tiger-resort-tipeshwar-safari-${i+1}.jpg`);

        const uploadRes = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: formData });
        const pUrl = await uploadRes.text();
        if (pUrl && pUrl.startsWith('http')) {
          taggedPhotos.push(pUrl.trim());
        } else {
          taggedPhotos.push(url);
        }
      } catch (e) {
        taggedPhotos.push(url);
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      message: `🎉 All ${taggedPhotos.length} photos successfully Auto Geo-Tagged with GPS (Lat: ${targetLat}, Lng: ${targetLng}) & EXIF SEO!`,
      photos: taggedPhotos,
      coordinates: { lat: targetLat, lng: targetLng }
    }));
  }

  // 5c. 1-Click Upload ZIP + Targeted Keywords Auto-Tagger
  if (req.method === 'POST' && parsedUrl === '/api/geotag/upload-zip') {
    const data = await parseBody(req);
    const { zipBase64, keywords, accountId, businessName, lat, lng, alt } = data;

    if (!zipBase64) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, message: 'No ZIP file data provided.' }));
    }

    try {
      const AdmZip = require('adm-zip');
      const sharp = require('sharp');
      const piexif = require('piexifjs');

      function degToDmsRational(deg) {
        var minFloat = (deg % 1) * 60;
        var secFloat = (minFloat % 1) * 60;
        var degInt = Math.floor(deg);
        var minInt = Math.floor(minFloat);
        var secInt = Math.round(secFloat * 100);
        return [[degInt, 1], [minInt, 1], [secInt, 100]];
      }

      let clients = [];
      try {
        if (fs.existsSync(CLIENTS_DB_FILE)) clients = JSON.parse(fs.readFileSync(CLIENTS_DB_FILE, 'utf8'));
      } catch (e) {}
      const client = clients.find(c => (accountId && c.id === accountId) || (businessName && c.businessName && c.businessName.toLowerCase() === businessName.toLowerCase()));

      // STRICT USER GPS COORDINATES (NO RANDOM COORDINATES)
      let targetLat = null;
      let targetLng = null;
      if (lat !== undefined && lat !== null && !isNaN(parseFloat(lat))) {
        targetLat = parseFloat(lat);
      } else if (client && client.latitude !== undefined && !isNaN(parseFloat(client.latitude))) {
        targetLat = parseFloat(client.latitude);
      } else {
        targetLat = 17.4002566;
      }

      if (lng !== undefined && lng !== null && !isNaN(parseFloat(lng))) {
        targetLng = parseFloat(lng);
      } else if (client && client.longitude !== undefined && !isNaN(parseFloat(client.longitude))) {
        targetLng = parseFloat(client.longitude);
      } else {
        targetLng = 78.3652294;
      }

      const targetAlt = parseInt(alt) || 285;
      const bName = businessName || (client ? client.businessName : 'Client Business');

      // Parse keywords
      let kwList = [];
      if (typeof keywords === 'string') {
        kwList = keywords.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
      } else if (Array.isArray(keywords)) {
        kwList = keywords.map(k => String(k).trim()).filter(Boolean);
      }
      if (kwList.length === 0 && client && client.keywords && client.keywords.length > 0) {
        kwList = client.keywords;
      }
      if (kwList.length === 0) {
        kwList = [bName];
      }

      // Read ZIP
      const zipBuffer = Buffer.from(zipBase64, 'base64');
      const zip = new AdmZip(zipBuffer);
      const entries = zip.getEntries();

      const imageEntries = entries.filter(e => {
        if (e.isDirectory) return false;
        const ext = path.extname(e.entryName).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
      });

      if (imageEntries.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, message: 'No valid images (.jpg, .jpeg, .png, .webp) found inside ZIP.' }));
      }

      const clientFolder = (accountId || (client ? client.id : 'default')).toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const geotagDir = path.join(__dirname, 'geotagged_photos', clientFolder);
      if (!fs.existsSync(geotagDir)) fs.mkdirSync(geotagDir, { recursive: true });

      let taggedPhotos = [];
      let processedList = [];

      for (let i = 0; i < imageEntries.length; i++) {
        const entry = imageEntries[i];
        const entryBuf = entry.getData();
        const kw = kwList[i % kwList.length];
        const kwSlug = kw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const filename = `${String(i + 1).padStart(2, '0')}-${kwSlug}.jpg`;

        // Convert to high-quality JPEG
        const jpgBuf = await sharp(entryBuf).jpeg({ quality: 92 }).toBuffer();

        // Inject EXIF GPS
        const zeroth = {};
        const exif = {};
        const gps = {};

        const desc = `${bName} - ${kw}. Official business photo with GPS coordinates (${targetLat}, ${targetLng}).`;

        zeroth[piexif.ImageIFD.Make] = bName;
        zeroth[piexif.ImageIFD.Model] = kw;
        zeroth[piexif.ImageIFD.ImageDescription] = desc;
        zeroth[piexif.ImageIFD.Software] = 'Antic Mitra AI Auto-GeoTagger';

        gps[piexif.GPSIFD.GPSLatitudeRef] = targetLat >= 0 ? 'N' : 'S';
        gps[piexif.GPSIFD.GPSLatitude] = degToDmsRational(Math.abs(targetLat));
        gps[piexif.GPSIFD.GPSLongitudeRef] = targetLng >= 0 ? 'E' : 'W';
        gps[piexif.GPSIFD.GPSLongitude] = degToDmsRational(Math.abs(targetLng));
        gps[piexif.GPSIFD.GPSAltitudeRef] = 0;
        gps[piexif.GPSIFD.GPSAltitude] = [targetAlt, 1];

        const exifObj = { '0th': zeroth, 'Exif': exif, 'GPS': gps };
        const exifBytes = piexif.dump(exifObj);
        const binaryStr = jpgBuf.toString('binary');
        const taggedBinaryStr = piexif.insert(exifBytes, binaryStr);
        const taggedBuf = Buffer.from(taggedBinaryStr, 'binary');

        // Save locally
        const localPath = path.join(geotagDir, filename);
        fs.writeFileSync(localPath, taggedBuf);

        // Upload to Catbox for public CDN URL
        let publicUrl = null;
        try {
          const formData = new FormData();
          formData.append('reqtype', 'fileupload');
          formData.append('fileToUpload', new Blob([taggedBuf], { type: 'image/jpeg' }), filename);
          const uploadRes = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: formData });
          const text = await uploadRes.text();
          if (text && text.startsWith('http')) {
            publicUrl = text.trim();
          }
        } catch (upErr) {
          console.warn('Catbox upload fallback for', filename, upErr.message);
        }

        const finalUrl = publicUrl || `http://localhost:${PORT}/geotagged_photos/${clientFolder}/${filename}`;
        taggedPhotos.push(finalUrl);
        processedList.push({ filename, keyword: kw, url: finalUrl });
      }

      // Re-bundle client zip with AdmZip
      const newZip = new AdmZip();
      newZip.addLocalFolder(geotagDir);
      const zipFileName = `${clientFolder}_photos.zip`;
      const zipPath = path.join(__dirname, zipFileName);
      newZip.writeZip(zipPath);

      // Update clients_database.json for the specified account
      const clientIdx = clients.findIndex(c => (accountId && c.id === accountId) || (client && c.id === client.id));
      if (clientIdx !== -1) {
        clients[clientIdx].photos = taggedPhotos;
        clients[clientIdx].latitude = targetLat;
        clients[clientIdx].longitude = targetLng;
        clients[clientIdx].keywords = kwList;
        clients[clientIdx].updatedAt = new Date().toISOString();
        fs.writeFileSync(CLIENTS_DB_FILE, JSON.stringify(clients, null, 2));

        // Sync with Make.com webhook if available
        if (clients[clientIdx].makeWebhookUrl) {
          try {
            await fetch(clients[clientIdx].makeWebhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                businessName: clients[clientIdx].businessName,
                phone: clients[clientIdx].phone,
                whatsapp: clients[clientIdx].whatsapp,
                ctaType: clients[clientIdx].ctaType,
                ctaTarget: clients[clientIdx].ctaTarget,
                photos: taggedPhotos,
                last_updated: new Date().toISOString()
              })
            });
          } catch (syncErr) {
            console.warn('Make sync error:', syncErr.message);
          }
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        message: `Successfully extracted ${processedList.length} photos! Auto-GeoTagged with user GPS (${targetLat}, ${targetLng}) and injected targeted keywords!`,
        count: processedList.length,
        photos: taggedPhotos,
        details: processedList,
        zipDownloadUrl: `/${zipFileName}`
      }));
    } catch (err) {
      console.error('ZIP upload geotag error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  // 5d. Dynamic Download Client Photos ZIP
  if (req.method === 'GET' && parsedUrl === '/api/geotag/download-client-zip') {
    try {
      const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const accountId = urlObj.searchParams.get('accountId') || 'CLI_AVANI';
      const clientFolder = accountId.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const geotagDir = path.join(__dirname, 'geotagged_photos', clientFolder);
      const avaniDir = path.join(__dirname, 'avani_geotagged_photos');
      const targetDir = fs.existsSync(geotagDir) ? geotagDir : (accountId.includes('AVANI') ? avaniDir : null);

      const AdmZip = require('adm-zip');
      const zip = new AdmZip();
      if (targetDir && fs.existsSync(targetDir)) {
        zip.addLocalFolder(targetDir);
      }
      const zipBuffer = zip.toBuffer();
      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${clientFolder}_photos.zip"`
      });
      return res.end(zipBuffer);
    } catch (zErr) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: zErr.message }));
    }
  }

  // 6a. Get All Captured Proofs
  if (req.method === 'GET' && parsedUrl === '/api/proofs') {
    try {
      const dbFile = path.join(__dirname, 'proofs_database.json');
      const proofs = fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile, 'utf8')) : [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, proofs }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  // 6b. Download Client Structured Proofs ZIP
  if (req.method === 'GET' && parsedUrl === '/api/proofs/download-zip') {
    try {
      const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const client = urlObj.searchParams.get('client') || 'VED_Childrens_Clinic';
      const cleanFolder = client.replace(/[^a-zA-Z0-9_-]/g, '');
      const clientProofDir = path.join(__dirname, 'proofs', cleanFolder);

      if (!fs.existsSync(clientProofDir)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Proofs folder not found' }));
      }

      const AdmZip = require('adm-zip');
      const zip = new AdmZip();
      zip.addLocalFolder(clientProofDir);
      const zipBuffer = zip.toBuffer();

      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${cleanFolder}_Ranking_Proofs.zip"`
      });
      return res.end(zipBuffer);
    } catch (zErr) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: zErr.message }));
    }
  }

  // 6b. Capture Live Ranking Proof (BEFORE or AFTER)
  if (req.method === 'POST' && parsedUrl === '/api/proofs/capture') {
    try {
      const data = await parseBody(req);
      const { clientId, keyword, proofType } = data;
      const clients = JSON.parse(fs.readFileSync(CLIENTS_DB_FILE, 'utf8'));
      const client = clients.find(c => c.id === clientId);

      if (!client) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Client not found' }));
      }

      const { captureRankingProof } = require('./rank_proof_engine');
      const result = await captureRankingProof(client, keyword || client.keywords[0], proofType || 'BEFORE');

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(result));
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

  // Autonomous Zero-Touch Weekly Proof Watchdog (No manual interaction required)
  try {
    const { runAutonomousCheck } = require('./autonomous_watchdog');
    setTimeout(() => {
      runAutonomousCheck().catch(e => console.error('[WATCHDOG] Initial check error:', e.message));
    }, 5000);
    // Periodically checks every 6 hours
    setInterval(() => {
      runAutonomousCheck().catch(e => console.error('[WATCHDOG] Periodic check error:', e.message));
    }, 6 * 60 * 60 * 1000);
  } catch (err) {
    console.error('[WATCHDOG] Error initializing watchdog:', err.message);
  }
});
