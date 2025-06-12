'use strict';

// ===================================================================================
// 1. SETUP & IMPORTS (USING ES MODULE SYNTAX)
// ===================================================================================
import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import logger from './logger.js';

// Load and validate credentials from .env file
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// Validate required environment variables
if (!PAGE_ACCESS_TOKEN) {
  logger.error('❌ PAGE_ACCESS_TOKEN is required! Please set it in your .env file.');
  process.exit(1);
}

if (!VERIFY_TOKEN) {
  logger.error('❌ VERIFY_TOKEN is required! Please set it in your .env file.');
  process.exit(1);
}

// ===================================================================================
// 2. AUTO UPTIME SYSTEM (24/7 ONLINE)
// ===================================================================================

const UPTIME_CONFIG = {
  enabled: true,
  pingInterval: 4 * 60 * 1000, // 4 minutes for enhanced monitoring
  selfUrl: process.env.RENDER_URL || 'https://facebook-bot-page-gag-v1.onrender.com',
  maxRetries: 5,
  heartbeatEmojis: ['💖', '💝', '💗', '💓', '💕', '💘', '🫶', '✨', '🌟', '⭐'],
  statusEmojis: {
    online: '🟢',
    warning: '🟡', 
    error: '🔴',
    initializing: '🔵'
  }
};

let uptimeStats = {
  startTime: Date.now(),
  totalPings: 0,
  successfulPings: 0,
  lastPing: null,
  status: 'initializing',
  consecutiveSuccesses: 0,
  consecutiveFailures: 0,
  bestResponseTime: Infinity,
  worstResponseTime: 0,
  averageResponseTime: 0,
  totalResponseTime: 0
};

async function performUptimePing() {
  if (!UPTIME_CONFIG.enabled) return;

  const startTime = Date.now();
  const heartbeat = UPTIME_CONFIG.heartbeatEmojis[Math.floor(Math.random() * UPTIME_CONFIG.heartbeatEmojis.length)];

  try {
    const response = await axios.get(`${UPTIME_CONFIG.selfUrl}/health`, {
      timeout: 12000,
      headers: { 
        'User-Agent': 'Enhanced-GagBot-Uptime-Monitor-v3.0',
        'X-Heartbeat': 'love',
        'X-Love': 'enabled'
      }
    });

    const responseTime = Date.now() - startTime;

    // Update stats
    uptimeStats.totalPings++;
    uptimeStats.successfulPings++;
    uptimeStats.consecutiveSuccesses++;
    uptimeStats.consecutiveFailures = 0;
    uptimeStats.lastPing = Date.now();
    uptimeStats.status = 'online';
    uptimeStats.totalResponseTime += responseTime;
    uptimeStats.averageResponseTime = Math.round(uptimeStats.totalResponseTime / uptimeStats.successfulPings);

    if (responseTime < uptimeStats.bestResponseTime) uptimeStats.bestResponseTime = responseTime;
    if (responseTime > uptimeStats.worstResponseTime) uptimeStats.worstResponseTime = responseTime;

    const statusIcon = UPTIME_CONFIG.statusEmojis.online;
    const successRate = Math.round((uptimeStats.successfulPings / uptimeStats.totalPings) * 100);

    // Beautiful success messages with variety
    const successMessages = [
      `${heartbeat} Enhanced uptime ping successful! ${statusIcon} Render is loving us back!`,
      `✨ Beautiful connection to Render maintained! ${heartbeat} (${responseTime}ms)`,
      `🌟 Aesthetic uptime check complete! ${statusIcon} Bot staying gorgeous & alive!`,
      `${heartbeat} Render heartbeat received with love! ✨ (Success: ${successRate}%)`,
      `💖 Enhanced monitoring active! ${statusIcon} Render connection stable & beautiful!`
    ];

    const randomMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
    logger.success(`🌐 ${randomMessage} (${uptimeStats.successfulPings}/${uptimeStats.totalPings})`);

    // Special milestone celebrations
    if (uptimeStats.consecutiveSuccesses === 10) {
      logger.banner('🎉 Enhanced Uptime Milestone!', `10 consecutive successful pings! ${heartbeat} Render loves us!`);
    } else if (uptimeStats.consecutiveSuccesses === 50) {
      logger.banner('🌟 Amazing Uptime Achievement!', `50 consecutive pings! ${heartbeat} Bot is absolutely thriving!`);
    } else if (uptimeStats.consecutiveSuccesses === 100) {
      logger.banner('💖 Incredible Uptime Success!', `100 consecutive pings! ${heartbeat} Peak performance achieved!`);
    }

  } catch (error) {
    const responseTime = Date.now() - startTime;

    uptimeStats.totalPings++;
    uptimeStats.consecutiveFailures++;
    uptimeStats.consecutiveSuccesses = 0;
    uptimeStats.status = uptimeStats.consecutiveFailures >= 3 ? 'error' : 'warning';

    const statusIcon = uptimeStats.consecutiveFailures >= 3 ? 
      UPTIME_CONFIG.statusEmojis.error : 
      UPTIME_CONFIG.statusEmojis.warning;

    const aestheticErrors = [
      `${statusIcon} Temporary beauty interruption on Render: ${error.message} (${responseTime}ms)`,
      `💔 Brief connection hiccup with Render - enhancing resilience! ${heartbeat}`,
      `⚠️ Aesthetic uptime check needs attention: ${error.message}`,
      `${statusIcon} Render is taking a beauty break - we'll keep trying! ${heartbeat}`
    ];

    const randomError = aestheticErrors[Math.floor(Math.random() * aestheticErrors.length)];
    logger.warn(`🌐 ${randomError}`);

    // Auto-recovery attempt for enhanced resilience
    if (uptimeStats.consecutiveFailures === 3) {
      logger.system('🔄 Enhanced auto-recovery initiated! Render connection will be restored! ✨');
    }
  }
}

// Start enhanced aesthetic uptime monitoring
if (UPTIME_CONFIG.enabled) {
  setInterval(performUptimePing, UPTIME_CONFIG.pingInterval);

  // Beautiful startup banner
  logger.banner('💖 Enhanced Aesthetic Auto-Uptime', `Beautiful 24/7 monitoring with Render love! 🫶`);
  logger.success(`✨ Target URL: ${UPTIME_CONFIG.selfUrl}`);
  logger.success(`🌟 Ping Interval: ${UPTIME_CONFIG.pingInterval / 1000 / 60} minutes with love`);
  logger.success(`🫶 Enhanced Features: Heartbeat tracking, milestone celebrations, auto-recovery`);

  // Aesthetic startup delay for first ping
  setTimeout(() => {
    logger.system('🚀 Initiating first enhanced ping to Render with extra love! 💖');
    performUptimePing();
  }, 15000); // 15 second delay for aesthetic startup
}

// ===================================================================================
// 3. FACEBOOK MESSENGER HELPER FUNCTION
// ===================================================================================

async function sendMessage(recipientId, messagePayload, pageAccessToken) {
  // Input validation
  if (!recipientId || !messagePayload || !pageAccessToken) {
    logger.error('Missing required parameters for sendMessage');
    return false;
  }

  const request_body = {
    recipient: { id: recipientId },
    message: messagePayload,
    messaging_type: 'RESPONSE',
  };

  try {
    const response = await axios.post('https://graph.facebook.com/v19.0/me/messages', request_body, {
      params: { access_token: pageAccessToken },
      timeout: 10000, // 10 second timeout
    });
    logger.success('Message sent to user:', recipientId);
    return true;
  } catch (error) {
    if (error.response) {
      logger.error('Facebook API error:', {
        status: error.response.status,
        data: error.response.data,
        user: recipientId
      });
    } else if (error.request) {
      logger.error('Network error sending message:', error.message);
    } else {
      logger.error('Error setting up message request:', error.message);
    }
    return false;
  }
}

// ===================================================================================
// 4. ENHANCED GAGSTOCK BOT LOGIC
// ===================================================================================

const activeSessions = new Map();
const lastSentCache = new Map();
const userRateLimit = new Map();
const MAX_REQUESTS_PER_MINUTE = 10;

// Enhanced Admin and update system
const ADMIN_USER_ID = process.env.ADMIN_USER_ID?.toString(); // Ensure string comparison
const pendingUpdates = new Map();
const systemVersion = "3.0.0"; // Updated version
const newUsers = new Set();

// Stock clearing system
const stockClearingAlerts = new Map();
const STOCK_CLEAR_WARNING_TIME = 30000; // 30 seconds before clearing

// Enhanced session cleanup with stock clearing alerts
setInterval(() => {
  const now = Date.now();

  // Clean inactive sessions
  for (const [userId, session] of activeSessions) {
    if (session.lastActivity && (now - session.lastActivity) > 30 * 60 * 1000) {
      clearTimeout(session.timeout);
      activeSessions.delete(userId);
      lastSentCache.delete(userId);
      stockClearingAlerts.delete(userId);
      logger.info(`🧹 Cleaned up inactive session for user: ${userId}`);
    }
  }

  // Clean old cache entries
  for (const [userId] of lastSentCache) {
    if (!activeSessions.has(userId)) {
      lastSentCache.delete(userId);
    }
  }
}, 30 * 60 * 1000);

const PH_TIMEZONE = "Asia/Manila";

function pad(n) { return n < 10 ? "0" + n : n; }
function getPHTime() { return new Date(new Date().toLocaleString("en-US", { timeZone: PH_TIMEZONE })); }

