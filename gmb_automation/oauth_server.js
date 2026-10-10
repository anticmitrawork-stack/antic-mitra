const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

const PORT = 5000;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

const SCOPES = [
  'https://www.googleapis.com/auth/business.manage'
];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.log('\n⚠️ [IMPORTANT SETUP STEP]');
  console.log('You need to provide your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in config.env.');
  console.log('See instructions in README_SETUP.md\n');
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === '/') {
    // Landing page
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Crucial: gets permanent refresh_token!
      prompt: 'consent',     // Ensures refresh_token is returned every time
      scope: SCOPES
    });

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Antic Mitra — GMB OAuth Setup</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #FFFDF7; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); max-width: 500px; text-align: center; border: 2px solid #7B3FF2; }
          h1 { color: #7B3FF2; margin-bottom: 12px; }
          p { color: #555; line-height: 1.6; }
          .btn { display: inline-block; background: #7B3FF2; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; margin-top: 20px; font-size: 16px; }
          .btn:hover { background: #6228d7; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🚀 Antic Mitra GMB Manager</h1>
          <p>Click the button below to link your Google Business Account. This generates a <b>Permanent Refresh Token</b> so your background system can post 24/7 without passwords or OTP.</p>
          <a class="btn" href="${authUrl}">Connect Google Business Account</a>
        </div>
      </body>
      </html>
    `);
    return;
  }

  if (parsedUrl.pathname === '/callback') {
    const code = parsedUrl.query.code;
    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('Authorization code missing.');
    }

    try {
      console.log('🔄 Exchanging authorization code for permanent tokens...');
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      console.log('✅ Tokens received!');
      console.log('Refresh Token:', tokens.refresh_token ? 'Extracted successfully!' : 'Existing token retained');

      // Update config.env with permanent refresh token
      const envPath = path.join(__dirname, 'config.env');
      let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

      if (tokens.refresh_token) {
        if (envContent.includes('REFRESH_TOKEN=')) {
          envContent = envContent.replace(/REFRESH_TOKEN=.*/, `REFRESH_TOKEN=${tokens.refresh_token}`);
        } else {
          envContent += `\nREFRESH_TOKEN=${tokens.refresh_token}\n`;
        }
        fs.writeFileSync(envPath, envContent);
        console.log('💾 Permanent REFRESH_TOKEN saved into config.env!');
      }

      // Fetch accounts and locations to help the user identify locationId
      let accountsInfo = [];
      try {
        const mybusiness = google.mybusinessaccountmanagement({ version: 'v1', auth: oauth2Client });
        const accRes = await mybusiness.accounts.list();
        accountsInfo = accRes.data.accounts || [];
        console.log('Discovered GMB Accounts:', accountsInfo.map(a => `${a.accountName} (${a.name})`));
      } catch (err) {
        console.log('Note on Account API:', err.message);
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authorization Successful — Antic Mitra</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #FFFDF7; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); max-width: 550px; text-align: center; border: 2px solid #C6F432; }
            h1 { color: #1e8e3e; margin-bottom: 12px; }
            p { color: #444; line-height: 1.6; }
            .badge { background: #e6f4ea; color: #137333; padding: 6px 14px; border-radius: 20px; font-weight: bold; display: inline-block; margin-bottom: 15px; }
            pre { background: #f1f3f4; padding: 15px; border-radius: 8px; text-align: left; font-size: 13px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">Connected Successfully</span>
            <h1>🎉 Production Setup Complete!</h1>
            <p>Your Google Business Account is now permanently authorized. The <b>Refresh Token</b> is saved in your local configuration.</p>
            <p>You can now run daily automated posts in the background without browser popups or passwords!</p>
            <pre>${JSON.stringify({ status: 'AUTHORIZED', refreshTokenSaved: true, accounts: accountsInfo }, null, 2)}</pre>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      console.error('Error during token exchange:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Authentication failed: ' + error.message);
    }
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Antic Mitra GMB OAuth Server running!`);
  console.log(`👉 Open: http://localhost:${PORT}/ in your browser`);
  console.log(`======================================================\n`);
});
