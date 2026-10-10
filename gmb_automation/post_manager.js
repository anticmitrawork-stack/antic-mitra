const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const ACCOUNT_ID = process.env.GMB_ACCOUNT_ID;
const LOCATION_ID = process.env.GMB_LOCATION_ID;

/**
 * Initializes authenticated Google OAuth2 Client
 */
function getOAuthClient() {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    throw new Error('Missing OAuth credentials. Run oauth_server.js first to generate REFRESH_TOKEN.');
  }

  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    'http://localhost:5000/callback'
  );

  oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN
  });

  return oauth2Client;
}

/**
 * Publishes a LocalPost to Google Business Profile via API
 * 
 * @param {Object} postData
 * @param {string} postData.summary - Description text
 * @param {string} postData.ctaType - "LEARN_MORE" | "BOOK" | "CALL" | "ORDER"
 * @param {string} postData.ctaUrl - Action URL
 * @param {string} postData.imageUrl - Publicly accessible image URL (Google requires a URL for API photo uploads)
 */
async function publishGmbPost({ summary, ctaType = 'LEARN_MORE', ctaUrl, imageUrl, accountId, locationId }) {
  const auth = getOAuthClient();
  const accId = accountId || ACCOUNT_ID;
  const locId = locationId || LOCATION_ID;

  if (!accId || !locId) {
    throw new Error('GMB_ACCOUNT_ID and GMB_LOCATION_ID must be specified in config.env or arguments.');
  }

  console.log(`📤 Publishing post to GMB Account: ${accId}, Location: ${locId}...`);

  // Construct Google My Business v4 LocalPost body
  const postBody = {
    languageCode: 'en-US',
    summary: summary,
    topicType: 'STANDARD',
    callToAction: ctaUrl ? {
      actionType: ctaType,
      url: ctaUrl
    } : undefined,
    media: imageUrl ? [
      {
        mediaFormat: 'PHOTO',
        sourceUrl: imageUrl
      }
    ] : undefined
  };

  // Google My Business API endpoint for localPosts
  const endpoint = `https://mybusiness.googleapis.com/v4/accounts/${accId}/locations/${locId}/localPosts`;

  const response = await auth.request({
    url: endpoint,
    method: 'POST',
    data: postBody
  });

  console.log('🎉 Post published successfully via Google API!');
  console.log('Post ID:', response.data.name);
  console.log('Search URL:', response.data.searchUrl);

  return response.data;
}

module.exports = {
  getOAuthClient,
  publishGmbPost
};

// Standalone execution test
if (require.main === module) {
  const sampleSummary = `🐅 Escape into the Wild at Avani Tiger Resort! 🌿
Plan your perfect weekend getaway near Tipeshwar Wildlife Sanctuary! Luxury cottages, jungle safari assistance, swimming pool & homestyle food.
📞 096768 71777`;

  publishGmbPost({
    summary: sampleSummary,
    ctaType: 'LEARN_MORE',
    ctaUrl: 'https://avanitigerresorts.com/contact-us/'
  }).catch(err => {
    console.error('API Publish Error:', err.response ? err.response.data : err.message);
  });
}