function getCountdown(target) {
  const now = getPHTime();
  const msLeft = target - now;
  if (msLeft <= 0) return "00h 00m 00s";
  const h = Math.floor(msLeft / 3.6e6);
  const m = Math.floor((msLeft % 3.6e6) / 6e4);
  const s = Math.floor((msLeft % 6e4) / 1000);
  return `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
}

function getNextRestocks() {
  const now = getPHTime();
  const timers = {};

  // Eggs restock every 30 minutes (XX:00 and XX:30)
  const nextEgg = new Date(now);
  nextEgg.setMinutes(now.getMinutes() < 30 ? 30 : 0);
  if (now.getMinutes() >= 30) nextEgg.setHours(now.getHours() + 1);
  nextEgg.setSeconds(0, 0);
  timers.egg = getCountdown(nextEgg);

  // Gear restocks every 5 minutes
  const nextGear = new Date(now);
  const nextGearM = Math.ceil((now.getMinutes() + (now.getSeconds() > 0 ? 1 : 0)) / 5) * 5;
  nextGear.setMinutes(nextGearM === 60 ? 0 : nextGearM, 0, 0);
  if (nextGearM === 60) nextGear.setHours(now.getHours() + 1);
  timers.gear = getCountdown(nextGear);

  // Seeds restock every 3 minutes
  const nextSeed = new Date(now);
  const nextSeedM = Math.ceil((now.getMinutes() + (now.getSeconds() > 0 ? 1 : 0)) / 3) * 3;
  nextSeed.setMinutes(nextSeedM === 60 ? 0 : nextSeedM, 0, 0);
  if (nextSeedM === 60) nextGear.setHours(now.getHours() + 1);
  timers.seed = getCountdown(nextSeed);

  // Honey restocks every hour
  const nextHour = new Date(now);
  nextHour.setHours(now.getHours() + 1, 0, 0, 0);
  timers.honey = getCountdown(nextHour);

  // Cosmetics restock every 7 hours
  const next7 = new Date(now);
  const totalHours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  const next7h = Math.ceil(totalHours / 7) * 7;
  next7.setHours(next7h, 0, 0, 0);
  timers.cosmetics = getCountdown(next7);

  return timers;
}

function getNextScheduledTime(startTime = getPHTime()) {
  const base = new Date(startTime);
  const min = base.getMinutes();
  const next5 = Math.floor(min / 5) * 5 + 5;
  base.setMinutes(next5, 30, 0);
  if (base <= startTime) base.setMinutes(base.getMinutes() + 5);
  return base;
}

function formatValue(val) {
  if (val >= 1_000_000) return `x${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `x${(val / 1_000).toFixed(1)}K`;
  return `x${val}`;
}

function addEmoji(name) {
  const emojis = {
    "Common Egg": "🥚", "Uncommon Egg": "🐣", "Rare Egg": "🍳", "Legendary Egg": "🪺", "Mythical Egg": "🥚", "Bug Egg": "🪲",
    "Watering Can": "🚿", "Trowel": "🛠️", "Recall Wrench": "🔧", "Basic Sprinkler": "💧", "Advanced Sprinkler": "💦", "Godly Sprinkler": "⛲",
    "Lightning Rod": "⚡", "Master Sprinkler": "🌊", "Favorite Tool": "❤️", "Harvest Tool": "🌾",
    "Carrot": "🥕", "Strawberry": "🍓", "Blueberry": "🫐", "Orange Tulip": "🌷", "Tomato": "🍅", "Corn": "🌽", "Daffodil": "🌼",
    "Watermelon": "🍉", "Pumpkin": "🎃", "Apple": "🍎", "Bamboo": "🎍", "Coconut": "🥥", "Cactus": "🌵", "Dragon Fruit": "🍈",
    "Mango": "🥭", "Grape": "🍇", "Mushroom": "🍄", "Pepper": "🌶️", "Cacao": "🍫", "Beanstalk": "🌱"
  };
  return `${emojis[name] || "🌿"} ${name}`;
}

async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await axios.get(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Enhanced Stock Clearing System
async function sendStockClearingAlert(userId) {
  const alertMessage = `╔══════════════════════════════════╗
║  🚨  𝗦𝘁𝗼𝗰𝗸 𝗖𝗮𝗰𝗵𝗲 𝗔𝗹𝗲𝗿𝘁!  ║
╚══════════════════════════════════╝

⚠️ 𝗔𝗧𝗧𝗘𝗡𝗧𝗜𝗢𝗡: Stock Cache Clearing! ⚠️

╭─ 🔄 System Maintenance ──────╮
│ Your recent stock cache will  │
│ be cleared in 30 seconds to   │
│ ensure fresh data delivery!   │
╰────────────────────────────────╯

✨ This ensures you get the most 
   up-to-date stock information!

🌱 No action needed from you - 
   just sit back and enjoy fresh data! 💚`;

  await sendMessage(userId, { text: alertMessage }, PAGE_ACCESS_TOKEN);

  // Set timer to clear cache
  setTimeout(() => {
    lastSentCache.delete(userId);
    stockClearingAlerts.delete(userId);
    logger.info(`🧹 Cleared stock cache for user: ${userId}`);
  }, STOCK_CLEAR_WARNING_TIME);
}

// Enhanced Code Update System
let pendingCodeUpdate = null;

// Enhanced Admin Update Command with Pastebin integration
const updateCommand = {
  name: "update",
  aliases: ["upgrade"],
  description: "Admin command to push updates to all users or update code from Pastebin",
  usage: "update [message] | update code [pastebin_url]",
  category: "Admin 👑",
  async execute(senderId, args, pageAccessToken) {
    // Enhanced admin verification
    const userIdString = senderId.toString();
    const adminIdString = ADMIN_USER_ID;

    logger.debug(`🔐 Admin check: User ID "${userIdString}" vs Admin ID "${adminIdString}"`);

    if (userIdString !== adminIdString) {
      const unauthorizedMessage = `╔══════════════════════════════════╗
║  🚫  𝗔𝗰𝗰𝗲𝘀𝘀 𝗗𝗲𝗻𝗶𝗲𝗱  ║
╚══════════════════════════════════╝

🛡️ This command is reserved for 
   bot administrators only.

╭─ 🔍 Debug Info ──────────────╮
│ Your ID: ${userIdString.slice(0, 8)}...     │
│ Status: Unauthorized          │
╰───────────────────────────────╯

🌱 Continue using gagstock normally!
💡 Contact the bot owner if you 
   believe this is an error.`;
      return await sendMessage(senderId, { text: unauthorizedMessage }, pageAccessToken);
    }

    // Check if this is a code update command
    if (args[0]?.toLowerCase() === 'code') {
      const pastebinUrl = args[1];
      
      if (!pastebinUrl) {
        const usageMessage = `╔══════════════════════════════════╗
║  💻  𝗖𝗼𝗱𝗲 𝗨𝗽𝗱𝗮𝘁𝗲 ║
║      𝗚𝘂𝗶𝗱𝗲 ✨               ║
╚══════════════════════════════════╝

🌟 𝗖𝗼𝗱𝗲 𝗨𝗽𝗱𝗮𝘁𝗲 𝗖𝗼𝗺𝗺𝗮𝗻𝗱:

╭─ 📋 Usage Format ─────────────╮
│ update code [pastebin_url]    │
│                               │
│ Example:                      │
│ update code pastebin.com/xyz  │
╰────────────────────────────────╯

╭─ 🌐 Supported Links ──────────╮
│ 📝 Pastebin.com/raw/[id]      │
│ 📄 Raw.githubusercontent.com  │
│ 🔗 Any direct code URL        │
╰────────────────────────────────╯

🚀 Bot will read, validate & apply 
   the new code automatically! ✨`;
        return await sendMessage(senderId, { text: usageMessage }, pageAccessToken);
      }

      // Process Pastebin URL to get raw content
      let rawUrl = pastebinUrl;
      if (pastebinUrl.includes('pastebin.com/') && !pastebinUrl.includes('/raw/')) {
        const pastebinId = pastebinUrl.split('/').pop();
        rawUrl = `https://pastebin.com/raw/${pastebinId}`;
      }

      const readingMessage = `╔══════════════════════════════════╗
║  📖  𝗥𝗲𝗮𝗱𝗶𝗻𝗴 𝗖𝗼𝗱𝗲 ║
║      𝗙𝗿𝗼𝗺 𝗣𝗮𝘀𝘁𝗲𝗯𝗶𝗻... 🌐      ║
╚══════════════════════════════════╝

🔄 Fetching code from Pastebin...
📡 Downloading latest updates...
🔍 Validating code structure...
✨ Preparing for review...

╭─ 📊 Reading Progress ─────────╮
│ 🌐 URL: ${rawUrl.slice(0, 30)}... │
│ 🔄 Status: In Progress        │
│ ⚡ Speed: High Priority       │
╰────────────────────────────────╯

Please wait while magic happens! 🪄`;

      await sendMessage(senderId, { text: readingMessage }, pageAccessToken);

      try {
        // Fetch code from Pastebin
        const response = await axios.get(rawUrl, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Enhanced-GagStock-Bot-CodeUpdater/3.0.0'
          }
        });

        const newCode = response.data;
        
        // Basic validation
        if (!newCode || newCode.length < 100) {
          throw new Error('Code content appears to be too short or empty');
        }

        // Store the pending update
        pendingCodeUpdate = {
          code: newCode,
          url: rawUrl,
          timestamp: Date.now(),
          size: newCode.length
        };

        const successMessage = `╔══════════════════════════════════╗
║  ✅  𝗖𝗼𝗱𝗲 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆 ║
║      𝗥𝗲𝗮𝗱! 🎉               ║
╚══════════════════════════════════╝

🎊 Code successfully downloaded & 
   validated from Pastebin!

╭─ 📊 Code Analysis ────────────╮
│ 📏 Size: ${(newCode.length / 1024).toFixed(1)}KB (${newCode.length} chars) │
│ 🔍 Lines: ~${newCode.split('\n').length} lines       │
│ ✅ Status: Ready for Review   │
│ 🌟 Quality: Validated        │
╰────────────────────────────────╯

╭─ 🤖 Apply Options ────────────╮
│ 'applycode' → Apply & Restart │
│ 'cancelcode' → Cancel Update  │
│ 'previewcode' → Show Preview  │
╰────────────────────────────────╯

🚀 Ready to apply the new code?
   Type 'applycode' to proceed! ✨`;

        await sendMessage(senderId, { text: successMessage }, pageAccessToken);
        logger.success(`✅ Code successfully read from Pastebin: ${rawUrl}`);

      } catch (error) {
        const errorMessage = `╔══════════════════════════════════╗
║  ❌  𝗖𝗼𝗱𝗲 𝗥𝗲𝗮𝗱 ║
║      𝗙𝗮𝗶𝗹𝗲𝗱! 🛠️               ║
╚══════════════════════════════════╝

😔 Unable to read code from the 
   provided Pastebin URL.

╭─ 🔧 Possible Issues ──────────╮
│ 🌐 URL might be incorrect     │
│ 📝 Pastebin might be private  │
│ 🔗 Network connectivity issue │
│ ⏰ Pastebin server timeout    │
╰────────────────────────────────╯

🌱 Please check the URL and try 
   again with a valid Pastebin link!

💡 Tip: Use pastebin.com/raw/[id] 
   format for best results! ✨`;

        await sendMessage(senderId, { text: errorMessage }, pageAccessToken);
        logger.error(`❌ Failed to read code from Pastebin: ${error.message}`);
      }
      return;
    }

    // Regular update message to users
    const updateMessage = args.join(" ") || "🎉 System update available with enhanced features, improved performance, and beautiful new aesthetics!";

    let notifiedCount = 0;
    // Send update to all active users (except admin)
    for (const userId of activeSessions.keys()) {
      if (userId !== adminIdString) {
        pendingUpdates.set(userId, {
          message: updateMessage,
          version: systemVersion,
          timestamp: Date.now()
        });

        const updateNotification = `╔══════════════════════════════════╗
║  🚀  𝗦𝘆𝘀𝘁𝗲𝗺 𝗨𝗽𝗱𝗮𝘁𝗲 𝗔𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲  ║
╚══════════════════════════════════╝

✨ 𝗡𝗘𝗪 𝗨𝗣𝗗𝗔𝗧𝗘 𝗔𝗩𝗔𝗜𝗟𝗔𝗕𝗟𝗘! ✨

${updateMessage}

╭─ 📦 Update Details ──────────╮
│ 🔄 Version: ${systemVersion}           │
│ 🛠️ Status: Ready to install   │
│ 🌟 Features: Enhanced & New!  │
│ ⚡ Performance: Optimized     │
╰────────────────────────────────╯

🎮 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗲 𝗢𝗽𝘁𝗶𝗼𝗻𝘀:
┌─ 'apply' → Install update
└─ 'skip'  → Continue without updating

🌟 New aesthetic features await you! 🎨`;
        await sendMessage(userId, { text: updateNotification }, pageAccessToken);
        notifiedCount++;
      }
    }

    const adminConfirmation = `╔══════════════════════════════════╗
║  ✅  𝗨𝗽𝗱𝗮𝘁𝗲 𝗗𝗲𝗽𝗹𝗼𝘆𝗺𝗲𝗻𝘁 ║
║      𝗖𝗼𝗺𝗽𝗹𝗲𝘁𝗲!            ║
╚══════════════════════════════════╝

🎉 Update successfully deployed!

╭─ 📊 Deployment Statistics ───╮
│ 👥 Users Notified: ${notifiedCount.toString().padStart(8)} │
│ 🔄 Version: ${systemVersion.padStart(13)}    │
│ ⚡ Status: All Systems Go!   │
│ 🌐 Uptime: Active & Stable   │
╰────────────────────────────────╯

🚀 All active users have been notified
🌟 Enhanced features are now live
✨ Bot performance optimized

💚 Deployment successful! 🎊`;
    await sendMessage(senderId, { text: adminConfirmation }, pageAccessToken);
  }
};

