const fs = require('fs');
const path = require('path');
const { publishGmbPost } = require('./post_manager');

const QUEUE_FILE = path.join(__dirname, 'posts_queue.json');

/**
 * Checks posts_queue.json and publishes pending posts due today
 */
async function processQueue() {
  if (!fs.existsSync(QUEUE_FILE)) {
    console.log('No posts_queue.json found. Creating sample...');
    const sampleQueue = [
      {
        id: 1,
        date: new Date().toISOString().split('T')[0],
        summary: `🐅 Escape into the Wild at Avani Tiger Resort! 🌿\nPlan your perfect weekend getaway near Tipeshwar Wildlife Sanctuary!\n📞 Call: 096768 71777`,
        ctaType: 'LEARN_MORE',
        ctaUrl: 'https://avanitigerresorts.com/contact-us/',
        imageUrl: 'https://avanitigerresorts.com/wp-content/uploads/2023/sample-pool.jpg',
        status: 'PENDING'
      }
    ];
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(sampleQueue, null, 2));
    console.log('Sample posts_queue.json created.');
    return;
  }

  const posts = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
  const today = new Date().toISOString().split('T')[0];

  for (const post of posts) {
    if (post.status === 'PENDING' && post.date <= today) {
      console.log(`Processing post #${post.id} scheduled for ${post.date}...`);
      try {
        await publishGmbPost({
          summary: post.summary,
          ctaType: post.ctaType,
          ctaUrl: post.ctaUrl,
          imageUrl: post.imageUrl
        });
        post.status = 'PUBLISHED';
        post.publishedAt = new Date().toISOString();
        console.log(`✅ Post #${post.id} successfully published!`);
      } catch (err) {
        post.status = 'FAILED';
        post.error = err.message;
        console.error(`❌ Post #${post.id} failed:`, err.message);
      }
    }
  }

  fs.writeFileSync(QUEUE_FILE, JSON.stringify(posts, null, 2));
}

if (require.main === module) {
  processQueue();
}

module.exports = { processQueue };