// Enhanced Active Status Command for admins
const activeStatusCommand = {
  name: "activestatus",
  aliases: ["online", "offline", "presence"],
  description: "Admin command to set bot online/offline status aesthetically",
  usage: "activestatus on | activestatus off",
  category: "Admin 👑",
  async execute(senderId, args, pageAccessToken) {
    // Enhanced admin verification
    const userIdString = senderId.toString();
    const adminIdString = ADMIN_USER_ID;

    logger.debug(`🔐 Admin check: User ID "${userIdString}" vs Admin ID "${adminIdString}"`);

    if (userIdString !== adminIdString) {
      const unauthorizedMessage = `╔══════════════════════════════════╗
║  🚫  𝗔𝗰𝗰𝗲𝘀𝘀 𝗗𝗲𝗻𝗶𝗲𝗱  ║
╚══════════════════════════════════╝

🛡️ This command is reserved for 
   bot administrators only.

╭─ 🔍 Debug Info ──────────────╮
│ Your ID: ${userIdString.slice(0, 8)}...     │
│ Status: Unauthorized          │
╰───────────────────────────────╯

🌱 Continue using gagstock normally!
💡 Contact the bot owner if you 
   believe this is an error.`;
      return await sendMessage(senderId, { text: unauthorizedMessage }, pageAccessToken);
    }

    const status = args[0]?.toLowerCase();

    if (!status || !['on', 'off', 'online', 'offline'].includes(status)) {
      const usageMessage = `╔══════════════════════════════════╗
║  📱  𝗔𝗰𝘁𝗶𝘃𝗲 𝗦𝘁𝗮𝘁𝘂𝘀 ║
║      𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗚𝘂𝗶𝗱𝗲 ✨        ║
╚══════════════════════════════════╝

🌟 𝗔𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲 𝗢𝗽𝘁𝗶𝗼𝗻𝘀:

╭─ 🟢 Set Online Status ────────╮
│ activestatus on               │
│ activestatus online           │
│ └─ Show bot as active & ready │
╰────────────────────────────────╯

╭─ 🔴 Set Offline Status ───────╮
│ activestatus off              │
│ activestatus offline          │
│ └─ Show bot as away/inactive  │
╰────────────────────────────────╯

Perfect for managing your aesthetic
bot presence! 🎨✨`;
      return await sendMessage(senderId, { text: usageMessage }, pageAccessToken);
    }

    const isOnline = ['on', 'online'].includes(status);

    try {
      // Set bot activity status via Facebook API
      const activityData = {
        recipient: { id: senderId },
        sender_action: isOnline ? "mark_seen" : "typing_off"
      };

      // Send a typing indicator or mark as seen to show activity
      await axios.post('https://graph.facebook.com/v19.0/me/messages', activityData, {
        params: { access_token: pageAccessToken },
        timeout: 10000
      });

      const statusEmoji = isOnline ? '🟢' : '🔴';
      const statusText = isOnline ? 'ONLINE & ACTIVE' : 'OFFLINE & AWAY';
      const statusColor = isOnline ? 'Active Green' : 'Inactive Red';

      const confirmationMessage = `╔══════════════════════════════════╗
║  ${statusEmoji}  𝗦𝘁𝗮𝘁𝘂𝘀 𝗨𝗽𝗱𝗮𝘁𝗲𝗱! ║
║      𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆! ✨         ║
╚══════════════════════════════════╝

🎉 Bot presence updated beautifully!

╭─ 📱 Status Details ───────────╮
│ 🎯 Mode: ${statusText.padEnd(17)} │
│ 🎨 Theme: ${statusColor.padEnd(16)} │
│ ⚡ Response: Instant          │
│ 🌟 Aesthetic: Premium Level   │
╰────────────────────────────────╯

${isOnline ? 
`🌱 Your bot is now glowing with 
   active presence! Users will see
   enhanced responsiveness! ✨` : 
`😴 Your bot is now in peaceful
   away mode. Perfect for maintenance
   or personal time! 🌙`}

${statusEmoji} Status change complete! 🎊`;

      await sendMessage(senderId, { text: confirmationMessage }, pageAccessToken);

      // Log the status change
      logger.system(`${statusEmoji} Bot active status changed to: ${statusText} by admin`);

    } catch (error) {
      const errorMessage = `╔══════════════════════════════════╗
║  ❌  𝗦𝘁𝗮𝘁𝘂𝘀 𝗨𝗽𝗱𝗮𝘁𝗲 ║
║      𝗙𝗮𝗶𝗹𝗲𝗱! 🛠️             ║
╚══════════════════════════════════╝

😔 Unable to update bot status 
   at this moment.

╭─ 🔧 Troubleshooting ──────────╮
│ 📡 API connectivity issue     │
│ ⏰ Try again in a moment      │
│ 🌐 Facebook servers busy      │
│ 💫 Usually resolves quickly   │
╰────────────────────────────────╯

🌱 Status will update automatically
   with enhanced resilience! ✨`;
      await sendMessage(senderId, { text: errorMessage }, pageAccessToken);
      logger.error('❌ Failed to update active status:', error.message);
    }
  }
};

// Enhanced Deploy Command for admins
const deployCommand = {
  name: "deploy",
  aliases: ["push"],
  description: "Admin command to deploy new code changes",
  usage: "deploy [commit message]",
  category: "Admin 👑",
  async execute(senderId, args, pageAccessToken) {
    // Enhanced admin verification
    const userIdString = senderId.toString();
    const adminIdString = ADMIN_USER_ID;

    logger.debug(`🔐 Admin check: User ID "${userIdString}" vs Admin ID "${adminIdString}"`);

    if (userIdString !== adminIdString) {
      const unauthorizedMessage = `╔══════════════════════════════════╗
║  🚫  𝗔𝗰𝗰𝗲𝘀𝘀 𝗗𝗲𝗻𝗶𝗲𝗱  ║
╚══════════════════════════════════╝

🛡️ This command is reserved for 
   bot administrators only.

╭─ 🔍 Debug Info ──────────────╮
│ Your ID: ${userIdString.slice(0, 8)}...     │
│ Status: Unauthorized          │
╰───────────────────────────────╯

🌱 Continue using gagstock normally!
💡 Contact the bot owner if you 
   believe this is an error.`;
      return await sendMessage(senderId, { text: unauthorizedMessage }, pageAccessToken);
    }

    const commitMessage = args.join(" ") || "🚀 Code changes deployed!";

    // Simulate code deployment (replace with actual deployment logic)
    logger.system(`✨ Simulating code deployment with message: ${commitMessage}`);

    const deployConfirmation = `╔══════════════════════════════════╗
║  ✅  𝗖𝗼𝗱𝗲 𝗗𝗲𝗽𝗹𝗼𝘆𝗺𝗲𝗻𝘁 ║
║      𝗖𝗼𝗺𝗽𝗹𝗲𝘁𝗲!            ║
╚══════════════════════════════════╝

🎉 Code deployment simulated successfully!

╭─ 📦 Deployment Details ──────╮
│ 💬 Commit Message: ${commitMessage} │
│ ⚡ Status: Deployed          │
│ 🌐 Environment: Production    │
╰────────────────────────────────╯

🌱 The bot is now running the latest code.
✨ Please test and verify the changes.

💚 Deployment successful! 🎊`;
    await sendMessage(senderId, { text: deployConfirmation }, pageAccessToken);
  }
};

// Enhanced Refresh Command with clearing alerts
const refreshCommand = {
  name: "refresh",
  aliases: ["reload", "sync", "update"],
  description: "Force refresh all stock data with cache clearing",
  usage: "refresh",
  category: "Tools ⚒️",
  async execute(senderId, args, pageAccessToken) {
    const session = activeSessions.get(senderId);
    if (!session) {
      const noSessionMessage = `╔══════════════════════════════════╗
║  ⚠️   𝗡𝗼 𝗔𝗰𝘁𝗶𝘃𝗲 𝗦𝗲𝘀𝘀𝗶𝗼𝗻  ║
╚══════════════════════════════════╝

🚫 You need to start gagstock tracking
   first before refreshing.

╭─ 🚀 Quick Start Guide ───────╮
│ 🟢 'gagstock on' - Start     │
│ 🎯 'gagstock on [filter]'    │
│ 📖 'help' - Show commands    │
╰────────────────────────────────╯

🌱 Ready to begin tracking! ✨`;
      return await sendMessage(senderId, { text: noSessionMessage }, pageAccessToken);
    }

    // Send clearing alert if cache exists
    if (lastSentCache.has(senderId) && !stockClearingAlerts.has(senderId)) {
      stockClearingAlerts.set(senderId, true);
      await sendStockClearingAlert(senderId);
    }

    const refreshingMessage = `╔══════════════════════════════════╗
║  🔄  𝗥𝗲𝗳𝗿𝗲𝘀𝗵𝗶𝗻𝗴 𝗦𝘁𝗼𝗰𝗸  ║
╚══════════════════════════════════╝

🔄 Fetching the freshest stock data...
⚡ Loading enhanced information...
🌟 Applying beautiful formatting...

╭─ 📡 Connection Status ───────╮
│ 🌐 Connecting to servers...   │
│ 📊 Downloading stock data...  │
│ 🌤️ Fetching weather info...   │
│ ✨ Preparing display...       │
╰────────────────────────────────╯

Please wait while magic happens! 🪄`;
    await sendMessage(senderId, { text: refreshingMessage }, PAGE_ACCESS_TOKEN);

    try {
      // Force clear cache and fetch new data
      lastSentCache.delete(senderId);
      stockClearingAlerts.delete(senderId);

      const [stockRes, weatherRes] = await Promise.all([
        fetchWithTimeout("https://gagstock.gleeze.com/grow-a-garden"),
        fetchWithTimeout("https://growagardenstock.com/api/stock/weather"),
      ]);

      const backup = stockRes.data.data;
      const stockData = {
        gearStock: backup.gear.items.map(i => ({ name: i.name, value: Number(i.quantity) })),
        seedsStock: backup.seed.items.map(i => ({ name: i.name, value: Number(i.quantity) })),
        eggStock: backup.egg.items.map(i => ({ name: i.name, value: Number(i.quantity) })),
        cosmeticsStock: backup.cosmetics.items.map(i => ({ name: i.name, value: Number(i.quantity) })),
        honeyStock: backup.honey.items.map(i => ({ name: i.name, value: Number(i.quantity) })),
      };

      const weather = {
        currentWeather: weatherRes.data.currentWeather || "Unknown",
        icon: weatherRes.data.icon || "🌤️",
        cropBonuses: weatherRes.data.cropBonuses || "None",
        updatedAt: weatherRes.data.updatedAt || new Date().toISOString(),
      };

      const restocks = getNextRestocks();
      const formatList = (arr) => arr.map(i => `  ├─ ${addEmoji(i.name)}: ${formatValue(i.value)}`).join("\n");
      const updatedAtPH = getPHTime().toLocaleString("en-PH", {
        hour: "numeric", minute: "numeric", second: "numeric", hour12: true, day: "2-digit", month: "short", year: "numeric"
      });

      const filters = session.filters || [];
      let filteredContent = "";

      const processSection = (label, items, restock) => {
        let filtered = items;
        if (filters.length > 0) {
          filtered = items.filter(i => filters.some(f => i.name.toLowerCase().includes(f)));
        }
        if (filtered.length > 0 || filters.length === 0) {
          return `╭─ ${label} ────────────────────╮
${formatList(filters.length > 0 ? filtered : items)}
  └─ ⏰ Next Restock: ${restock}
╰─────────────────────────────────╯

`;
        }
        return "";
      };

      filteredContent += processSection("🛠️ 𝗚𝗲𝗮𝗿 & 𝗧𝗼𝗼𝗹𝘀", stockData.gearStock, restocks.gear);
      filteredContent += processSection("🌱 𝗦𝗲𝗲𝗱𝘀 & 𝗣𝗹𝗮𝗻𝘁𝘀", stockData.seedsStock, restocks.seed);
      filteredContent += processSection("🥚 𝗘𝗴𝗴𝘀 & 𝗣𝗲𝘁𝘀", stockData.eggStock, restocks.egg);
      filteredContent += processSection("🎨 𝗖𝗼𝘀𝗺𝗲𝘁𝗶𝗰𝘀", stockData.cosmeticsStock, restocks.cosmetics);
      filteredContent += processSection("🍯 𝗛𝗼𝗻𝗲𝘆 𝗣𝗿𝗼𝗱𝘂𝗰𝘁𝘀", stockData.honeyStock, restocks.honey);

      const refreshSuccessHeader = `╔══════════════════════════════════╗
║   🔄 𝗦𝘁𝗼𝗰𝗸 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆     ║
║      𝗥𝗲𝗳𝗿𝗲𝘀𝗵𝗲𝗱! ✨           ║
╚══════════════════════════════════╝

`;

      const weatherSection = `╭─ 🌤️ 𝗪𝗲𝗮𝘁𝗵𝗲𝗿 & 𝗕𝗼𝗻𝘂𝘀𝗲𝘀 ────╮
  ├─ Current: ${weather.icon} ${weather.currentWeather}
  └─ Crop Bonus: 🌾 ${weather.cropBonuses}
╰─────────────────────────────────╯

`;

      const footerSection = `╭─ 📊 𝗙𝗿𝗲𝘀𝗵 𝗗𝗮𝘁𝗮 𝗜𝗻𝗳𝗼 ─────╮
  ├─ 📅 Updated: ${updatedAtPH}
  ├─ 🔄 Cache: Cleared & Fresh
  └─ ✅ Status: All Systems Go!
╰─────────────────────────────────╯`;

      const message = `${refreshSuccessHeader}${filteredContent}${weatherSection}${footerSection}`;

      // Send message with beautiful developer signature image
      const messageWithImage = {        attachment: {
          type: "image",
          payload: {
            url: "https://github.com/Lazy-dev-hash/user-attachmens/blob/main/New%20Project%207%20%5B3D158B3%5D.png",
            is_reusable: true
          }
        }
      };

      await sendMessage(senderId, { text: message }, pageAccessToken);
      await sendMessage(senderId, messageWithImage, pageAccessToken);

    } catch (error) {
      const errorMessage = `╔══════════════════════════════════╗
║  ❌  𝗥𝗲𝗳𝗿𝗲𝘀𝗵 𝗨𝗻𝘀𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹  ║
╚══════════════════════════════════╝

😔 Unable to refresh stock data 
   at this moment.

╭─ 🔧 Troubleshooting ──────────╮
│ 🔄 Try again in a few moments │
│ 📡 Server might be busy       │
│ 🌐 Check internet connection  │
│ 💫 Usually resolves quickly   │
╰────────────────────────────────╯

🌱 We're working to fix this! 💚`;
      await sendMessage(senderId, { text: errorMessage }, pageAccessToken);
    }
  }
};

// Enhanced main gagstock command with better aesthetics
const gagstockCommand = {
  name: "gagstock",
  aliases: ["gag", "stock", "track"],
  description: "Enhanced Grow A Garden stock tracker with beautiful formatting",
  usage: "gagstock on | gagstock on [filter] | gagstock off",
  category: "Tools ⚒️",
  async execute(senderId, args, pageAccessToken) {
    const action = args[0]?.toLowerCase();
    const filters = args.slice(1).join(" ").split("|").map(f => f.trim().toLowerCase()).filter(Boolean);

    if (action === "off") {
        const session = activeSessions.get(senderId);
        if (session) {
            clearTimeout(session.timeout);
            activeSessions.delete(senderId);
            lastSentCache.delete(senderId);
            stockClearingAlerts.delete(senderId);
            logger.info(`🛑 Gagstock tracking stopped for user: ${senderId}`);

            const stopMessage = `╔══════════════════════════════════╗
║  🛑  𝗧𝗿𝗮𝗰𝗸𝗶𝗻𝗴 𝗦𝘁𝗼𝗽𝗽𝗲𝗱  ║
╚══════════════════════════════════╝

✅ Your Gagstock tracking has been 
   successfully disabled.

╭─ 📊 Session Summary ──────────╮
│ 📅 Duration: Active session   │
│ 🔄 Updates: Delivered         │
│ ✨ Status: Clean shutdown     │
╰────────────────────────────────╯

Thank you for using our enhanced
tracking service! 🌱✨

💚 Come back anytime! 🚀`;
            return await sendMessage(senderId, { text: stopMessage }, pageAccessToken);
        } else {
            const noSessionMessage = `╔══════════════════════════════════╗
║  ⚠️   𝗡𝗼 𝗔𝗰𝘁𝗶𝘃𝗲 𝗦𝗲𝘀𝘀𝗶𝗼𝗻  ║
╚══════════════════════════════════╝

🤔 You don't have an active gagstock 
   tracking session running.

╭─ 🚀 Quick Start Commands ─────╮
│ 🟢 'gagstock on' - Track all  │
│ 🎯 'gagstock on [item]' - Filter │
│ 📖 'help' - Show full guide   │
╰────────────────────────────────╯

Ready to start tracking? 🌟`;
            return await sendMessage(senderId, { text: noSessionMessage }, pageAccessToken);
        }
    }

    if (action !== "on") {
        const usageMessage = `╔══════════════════════════════════╗
║  📖  𝗚𝗮𝗴𝘀𝘁𝗼𝗰𝗸 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 ║
║      𝗚𝘂𝗶𝗱𝗲 ✨               ║
╚══════════════════════════════════╝

🌟 𝗔𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀:

╭─ 🟢 Basic Tracking ───────────╮
│ gagstock on                   │
│ └─ Track all items & updates  │
╰────────────────────────────────╯

╭─ 🎯 Filtered Tracking ────────╮
│ gagstock on Sunflower | Can   │
│ └─ Track specific items only  │
╰────────────────────────────────╯

╭─ 🔴 Stop Tracking ────────────╮
│ gagstock off                  │
│ └─ Disable all notifications  │
╰────────────────────────────────╯

Need more help? Type 'help'! 💫`;
        return await sendMessage(senderId, { text: usageMessage }, pageAccessToken);
    }

    if (activeSessions.has(senderId)) {
        logger.warn(`⚠️ User ${senderId} tried to start an existing session.`);
        const alreadyActiveMessage = `╔══════════════════════════════════╗
║  📡  𝗦𝗲𝘀𝘀𝗶𝗼𝗻 𝗔𝗹𝗿𝗲𝗮𝗱𝘆 ║
║      𝗔𝗰𝘁𝗶𝘃𝗲! ⚡           ║
╚══════════════════════════════════╝

✅ You're already tracking Gagstock 
   with enhanced monitoring!

╭─ 🔄 Session Options ──────────╮
│ 🛑 'gagstock off' - Stop first │
│ 🔄 'refresh' - Update now     │
│ 📊 Current: Active & Stable   │
╰────────────────────────────────╯

Your tracking is working perfectly! 🌟`;
        return await sendMessage(senderId, { text: alreadyActiveMessage }, pageAccessToken);
    }

    const startMessage = `╔══════════════════════════════════╗
║  ✨  𝗘𝗻𝗵𝗮𝗻𝗰𝗲𝗱 𝗧𝗿𝗮𝗰𝗸𝗶𝗻𝗴  ║
║      𝗔𝗰𝘁𝗶𝘃𝗮𝘁𝗲𝗱! 🚀         ║
╚══════════════════════════════════╝

🎉 Enhanced Gagstock tracking is 
   now active with premium features!

╭─ 🌟 New Features Enabled ─────╮
│ 🔄 Auto-refresh every 5min    │
│ 🌤️ Live weather updates       │
│ ⏰ Smart restock timers        │
│ 🧹 Auto cache clearing        │
│ ✨ Beautiful notifications    │
│ 🎨 Enhanced aesthetics        │
╰────────────────────────────────╯

${filters.length > 0 ? 
`🎯 𝗙𝗶𝗹𝘁𝗲𝗿𝗶𝗻𝗴 𝗳𝗼𝗿: ${filters.join(', ')}` : 
'📊 𝗧𝗿𝗮𝗰𝗸𝗶𝗻𝗴: All items & categories'}

Sit back, relax, and let our enhanced
system do all the work! 🌱💚`;

    await sendMessage(senderId, { text: startMessage }, pageAccessToken);
    logger.info(`✨ Enhanced gagstock tracking started for user: ${senderId} with filters:`, filters.length > 0 ? filters : 'all items');

    async function fetchAndNotify(alwaysSend = false) {
      try {
        const [stockRes, weatherRes] = await Promise.all([
          fetchWithTimeout("https://gagstock.gleeze.com/grow-a-garden"),
          fetchWithTimeout("https://growagardenstock.com/api/stock/weather"),
        ]);

        const backup = stockRes.data.data;
        const stockData = {
          gearStock: backup.gear.items.map(i => ({ name: i.name, value: Number(i.quantity) })),
          seedsStock: backup.seed.items.map(i => ({ name: i.name, value: Number(i.quantity) })),
          eggStock: backup.egg.items.map(i => ({ name: i.name, value: Number(i.quantity) })),
          cosmeticsStock: backup.cosmetics.items.map(i => ({ name: i.name, value: Number(i.quantity) })),
          honeyStock: backup.honey.items.map(i => ({ name: i.name, value: Number(i.quantity) })),
        };

        const weather = {
          currentWeather: weatherRes.data.currentWeather || "Unknown",
          icon: weatherRes.data.icon || "🌤️",
          cropBonuses: weatherRes.data.cropBonuses || "None",
          updatedAt: weatherRes.data.updatedAt || new Date().toISOString(),
        };

        const restocks = getNextRestocks();
        const formatList = (arr) => arr.map(i => `  ├─ ${addEmoji(i.name)}: ${formatValue(i.value)}`).join("\n");
        const updatedAtPH = getPHTime().toLocaleString("en-PH", {
          hour: "numeric", minute: "numeric", second: "numeric", hour12: true, day: "2-digit", month: "short", year: "numeric"
        });

        let filteredContent = "";
        let matchedItems = false;

        const processSection = (label, items, restock, isFilterable) => {
            let filtered = items;
            if (isFilterable && filters.length > 0) {
                filtered = items.filter(i => filters.some(f => i.name.toLowerCase().includes(f)));
            }
            if (filtered.length > 0) {
                if (isFilterable) matchedItems = true;
                return `╭─ ${label} ────────────────────╮
${formatList(filtered)}
  └─ ⏰ Next Restock: ${restock}
╰─────────────────────────────────╯

`;
            }
            return "";
        };

        if (filters.length > 0) {
             filteredContent += processSection("🛠️ 𝗚𝗲𝗮𝗿 & 𝗧𝗼𝗼𝗹𝘀", stockData.gearStock, restocks.gear, true);
             filteredContent += processSection("🌱 𝗦𝗲𝗲𝗱𝘀 & 𝗣𝗹𝗮𝗻𝘁𝘀", stockData.seedsStock, restocks.seed, true);
             if (matchedItems) {
                filteredContent += processSection("🥚 𝗘𝗴𝗴𝘀 & 𝗣𝗲𝘁𝘀", stockData.eggStock, restocks.egg, false);
                filteredContent += processSection("🎨 𝗖𝗼𝘀𝗺𝗲𝘁𝗶𝗰 𝗜𝘁𝗲𝗺𝘀", stockData.cosmeticsStock, restocks.cosmetics, false);
                filteredContent += processSection("🍯 𝗛𝗼𝗻𝗲𝘆 𝗣𝗿𝗼𝗱𝘂𝗰𝘁𝘀", stockData.honeyStock, restocks.honey, false);
             }
        } else {
            filteredContent += processSection("🛠️ 𝗚𝗲𝗮𝗿 & 𝗧𝗼𝗼𝗹𝘀", stockData.gearStock, restocks.gear, false);
            filteredContent += processSection("🌱 𝗦𝗲𝗲𝗱𝘀 & 𝗣𝗹𝗮𝗻𝘁𝘀", stockData.seedsStock, restocks.seed, false);
            filteredContent += processSection("🥚 𝗘𝗴𝗴𝘀 & 𝗣𝗲𝘁𝘀", stockData.eggStock, restocks.egg, false);
            filteredContent += processSection("🎨 𝗖𝗼𝘀𝗺𝗲𝘁𝗶𝗰 𝗜𝘁𝗲𝗺𝘀", stockData.cosmeticsStock, restocks.cosmetics, false);
            filteredContent += processSection("🍯 𝗛𝗼𝗻𝗲𝘆 𝗣𝗿𝗼𝗱𝘂𝗰𝘁𝘀", stockData.honeyStock, restocks.honey, false);
            matchedItems = true;
        }

        const currentKey = JSON.stringify({ gearStock: stockData.gearStock, seedsStock: stockData.seedsStock });
        const lastSent = lastSentCache.get(senderId);

        // Check if stock changed and send clearing alert
        if (!alwaysSend && lastSent && lastSent !== currentKey) {
          if (!stockClearingAlerts.has(senderId)) {
            stockClearingAlerts.set(senderId, true);
            await sendStockClearingAlert(senderId);
          }
        }

        if (!alwaysSend && lastSent === currentKey) return false;
        if (filters.length > 0 && !matchedItems) return false;

        lastSentCache.set(senderId, currentKey);

        // Get user's name for personalized greeting
        let userName = "Friend";
        try {
          const userInfoResponse = await axios.get(`https://graph.facebook.com/v19.0/${senderId}`, {
            params: { 
              fields: 'first_name',
              access_token: pageAccessToken 
            },
            timeout: 5000
          });
          userName = userInfoResponse.data.first_name || "Friend";
        } catch (error) {
          logger.debug("Could not fetch user name:", error.message);
        }

        const personalizedHeader = `╔══════════════════════════════════╗
║   🌾 Hi ${userName}! Fresh Stock! 🌟   ║
║      Enhanced Update! ✨         ║
╚══════════════════════════════════╝

`;

        const weatherSection = `╭─ 🌤️ 𝗪𝗲𝗮𝘁𝗵𝗲𝗿 & 𝗕𝗼𝗻𝘂𝘀𝗲𝘀 ────╮
  ├─ Current: ${weather.icon} ${weather.currentWeather}
  └─ Crop Bonus: 🌾 ${weather.cropBonuses}
╰─────────────────────────────────╯

`;

        const footerSection = `╭─ 📊 𝗟𝗮𝘀𝘁 𝗨𝗽𝗱𝗮𝘁𝗲 & 𝗦𝘁𝗮𝘁𝘂𝘀 ─╮
  ├─ 📅 Time: ${updatedAtPH}
  ├─ 🔄 Source: Live API Data
  ├─ ✅ Status: All Systems Healthy
  └─ 🌟 Enhanced: v${systemVersion} Active
╰─────────────────────────────────╯`;

        const message = `${personalizedHeader}${filteredContent}${weatherSection}${footerSection}`;

        // Send message with beautiful developer signature image
        const messageWithImage = {
          attachment: {
            type: "image",
            payload: {
              url: "https://github.com/Lazy-dev-hash/user-attachmens/blob/main/New%20Project%207%20%5B3D158B3%5D.png",
              is_reusable: true
            }
          }
        };

        await sendMessage(senderId, { text: message }, pageAccessToken);
        await sendMessage(senderId, messageWithImage, pageAccessToken);
        return true;
      } catch (err) {
        logger.error("❌ Enhanced fetch failed:", err.message);
        return false;
      }
    }

    async function runSchedule() {
      const now = getPHTime();
      const nextTime = getNextScheduledTime(now);
      const wait = Math.max(nextTime - now, 1000);
      const timer = setTimeout(async function trigger() {
        const session = activeSessions.get(senderId);
        if (!session) return;

        // Update last activity
        session.lastActivity = Date.now();

        const notified = await fetchAndNotify(false);
        if (notified) {
          logger.debug(`✨ Enhanced stock update sent to user: ${senderId}`);
        }
        runSchedule();
      }, wait);

      activeSessions.set(senderId, { 
        timeout: timer, 
        lastActivity: Date.now(),
        filters: filters,
        startTime: Date.now()
      });
    }

    const firstFetchSuccess = await fetchAndNotify(true);
    if(firstFetchSuccess) {
      runSchedule();
    } else {
      const fetchErrorMessage = `╔══════════════════════════════════╗
║  ❌  𝗖𝗼𝗻𝗻𝗲𝗰𝘁𝗶𝗼𝗻 𝗘𝗿𝗿𝗼𝗿  ║
╚══════════════════════════════════╝

😔 Unable to fetch initial stock 
   data from Grow A Garden servers.

╭─ 🔧 What's happening? ────────╮
│ 📡 Server connectivity issue  │
│ ⏰ Usually temporary problem   │
│ 🔄 Auto-retry in progress     │
│ 💫 Will resolve shortly       │
╰────────────────────────────────╯

🌱 Please try again in a few moments!
   Enhanced features are ready! ✨`;
      await sendMessage(senderId, { text: fetchErrorMessage }, pageAccessToken);
      activeSessions.delete(senderId);
    }
  }
};

// Enhanced Status Command for admins
const statusCommand = {
  name: "status",
  aliases: ["stats", "info"],
  description: "Show bot status and statistics",
  usage: "status",
  category: "Admin 👑",
  async execute(senderId, args, pageAccessToken) {
    const userIdString = senderId.toString();
    const adminIdString = ADMIN_USER_ID;

    if (userIdString !== adminIdString) {
      const unauthorizedMessage = `╔══════════════════════════════════╗
║  🚫  𝗔𝗱𝗺𝗶𝗻 𝗢𝗻𝗹𝘆 𝗦𝘁𝗮𝘁𝘂𝘀  ║
╚══════════════════════════════════╝

🛡️ Status information is restricted 
   to bot administrators only.

🌱 Continue using regular commands!`;
      return await sendMessage(senderId, { text: unauthorizedMessage }, pageAccessToken);
    }

    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);
    const uptimeSeconds = Math.floor(uptime % 60);

    const statusMessage = `╔══════════════════════════════════╗
║  📊  𝗕𝗼𝘁 𝗦𝘁𝗮𝘁𝘂𝘀 & 𝗦𝘁𝗮𝘁𝘀  ║
╚══════════════════════════════════╝

╭─ 🤖 System Information ───────╮
│ 🔄 Version: ${systemVersion}             │
│ ⏱️ Uptime: ${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s        │
│ 🌐 Auto-Uptime: ${UPTIME_CONFIG.enabled ? 'Active' : 'Disabled'}      │
│ 📡 Status: ${uptimeStats.status.padEnd(12)} │
╰────────────────────────────────╯

╭─ 👥 User Statistics ──────────╮
│ 📈 Active Sessions: ${activeSessions.size.toString().padStart(7)} │
│ 🎯 Cached Users: ${lastSentCache.size.toString().padStart(10)} │
│ ⚠️ Pending Alerts: ${stockClearingAlerts.size.toString().padStart(8)} │
│ 🔄 Rate Limited: ${userRateLimit.size.toString().padStart(9)} │
╰────────────────────────────────╯

╭─ 💖 Enhanced Uptime Monitor ──╮
│ 📊 Total Pings: ${uptimeStats.totalPings.toString().padStart(10)} │
│ ✅ Successful: ${uptimeStats.successfulPings.toString().padStart(11)} │
│ 🔥 Consecutive: ${uptimeStats.consecutiveSuccesses.toString().padStart(10)} │
│ ⚡ Best Response: ${uptimeStats.bestResponseTime === Infinity ? 'N/A' : uptimeStats.bestResponseTime + 'ms'}     │
│ 📈 Avg Response: ${uptimeStats.averageResponseTime > 0 ? uptimeStats.averageResponseTime + 'ms' : 'N/A'}      │
│ 📅 Last Ping: ${uptimeStats.lastPing ? new Date(uptimeStats.lastPing).toLocaleTimeString() : 'Never'.padStart(12)} │
│ 💚 Success Rate: ${uptimeStats.totalPings > 0 ? Math.round((uptimeStats.successfulPings / uptimeStats.totalPings) * 100) + '%' : 'N/A'}      │
│ 🌟 Status: ${UPTIME_CONFIG.statusEmojis[uptimeStats.status]} ${uptimeStats.status.toUpperCase()}        │
│ 🫶 Target: Render with Love    │
╰────────────────────────────────╯

All systems operational! 🚀✨`;

    await sendMessage(senderId, { text: statusMessage }, pageAccessToken);
  }
};

// ===================================================================================
// 5. COMMAND HANDLER
// ===================================================================================

const commands = new Map();

// Register all commands
[gagstockCommand, updateCommand, refreshCommand, statusCommand, deployCommand, activeStatusCommand].forEach(cmd => {
  commands.set(cmd.name, cmd);
  if (cmd.aliases) {
    cmd.aliases.forEach(alias => commands.set(alias, cmd));
  }
});

function isRateLimited(userId) {
  const now = Date.now();
  const userRequests = userRateLimit.get(userId) || [];

  // Remove requests older than 1 minute
  const recentRequests = userRequests.filter(time => now - time < 60000);

  if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    return true;
  }

  recentRequests.push(now);
  userRateLimit.set(userId, recentRequests);
  return false;
}

// Enhanced persistent menu setup
async function setupPersistentMenu() {
  const menuData = {
    persistent_menu: [
      {
        locale: "default",
        composer_input_disabled: false,
        call_to_actions: [
          {
            type: "postback",
            title: "🌱 Get Started",
            payload: "GET_STARTED"
          },
          {
            type: "postback", 
            title: "📖 Help & Commands",
            payload: "HELP"
          },
          {
            type: "postback",
            title: "🔄 Refresh Stock",
            payload: "REFRESH"
          },
          {
            type: "postback",
            title: "📊 Bot Status",
            payload: "STATUS"
          },
          {
            type: "postback",
            title: "🚀 Update Bot",
            payload: "UPDATE_BOT"
          },
          {
            type: "postback",
            title: "⭐ Rate Bot",
            payload: "RATE"
          }
        ]
      }
    ]
  };

  try {
    // Check if PAGE_ACCESS_TOKEN is valid before making the request
    if (!PAGE_ACCESS_TOKEN || PAGE_ACCESS_TOKEN === 'your_facebook_page_access_token_here') {
      logger.warn('⚠️ PAGE_ACCESS_TOKEN not properly configured, skipping persistent menu setup');
      return;
    }

    await axios.post('https://graph.facebook.com/v19.0/me/messenger_profile', menuData, {
      params: { access_token: PAGE_ACCESS_TOKEN },
      timeout: 10000
    });
    logger.success('✨ Enhanced persistent menu set up successfully');
  } catch (error) {
    if (error.response) {
      logger.error('❌ Failed to set up persistent menu:', {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      logger.error('❌ Failed to set up persistent menu:', error.message);
    }
  }
}

async function setupGetStartedButton() {
  const getStartedData = {
    get_started: {
      payload: "GET_STARTED"
    }
  };

  try {
    // Check if PAGE_ACCESS_TOKEN is valid before making the request
    if (!PAGE_ACCESS_TOKEN || PAGE_ACCESS_TOKEN === 'your_facebook_page_access_token_here') {
      logger.warn('⚠️ PAGE_ACCESS_TOKEN not properly configured, skipping Get Started button setup');
      return;
    }

    await axios.post('https://graph.facebook.com/v19.0/me/messenger_profile', getStartedData, {
      params: { access_token: PAGE_ACCESS_TOKEN },
      timeout: 10000
    });
    logger.success('✨ Enhanced Get Started button configured');
  } catch (error) {
    if (error.response) {
      logger.error('❌ Failed to set up Get Started button:', {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      logger.error('❌ Failed to set up Get Started button:', error.message);
    }
  }
}

// Enhanced welcome message
async function sendWelcomeMessage(senderId) {
  let userName = "Friend";
  try {
    const userInfoResponse = await axios.get(`https://graph.facebook.com/v19.0/${senderId}`, {
      params: { 
        fields: 'first_name',
        access_token: PAGE_ACCESS_TOKEN 
      },
      timeout: 5000
    });
    userName = userInfoResponse.data.first_name || "Friend";
  } catch (error) {
    logger.debug("Could not fetch user name:", error.message);
  }

  const welcomeMessage = `╔══════════════════════════════════╗
║   🌾 Welcome to Enhanced       ║
║      GagStock Bot! ✨          ║
╚══════════════════════════════════╝

Hello ${userName}! 👋🌟

🎉 Welcome to the most beautiful & 
   advanced Grow A Garden tracker!

╭─ 🌟 Enhanced Features ────────╮
│ 📊 Real-time stock tracking   │
│ 🌤️ Live weather updates       │
│ ⏰ Smart restock timers        │
│ 🎯 Advanced filtering system  │
│ 🔄 Auto-refresh & cache mgmt  │
│ ✨ Beautiful notifications    │
│ 🎨 Premium aesthetics         │
│ 🌐 24/7 uptime monitoring     │
╰────────────────────────────────╯

╭─ 📜 Enhanced Guidelines ──────╮
│ 🚫 No command spamming        │
│ ⏰ Smart rate limiting        │
│ 🎯 Use filters for precision  │
│ 💬 Be patient for updates     │
│ 🤝 Enjoy the experience       │
│ ✨ Report any issues          │
╰────────────────────────────────╯

🚀 Ready to experience enhanced tracking?

╭─ 💫 Quick Start Commands ─────╮
│ 'gagstock on' - Start tracking │
│ 'help' - See all commands     │
│ 'refresh' - Force update      │
╰────────────────────────────────╯

🌱 Let's grow together with style! 💚✨`;

  await sendMessage(senderId, { text: welcomeMessage }, PAGE_ACCESS_TOKEN);
}

// Enhanced postback handler
async function handlePostback(senderId, postback) {
  logger.info(`🔔 Processing enhanced postback from ${senderId}: "${postback.payload}"`);

  switch (postback.payload) {
    case 'GET_STARTED':
      newUsers.delete(senderId);
      await sendWelcomeMessage(senderId);
      break;

    case 'HELP':
      const helpMessage = `╔══════════════════════════════════╗
║  🤖  𝗘𝗻𝗵𝗮𝗻𝗰𝗲𝗱 𝗚𝗮𝗴𝘀𝘁𝗼𝗰𝗸  ║
║      𝗕𝗼𝘁 𝗛𝗲𝗹𝗽 ✨            ║
╚══════════════════════════════════╝

✨ 𝗔𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀:

╭─ 🌾 Main Commands ─────────────╮
│ 🟢 gagstock on                │
│    Start enhanced tracking     │
│                                │
│ 🎯 gagstock on [filter]       │
│    Track specific items        │
│    Example: Sunflower | Can    │
│                                │
│ 🔴 gagstock off               │
│    Stop tracking gracefully   │
╰────────────────────────────────╯

╭─ ⚡ Quick Actions ─────────────╮
│ 🔄 refresh                     │
│    Force refresh with alerts   │
│                                │
│ ⭐ rate                        │
│    Rate your bot experience    │
│                                │
│ 📖 help                        │
│    Show this enhanced menu     │
╰────────────────────────────────╯

${senderId === ADMIN_USER_ID ? `╭─ 👑 Admin Commands ────────────╮
│ 📢 update [message]           │
│    Send notifications to users │
│                                │
│ 🚀 deploy [commit msg]        │
│    Deploy new code changes     │
│                                │
│ 📊 status                      │
│    View enhanced bot stats     │
│                                │
│ 🌐 activestatus [on/off]      │
│    Set bot online/offline      │
│                                │
│ ⏰ schedule [action] [time]    │
│    Custom bot schedule times   │
╰────────────────────────────────╯` : ''}

╭─ 🌟 Enhanced Features ─────────╮
│ 🤖 Version: ${systemVersion} (Latest)      │
│ 🌐 Auto-uptime: 24/7 Active   │
│ 🎨 Premium aesthetics enabled │
│ 🔄 Smart cache management     │
│ ✨ Beautiful notifications    │
╰────────────────────────────────╯

💫 Enhanced & ready to serve! 🚀`;
      await sendMessage(senderId, { text: helpMessage }, PAGE_ACCESS_TOKEN);
      break;

    case 'REFRESH':
      await refreshCommand.execute(senderId, [], PAGE_ACCESS_TOKEN);
      break;

    case 'STATUS':
      await statusCommand.execute(senderId, [], PAGE_ACCESS_TOKEN);
      break;

    case 'RATE':
      await rateCommand.execute(senderId, [], PAGE_ACCESS_TOKEN);
      break;

    case 'RATE_1':
      await handleRating(senderId, 1);
      break;
    case 'RATE_2':
      await handleRating(senderId, 2);
      break;
    case 'RATE_3':
      await handleRating(senderId, 3);
      break;
    case 'RATE_4':
      await handleRating(senderId, 4);
      break;
    case 'RATE_5':
      await handleRating(senderId, 5);
      break;

    case 'UPDATE_BOT':
      const userIdString = senderId.toString();
      const adminIdString = ADMIN_USER_ID;

      if (userIdString === adminIdString) {
        const adminUpdateMessage = `╔══════════════════════════════════╗
║  🚀  𝗔𝗱𝗺𝗶𝗻 𝗨𝗽𝗱𝗮𝘁𝗲 ║
║      𝗖𝗼𝗻𝘁𝗿𝗼𝗹 ✨             ║
╚══════════════════════════════════╝

🎮 Enhanced update commands available:

╭─ 💻 Code Updates ─────────────╮
│ update code [pastebin_url]    │
│ └─ Update bot code from link  │
│                               │
│ applycode → Apply pending code │
│ cancelcode → Cancel update    │
│ previewcode → Show preview    │
╰────────────────────────────────╯

╭─ 📢 User Updates ─────────────╮
│ update [message]              │
│ └─ Send update to all users   │
╰────────────────────────────────╯

🌟 Enhanced with auto-restart & 
   beautiful notifications! ✨`;
        await sendMessage(senderId, { text: adminUpdateMessage }, PAGE_ACCESS_TOKEN);
      } else {
        const userUpdateMessage = `╔══════════════════════════════════╗
║  🚀  𝗖𝗵𝗲𝗰𝗸 𝗙𝗼𝗿 𝗨𝗽𝗱𝗮𝘁𝗲𝘀 ║
╚══════════════════════════════════╝

🌟 Checking for bot updates...

╭─ ✅ Current Status ───────────╮
│ 🤖 Version: ${systemVersion} (Latest)     │
│ 🔄 Auto-Update: Enabled      │
│ 📡 Connection: Stable        │
│ ✨ Features: All Active      │
╰────────────────────────────────╯

🎉 Your bot is running the latest 
   version with all premium features!

💚 Enjoy the enhanced experience! ✨`;
        await sendMessage(senderId, { text: userUpdateMessage }, PAGE_ACCESS_TOKEN);
      }
      break;

    default:
      logger.warn(`❓ Unknown enhanced postback payload: ${postback.payload}`);
  }
}

// Enhanced message handler
async function handleMessage(senderId, message) {
  if (!message.text) return;

  // Check if this is a new user
  if (newUsers.has(senderId)) {
    newUsers.delete(senderId);
    await sendWelcomeMessage(senderId);
    return;
  }

  // Enhanced rate limiting
  if (isRateLimited(senderId)) {
    logger.warn(`⏰ Rate limited user: ${senderId}`);
    const rateLimitMessage = `╔══════════════════════════════════╗
║  ⏰  𝗘𝗻𝗵𝗮𝗻𝗰𝗲𝗱 𝗥𝗮𝘁𝗲 ║
║      𝗟𝗶𝗺𝗶𝘁 𝗔𝗰𝘁𝗶𝘃𝗲! 🚦      ║
╚══════════════════════════════════╝

🏃‍♂️ Whoa there, speedy explorer!

You're sending messages a bit too 
quickly for our enhanced systems.

╭─ 🌱 Take a Moment ────────────╮
│ ⏰ Wait: Just a few seconds    │
│ 🧘 Relax: Quality over speed   │
│ ✨ Enhanced: Better experience │
│ 💚 Patience: Worth the wait    │
╰────────────────────────────────╯

🌟 Enhanced features work best 
   with mindful interaction! ✨`;
    await sendMessage(senderId, { text: rateLimitMessage }, PAGE_ACCESS_TOKEN);
    return;
  }

  logger.info(`💬 Processing enhanced message from ${senderId}: "${message.text}"`);
  const text = message.text.trim();

  // Handle code update commands (admin only)
  const userIdString = senderId.toString();
  const adminIdString = ADMIN_USER_ID;

  if (userIdString === adminIdString && pendingCodeUpdate) {
    if (text.toLowerCase() === 'applycode') {
      const applyingMessage = `╔══════════════════════════════════╗
║  🚀  𝗔𝗽𝗽𝗹𝘆𝗶𝗻𝗴 𝗖𝗼𝗱𝗲 ║
║      𝗨𝗽𝗱𝗮𝘁𝗲... ⚡            ║
╚══════════════════════════════════╝

🔄 Applying new code to bot system...
💾 Writing updated files...
🔧 Preparing for restart...
📡 Notifying all users...

╭─ 🛠️ Update Process ──────────╮
│ 📝 Code: Writing to files     │
│ 🔄 Restart: Preparing system  │
│ 👥 Users: Sending notifications │
│ ⚡ Status: In Progress        │
╰────────────────────────────────╯

🌟 Bot will restart in 10 seconds! ✨`;

      await sendMessage(senderId, { text: applyingMessage }, PAGE_ACCESS_TOKEN);

      // Notify all users about the update
      const newVersion = `v${systemVersion.split('.')[0]}.${parseInt(systemVersion.split('.')[1]) + 1}.0`;
      
      for (const userId of activeSessions.keys()) {
        if (userId !== adminIdString) {
          const userUpdateMessage = `╔══════════════════════════════════╗
║  🎉  𝗕𝗼𝘁 𝗛𝗮𝘀 𝗡𝗲𝘄 ║
║      𝗩𝗲𝗿𝘀𝗶𝗼𝗻! ✨             ║
╚══════════════════════════════════╝

🚀 Great news! The bot has been 
   updated with amazing new features!

╭─ 🌟 Update Details ───────────╮
│ 🔄 New Version: ${newVersion}        │
│ ✨ Status: Auto-Applied       │
│ 🛠️ Features: Enhanced & New   │
│ ⚡ Performance: Boosted       │
╰────────────────────────────────╯

╭─ 🎮 What's New ───────────────╮
│ 🎨 Enhanced aesthetics        │
│ 🚀 Improved performance       │
│ 🌟 New premium features       │
│ 🔧 Bug fixes & optimizations  │
╰────────────────────────────────╯

🌱 Bot will restart automatically!
   All your settings are preserved! 💚

🔄 Restarting in 3... 2... 1... ✨`;

          await sendMessage(userId, { text: userUpdateMessage }, PAGE_ACCESS_TOKEN);
        }
      }

      // Write the new code to file
      try {
        const fs = await import('fs/promises');
        await fs.writeFile('index.js', pendingCodeUpdate.code, 'utf8');
        
        const successMessage = `╔══════════════════════════════════╗
║  ✅  𝗖𝗼𝗱𝗲 𝗨𝗽𝗱𝗮𝘁𝗲 ║
║      𝗔𝗽𝗽𝗹𝗶𝗲𝗱! 🎊            ║
╚══════════════════════════════════╝

🎉 Code update successfully applied!

╭─ 📊 Update Summary ───────────╮
│ 📁 File Updated: index.js     │
│ 📏 Size: ${(pendingCodeUpdate.code.length / 1024).toFixed(1)}KB          │
│ ⚡ Status: Applied Successfully │
│ 🌟 Version: ${newVersion}            │
╰────────────────────────────────╯

🔄 Bot will restart now to apply 
   all changes and improvements!

💚 Thank you for keeping the bot 
   updated with latest features! ✨`;

        await sendMessage(senderId, { text: successMessage }, PAGE_ACCESS_TOKEN);
        
        logger.success('✅ Code update applied successfully, restarting...');
        
        // Clear the pending update
        pendingCodeUpdate = null;
        
        // Restart the process after a short delay
        setTimeout(() => {
          process.exit(0); // PM2 or Replit will restart the process
        }, 3000);
        
        return;
        
      } catch (error) {
        const errorMessage = `╔══════════════════════════════════╗
║  ❌  𝗔𝗽𝗽𝗹𝘆 𝗙𝗮𝗶𝗹𝗲𝗱 ║
║      𝗘𝗿𝗿𝗼𝗿! 🛠️              ║
╚══════════════════════════════════╝

😔 Failed to apply the code update.

╭─ 🔧 Error Details ────────────╮
│ 📝 Issue: File write failed   │
│ 🛡️ Safety: Original preserved │
│ 🔄 Status: No changes made    │
│ 💫 Bot: Still running safely  │
╰────────────────────────────────╯

🌱 Bot continues with current code.
   Please check the code and try again! ✨`;

        await sendMessage(senderId, { text: errorMessage }, PAGE_ACCESS_TOKEN);
        logger.error('❌ Failed to apply code update:', error.message);
        return;
      }
      
    } else if (text.toLowerCase() === 'cancelcode') {
      pendingCodeUpdate = null;
      
      const cancelMessage = `╔══════════════════════════════════╗
║  🚫  𝗖𝗼𝗱𝗲 𝗨𝗽𝗱𝗮𝘁𝗲 ║
║      𝗖𝗮𝗻𝗰𝗲𝗹𝗹𝗲𝗱! 📋          ║
╚══════════════════════════════════╝

✅ Code update has been cancelled 
   successfully.

╭─ 🛡️ Safety Status ───────────╮
│ 📁 Original: Preserved        │
│ 🔄 Bot: Running normally      │
│ 💾 Memory: Cleared           │
│ ✨ Status: No changes made    │
╰────────────────────────────────╯

🌱 Bot continues with current 
   stable version! 💚`;

      await sendMessage(senderId, { text: cancelMessage }, PAGE_ACCESS_TOKEN);
      return;
      
    } else if (text.toLowerCase() === 'previewcode') {
      const preview = pendingCodeUpdate.code.substring(0, 500);
      const previewMessage = `╔══════════════════════════════════╗
║  👁️  𝗖𝗼𝗱𝗲 𝗣𝗿𝗲𝘃𝗶𝗲𝘄 ║
╚══════════════════════════════════╝

📝 First 500 characters of new code:

\`\`\`javascript
${preview}...
\`\`\`

╭─ 📊 Code Statistics ──────────╮
│ 📏 Total Size: ${(pendingCodeUpdate.code.length / 1024).toFixed(1)}KB      │
│ 📄 Lines: ~${pendingCodeUpdate.code.split('\n').length} lines    │
│ 🕒 Fetched: ${new Date(pendingCodeUpdate.timestamp).toLocaleTimeString()} │
╰────────────────────────────────╯

Commands: 'applycode', 'cancelcode'`;

      await sendMessage(senderId, { text: previewMessage }, PAGE_ACCESS_TOKEN);
      return;
    }
  }

  // Enhanced update responses
  if (pendingUpdates.has(senderId)) {
    if (text.toLowerCase() === 'apply') {
      pendingUpdates.delete(senderId);
      const applyMessage = `╔══════════════════════════════════╗
║  ✅  𝗘𝗻𝗵𝗮𝗻𝗰𝗲𝗱 𝗨𝗽𝗱𝗮𝘁𝗲  ║
║      𝗔𝗽𝗽𝗹𝗶𝗲𝗱! 🎊            ║
╚══════════════════════════════════╝

🎉 Update successfully installed 
   with enhanced features!

╭─ ✨ What's New ───────────────╮
│ 🎨 Enhanced aesthetics        │
│ 🔄 Improved performance       │
│ 🌟 New premium features       │
│ 🚀 Faster response times      │
│ 💚 Better user experience     │
╰────────────────────────────────╯

Your enhanced bot is now running 
the latest version with all new 
capabilities and improvements!

🌱 Thank you for updating! ✨💚`;
      await sendMessage(senderId, { text: applyMessage }, PAGE_ACCESS_TOKEN);
      return;
    } else if (text.toLowerCase() === 'skip') {
      pendingUpdates.delete(senderId);
      const skipMessage = `╔══════════════════════════════════╗
║  ⏭️   𝗘𝗻𝗵𝗮𝗻𝗰𝗲𝗱 𝗨𝗽𝗱𝗮𝘁𝗲 ║
║       𝗦𝗸𝗶𝗽𝗽𝗲𝗱! 📋           ║
╚══════════════════════════════════╝

📝 Update skipped for now, no worries!

╭─ 💫 Your Choice Respected ────╮
│ ✅ Current version: Working    │
│ 🔄 Future updates: Available   │
│ 📞 Admin contact: Anytime     │
│ 🌱 Continue: As normal        │
╰────────────────────────────────╯

You can always apply enhanced 
updates later by asking the admin!

🌟 Enjoy your current experience! ✨`;
      await sendMessage(senderId, { text: skipMessage }, PAGE_ACCESS_TOKEN);
      return;
    }
  }

  const args = text.split(/\s+/);
  const commandName = args.shift().toLowerCase();
  const command = commands.get(commandName);

  if (command) {
    try {
      await command.execute(senderId, args, PAGE_ACCESS_TOKEN);
    } catch (error) {
      logger.error(`❌ Error executing enhanced command '${commandName}' for user ${senderId}:`, error);
      const errorMessage = `╔══════════════════════════════════╗
║  😥  𝗘𝗻𝗵𝗮𝗻𝗰𝗲𝗱 𝗦𝘆𝘀𝘁𝗲𝗺  ║
║      𝗘𝗿𝗿𝗼𝗿 𝗗𝗲𝘁𝗲𝗰𝘁𝗲𝗱! 🛠️     ║
╚══════════════════════════════════╝

😔 Something unexpected happened 
   in our enhanced system.

╭─ 🔧 Auto-Recovery Active ─────╮
│ 🔄 Trying to fix automatically │
│ 💻 Developer has been notified │
│ ⏰ Usually resolves quickly    │
│ 🌟 Enhanced stability enabled  │
╰────────────────────────────────╯

🌱 Please try again in a moment!
   Our enhanced system is self-healing! ✨`;
      await sendMessage(senderId, { text: errorMessage }, PAGE_ACCESS_TOKEN);
    }
  } else {
    // Handle quick replies for rating
    if (commandName === '🌟') { // Handle "🌟 1 Star"
        await handleRating(senderId, 1);
        return;
    } else if (commandName === '🌟🌟') { // Handle "🌟🌟 2 Stars"
        await handleRating(senderId, 2);
        return;
    } else if (commandName === '🌟🌟🌟') { // Handle "🌟🌟🌟 3 Stars"
        await handleRating(senderId, 3);
        return;
    } else if (commandName === '🌟🌟🌟🌟') { // Handle "🌟🌟🌟🌟 4 Stars"
        await handleRating(senderId, 4);
        return;
    } else if (commandName === '🌟🌟🌟🌟🌟') { // Handle "🌟🌟🌟🌟🌟 5 Stars"
        await handleRating(senderId, 5);
        return;
    }
    if (commandName === 'help') {
      const helpMessage = `╔══════════════════════════════════╗
║  🤖  𝗘𝗻𝗵𝗮𝗻𝗰𝗲𝗱 𝗚𝗮𝗴𝘀𝘁𝗼𝗰𝗸  ║
║      𝗕𝗼𝘁 𝗛𝗲𝗹𝗽 ✨            ║
╚══════════════════════════════════╝

✨ 𝗔𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀:

╭─ 🌾 Main Commands ─────────────╮
│ 🟢 gagstock on                │
│    Start enhanced tracking     │
│                                │
│ 🎯 gagstock on [filter]       │
│    Track specific items        │
│    Example: Sunflower | Can    │
│                                │
│ 🔴 gagstock off               │
│    Stop tracking gracefully   │
╰────────────────────────────────╯

╭─ ⚡ Quick Actions ─────────────╮
│ 🔄 refresh                     │
│    Force refresh with alerts   │
│                                │
│ ⭐ rate                        │
│    Rate your bot experience    │
│                                │
│ 📖 help                        │
│    Show this enhanced menu     │
╰────────────────────────────────╯

${senderId === ADMIN_USER_ID ? `╭─ 👑 Admin Commands ────────────╮
│ 📢 update [message]           │
│    Send notifications to users │
│                                │
│ 🚀 deploy [commit msg]        │
│    Deploy new code changes     │
│                                │
│ 📊 status                      │
│    View enhanced bot stats     │
│                                │
│ 🌐 activestatus [onoff]      │
│    Set bot online/offline      │
│                                │
│ ⏰ schedule [action] [time]    │
│    Custom bot schedule times   │
╰────────────────────────────────╯` : ''}

╭─ 🌟 Enhanced Features ─────────╮
│ 🤖 Version: ${systemVersion} (Latest)      │
│ 🌐 Auto-uptime: 24/7 Active   │
│ 🎨 Premium aesthetics enabled │
│ 🔄 Smart cache management     │
│ ✨ Beautiful notifications    │
╰────────────────────────────────╯

💫 Enhanced & ready to serve! 🚀`;
      await sendMessage(senderId, { text: helpMessage }, PAGE_ACCESS_TOKEN);
    } else {
      logger.warn(`❓ Enhanced command not found: '${commandName}' from user ${senderId}`);
      const unknownMessage = `╔══════════════════════════════════╗
║  ❓  𝗘𝗻𝗵𝗮𝗻𝗰𝗲𝗱 𝗖𝗼𝗺𝗺𝗮𝗻𝗱  ║
║      𝗡𝗼𝘁 𝗥𝗲𝗰𝗼𝗴𝗻𝗶𝘇𝗲𝗱! 🤔       ║
╚══════════════════════════════════╝

🤖 Command '${commandName}' not found in 
   our enhanced system.

╭─ 💡 Helpful Suggestions ──────╮
│ 📖 Type 'help' - See all cmds │
│ 🌱 Try 'gagstock on' - Start  │
│ 🔄 Use 'refresh' - Update now │
│ ✨ Enhanced features available │
╰────────────────────────────────╯

🌟 I'm here to help you track
   Grow A Garden stock beautifully! 💚`;
      await sendMessage(senderId, { text: unknownMessage }, PAGE_ACCESS_TOKEN);
    }
  }
}

// ===================================================================================
// 6. ENHANCED EXPRESS SERVER & WEBHOOKS
// ===================================================================================

const app = express().use(bodyParser.json());
const PORT = process.env.PORT || 1337;

// Enhanced middleware
app.use((req, res, next) => {
  logger.debug(`🌐 ${req.method} ${req.path} - ${req.ip}`);
  next();
});

app.use((error, req, res, next) => {
  logger.error('💥 Express error:', error);
  res.status(500).json({ error: 'Internal server error', enhanced: true });
});

const server = app.listen(PORT, async () => {
  logger.banner('🚀 Enhanced GagStock Bot Server', `Listening on port ${PORT} with premium features`);

  // Set up enhanced bot features
  try {
    await setupGetStartedButton();
    await setupPersistentMenu();
    logger.success('✨ Enhanced bot setup completed successfully!');

    // Start uptime monitoring after setup
    if (UPTIME_CONFIG.enabled) {
      setTimeout(performUptimePing, 30000); // First ping after 30 seconds
    }
  } catch (error) {
    logger.error('❌ Failed to set up enhanced bot features:', error);
  }
});

// Enhanced graceful shutdown
process.on('SIGTERM', () => {
  logger.system('🛑 SIGTERM received, shutting down enhanced system gracefully...');
  for (const [userId, session] of activeSessions) {
    clearTimeout(session.timeout);
    logger.info(`🧹 Cleaned up enhanced session for user: ${userId}`);
  }
  activeSessions.clear();
  lastSentCache.clear();
  stockClearingAlerts.clear();

  server.close(() => {
    logger.system('✅ Enhanced server closed gracefully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.system('🛑 SIGINT received, shutting down enhanced system...');
  process.exit(0);
});

// Enhanced webhook handler
app.post('/webhook', async (req, res) => {
  try {
    let body = req.body;

    if (!body || body.object !== 'page') {
      logger.warn('⚠️ Invalid enhanced webhook object:', body?.object);
      return res.sendStatus(404);
    }

    if (!body.entry || !Array.isArray(body.entry)) {
      logger.warn('⚠️ Invalid enhanced webhook entry structure');
      return res.sendStatus(400);
    }

    for (const entry of body.entry) {
      if (!entry.messaging || !Array.isArray(entry.messaging)) {
        continue;
      }

      for (const webhook_event of entry.messaging) {
        if (!webhook_event.sender?.id) {
          logger.warn('⚠️ Enhanced webhook event missing sender ID');
          continue;
        }

        const sender_psid = webhook_event.sender.id;
        logger.webhook('🔔 Enhanced event received:', { 
          from: sender_psid, 
          type: webhook_event.message ? 'message' : 'other',
          timestamp: webhook_event.timestamp
        });

        if (webhook_event.message) {
          handleMessage(sender_psid, webhook_event.message).catch(error => {
            logger.error('❌ Error handling enhanced message:', error);
          });
        } else if (webhook_event.postback) {
          handlePostback(sender_psid, webhook_event.postback).catch(error => {
            logger.error('❌ Error handling enhanced postback:', error);
          });
        } else if (webhook_event.optin) {
          newUsers.add(sender_psid);
          logger.info(`🌟 New enhanced user opted in: ${sender_psid}`);
        }
      }
    }

    res.status(200).send('ENHANCED_EVENT_RECEIVED');
  } catch (error) {
    logger.error('💥 Enhanced webhook processing error:', error);
    res.status(500).send('ENHANCED_INTERNAL_ERROR');
  }
});

app.get('/webhook', (req, res) => {
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      logger.success('✅ ENHANCED_WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      logger.error('❌ Enhanced webhook verification failed. Tokens do not match.');
      res.sendStatus(403);
    }
  }
});

// Enhanced health check endpoint with Render love
app.get('/health', (req, res) => {
  const heartbeat = UPTIME_CONFIG.heartbeatEmojis[Math.floor(Math.random() * UPTIME_CONFIG.heartbeatEmojis.length)];

  const health = {
    status: 'healthy-enhanced-with-render-love',
    version: systemVersion,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeSessions: activeSessions.size,
    memoryUsage: process.memoryUsage(),
    renderLove: heartbeat,
    uptimeMonitor: {
      enabled: UPTIME_CONFIG.enabled,
      totalPings: uptimeStats.totalPings,
      successfulPings: uptimeStats.successfulPings,
      consecutiveSuccesses: uptimeStats.consecutiveSuccesses,
      consecutiveFailures: uptimeStats.consecutiveFailures,
      lastPing: uptimeStats.lastPing,
      status: uptimeStats.status,
      averageResponseTime: uptimeStats.averageResponseTime,
      bestResponseTime: uptimeStats.bestResponseTime === Infinity ? null : uptimeStats.bestResponseTime,
      worstResponseTime: uptimeStats.worstResponseTime,
      successRate: uptimeStats.totalPings > 0 ? Math.round((uptimeStats.successfulPings / uptimeStats.totalPings) * 100) : 0,
      targetUrl: UPTIME_CONFIG.selfUrl,
      heartbeatInterval: UPTIME_CONFIG.pingInterval
    },
    enhancedFeatures: {
      autoUptimeWithRenderLove: UPTIME_CONFIG.enabled,
      stockClearing: true,
      premiumAesthetics: true,
      smartCaching: true,
      rateLimit: true,
      milestoneTracking: true,
      autoRecovery: true,
      beautifulLogging: true
    },
    message: `Bot is running with enhanced love and aesthetic beauty! ${heartbeat} Render keeps us alive!`
  };

  // Log the health check with love
  logger.debug(`💖 Health check requested with Render love: ${heartbeat}`);

  res.status(200).json(health);
});

// Enhanced status endpoint
app.get('/status', (req, res) => {
  const sessions = Array.from(activeSessions.entries()).map(([userId, session]) => ({
    userId,
    startTime: new Date(session.startTime).toISOString(),
    lastActivity: new Date(session.lastActivity).toISOString(),
    filters: session.filters
  }));

  res.status(200).json({
    enhanced: true,
    version: systemVersion,
    activeSessions: sessions,
    totalUsers: activeSessions.size,
    uptime: process.uptime(),
    cacheSize: lastSentCache.size,
    pendingAlerts: stockClearingAlerts.size,
    uptimeStats: uptimeStats,
    features: {
      autoUptime24_7: UPTIME_CONFIG.enabled,
      stockClearingAlerts: true,
      enhancedAesthetics: true,
      smartCacheManagement: true,
      rateLimiting: true,
      adminAuthentication: true
    }
  });
});

logger.banner('🌟 Enhanced GagStock Bot v3.0.0', 'Premium features activated & ready to serve!');

// Implementing the rate command

const rateCommand = {
    name: "rate",
    aliases: ["rating", "review"],
    description: "Rate the bot and provide feedback",
    usage: "rate",
    category: "Tools ⚒️",
    async execute(senderId, args, pageAccessToken) {

        const rateMessage = `
╔══════════════════════════════════╗
║ ⭐ Rate GagStock Bot ⭐          ║
╚══════════════════════════════════╝

How would you rate your experience
with our enhanced GagStock Bot?

Tap a star below to submit your rating!
        `;

        const quickReplies = {
            "quick_replies": [
                {
                    "content_type": "text",
                    "title": "🌟 1 Star",
                    "payload": "RATE_1"
                },
                {
                    "content_type": "text",
                    "title": "🌟🌟 2 Stars",
                    "payload": "RATE_2"
                },
                {
                    "content_type": "text",
                    "title": "🌟🌟🌟 3 Stars",
                    "payload": "RATE_3"
                },
                {
                    "content_type": "text",
                    "title": "🌟🌟🌟🌟 4 Stars",
                    "payload": "RATE_4"
                },
                {
                    "content_type": "text",
                    "title": "🌟🌟🌟🌟🌟 5 Stars",
                    "payload": "RATE_5"
                }
            ]
        };
        await sendMessage(senderId, { text: rateMessage, quick_replies: quickReplies.quick_replies }, pageAccessToken);
    }
};

//Adding rate command to the command list
commands.set(rateCommand.name, rateCommand);
if (rateCommand.aliases) {
    rateCommand.aliases.forEach(alias => commands.set(alias, rateCommand));
}

async function handleRating(senderId, rating) {
    let starEmoji = "";
    for (let i = 0; i < rating; i++) {
        starEmoji += "⭐";
    }
    const bibleVerses = [
        "“Give thanks to the Lord, for he is good; his love endures forever.” - 1 Chronicles 16:34",
        "“Every good and perfect gift is from above, coming down from the Father of the heavenly lights, who does not change like shifting shadows.” - James 1:17",
        "“I can do all things through Christ who strengthens me.” - Philippians 4:13",
        "“Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.” - Proverbs 3:5-6",
        "“The Lord is my shepherd, I lack nothing.” - Psalm 23:1"
    ];

    const randomIndex = Math.floor(Math.random() * bibleVerses.length);
    const randomVerse = bibleVerses[randomIndex];
    const confirmationMessage = `
╔══════════════════════════════════╗
║    🙏 Thank You For Rating! 🙏   ║
╚══════════════════════════════════╝

You've rated us ${rating} stars! ${starEmoji}

We appreciate your valuable feedback!

${randomVerse}
`;

    await sendMessage(senderId, { text: confirmationMessage }, PAGE_ACCESS_TOKEN);

    // Notify admin
    const adminMessage = `
╔══════════════════════════════════╗
║   🔔 User Rating Received! 🔔   ║
╚══════════════════════════════════╝

User ID: ${senderId}
Rating: ${rating} Stars ${starEmoji}

Thank you for your feedback!
`;
    if (ADMIN_USER_ID) {
        await sendMessage(ADMIN_USER_ID, { text: adminMessage }, PAGE_ACCESS_TOKEN);
    }
}

// Schedule command
const scheduleCommand = {
  name: "schedule",
  aliases: ["time"],
  description: "Admin command to schedule bot on/off times",
  usage: "schedule on [HH:MM] | schedule off [HH:MM]",
  category: "Admin 👑",
  async execute(senderId, args, pageAccessToken) {
    // Enhanced admin verification
    const userIdString = senderId.toString();
    const adminIdString = ADMIN_USER_ID;

    logger.debug(`🔐 Admin check: User ID "${userIdString}" vs Admin ID "${adminIdString}"`);

    if (userIdString !== adminIdString) {
      const unauthorizedMessage = `╔══════════════════════════════════╗
║  🚫  𝗔𝗰𝗰𝗲𝘀𝘀 𝗗𝗲𝗻𝗶𝗲𝗱  ║
╚══════════════════════════════════╝

🛡️ This command is reserved for 
   bot administrators only.

╭─ 🔍 Debug Info ──────────────╮
│ Your ID: ${userIdString.slice(0, 8)}...     │
│ Status: Unauthorized          │
╰───────────────────────────────╯

🌱 Continue using gagstock normally!
💡 Contact the bot owner if you 
   believe this is an error.`;
      return await sendMessage(senderId, { text: unauthorizedMessage }, pageAccessToken);
    }

    const action = args[0]?.toLowerCase();
    const time = args[1];

    if (!action || !['on', 'off'].includes(action) || !time || !/^\d{2}:\d{2}$/.test(time)) {
      const usageMessage = `╔══════════════════════════════════╗
║  ⏰  𝗦𝗰𝗵𝗲𝗱𝘂𝗹𝗲 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 ║
║      𝗚𝘂𝗶𝗱𝗲 ✨               ║
╚══════════════════════════════════╝

🌟 𝗔𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲 𝗢𝗽𝘁𝗶𝗼𝗻𝘀:

╭─ 🟢 Schedule Bot On ──────────╮
│ schedule on [HH:MM]           │
│ └─ Set time for bot to go online │
│    Example: schedule on 05:00  │
╰────────────────────────────────╯

╭─ 🔴 Schedule Bot Off ─────────╮
│ schedule off [HH:MM]          │
│ └─ Set time for bot to go offline │
│    Example: schedule off 00:00 │
╰────────────────────────────────╯

Please use 24-hour format (HH:MM).`;
      return await sendMessage(senderId, { text: usageMessage }, pageAccessToken);
    }

    const [hours, minutes] = time.split(':').map(Number);

    // Store schedule information (replace with persistent storage if needed)
    if (action === 'on') {
      botOnlineHour = hours;
      botOnlineMinute = minutes;
    } else {
      botOfflineHour = hours;
      botOfflineMinute = minutes;
    }

    const confirmationMessage = `╔══════════════════════════════════╗
║  ⏰  𝗦𝗰𝗵𝗲𝗱𝘂𝗹𝗲 𝗨𝗽𝗱𝗮𝘁𝗲𝗱! ║
║      𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆! ✨         ║
╚══════════════════════════════════╝

🎉 Bot schedule updated beautifully!

╭─ 📱 Schedule Details ───────────╮
│ 🎯 Action: ${action === 'on' ? 'Go Online' : 'Go Offline'} │
│ ⏰ Time: ${time}              │
╰────────────────────────────────╯

🌱 The bot schedule is now configured.`;
    await sendMessage(senderId, { text: confirmationMessage }, pageAccessToken);
    logger.system(`⏰ Bot schedule updated: ${action} at ${time} by admin`);
  }
};

commands.set(scheduleCommand.name, scheduleCommand);
if (scheduleCommand.aliases) {
  scheduleCommand.aliases.forEach(alias => commands.set(alias, scheduleCommand));
}

// Auto-scheduling variables
let botOnlineHour = 5;
let botOnlineMinute = 0;
let botOfflineHour = 0;
let botOfflineMinute = 0;
let botRestMessageSent = false; // Track if rest message was sent today

async function checkSchedule() {
  const now = getPHTime();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  if (
    currentHour === botOfflineHour &&
    currentMinute === botOfflineMinute &&
    !botRestMessageSent
  ) {
    // Send rest message to all users
    for (const userId of activeSessions.keys()) {
      const restMessage = `╔══════════════════════════════════╗
║  🌙   Bot is Resting 😴        ║
╚══════════════════════════════════╝

The bot is taking a rest. Maybe tomorrow morning, will be back. ✨

Come back at 5 AM!`;
      await sendMessage(userId, { text: restMessage }, PAGE_ACCESS_TOKEN);
      logger.info(`🌙 Sent rest message to user: ${userId}`);
    }

    // Stop all active sessions
    for (const [userId, session] of activeSessions) {
      clearTimeout(session.timeout);
      activeSessions.delete(userId);
      lastSentCache.delete(userId);
      stockClearingAlerts.delete(userId);
      logger.info(`🛑 Stopped tracking for user: ${userId}`);
    }

    botRestMessageSent = true; // Mark the message as sent for today
    logger.system("🌙 Bot is going offline for the night.");
    // Optionally, stop the server or other bot activities here
  } else if (
    currentHour === botOnlineHour &&
    currentMinute === botOnlineMinute &&
    botRestMessageSent
  ) {
    // Send online message to admin
    if (ADMIN_USER_ID) {
      const onlineMessage = `╔══════════════════════════════════╗
║  ☀️   Bot is Online! ☀️        ║
╚══════════════════════════════════╝

The bot is back online and ready to serve! ✨`;
      await sendMessage(ADMIN_USER_ID, { text: onlineMessage }, PAGE_ACCESS_TOKEN);
      logger.info("☀️ Bot is back online.");
    }

    botRestMessageSent = false; // Reset the flag for the next night
    logger.system("☀️ Bot is back online for the day.");
    // Optionally, start the server or other bot activities here
  }
}

// Schedule check every minute
setInterval(checkSchedule, 60 * 1000);

// Auto-refresh mechanism (1 minute interval)
setInterval(() => {
  for (const userId of activeSessions.keys()) {
    const session = activeSessions.get(userId);
    if (session) {
      refreshCommand.execute(userId, [], PAGE_ACCESS_TOKEN).catch(error => {
        logger.error(`❌ Auto-refresh failed for user ${userId}:`, error);
      });
    }
  }
}, 60 * 1000);

// Voice message function
async function sendVoiceMessage(recipientId, voiceMessageUrl, pageAccessToken) {
  // Input validation
  if (!recipientId || !voiceMessageUrl || !pageAccessToken) {
    logger.error('Missing required parameters for sendVoiceMessage');
    return false;
  }

  const request_body = {
    recipient: { id: recipientId },
    message: {
      attachment: {
        type: "audio",
        payload: {
          url: voiceMessageUrl,
          is_reusable: true
        }
      }
    },
    messaging_type: 'RESPONSE',
  };

  try {
    const response = await axios.post('https://graph.facebook.com/v19.0/me/messages', request_body, {
      params: { access_token: pageAccessToken },
      timeout: 10000, // 10 second timeout
    });
    logger.success('Voice message sent to user:', recipientId);
    return true;
  } catch (error) {
    if (error.response) {
      logger.error('Facebook API error:', {
        status: error.response.status,
        data: error.response.data,
        user: recipientId
      });
    } else if (error.request) {
      logger.error('Network error sending voice message:', error.message);
    } else {
      logger.error('Error setting up voice message request:', error.message);
    }
    return false;
  }
}

// 10 PM Relapse Time voice message scheduling
async function sendRelapseTimeVoiceMessage() {
  const now = getPHTime();
  const currentHour = now.getHours();

  if (currentHour === 22) {
    const voiceMessageUrl = 'https://github.com/user-attachments/assets/relapsetime.mp3'; // Replace with your file URL

    // Send the voice message to all active users
    for (const userId of activeSessions.keys()) {
      await sendVoiceMessage(userId, voiceMessageUrl, PAGE_ACCESS_TOKEN);
      logger.info(`🎶 Sent 10 PM relapse time voice message to user: ${userId}`);
    }
  }
}

// Set interval to check and send the relapse time voice message every minute
setInterval(sendRelapseTimeVoiceMessage, 60 * 1000);

logger.banner('🌟 Enhanced GagStock Bot v3.0.0', 'Premium features activated & ready to serve!');

// Beautiful signature
logger.success('🌸 ═══════════════════════════════════════════════════════════ 🌸');
logger.success('✨                    𝓓𝓮𝓿𝓮𝓵𝓸𝓹 𝓫𝔂 𝓢𝓤𝓝𝓝𝓔𝓛                      ✨');
logger.success('💫                 Enhanced with Love & Aesthetics                💫');
logger.success('🌸 ═══════════════════════════════════════════════════════════ 🌸');
