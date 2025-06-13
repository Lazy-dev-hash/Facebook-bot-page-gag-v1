
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
// 3. FACEBOOK MESSENGER HELPER FUNCTIONS
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

async function sendTypingIndicator(recipientId, pageAccessToken, action = 'typing_on') {
  const request_body = {
    recipient: { id: recipientId },
    sender_action: action
  };

  try {
    await axios.post('https://graph.facebook.com/v19.0/me/messages', request_body, {
      params: { access_token: pageAccessToken },
      timeout: 5000
    });
    logger.debug(`✨ Typing indicator (${action}) sent to user: ${recipientId}`);
    return true;
  } catch (error) {
    logger.error('Error sending typing indicator:', error.message);
    return false;
  }
}

async function sendVoiceMessage(recipientId, voiceMessageUrl, pageAccessToken) {
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
      timeout: 10000
    });
    logger.success('Voice message sent to user:', recipientId);
    return true;
  } catch (error) {
    logger.error('Error sending voice message:', error.message);
    return false;
  }
}

// ===================================================================================
// 4. ENHANCED GAGSTOCK BOT LOGIC
// ===================================================================================

const activeSessions = new Map();
const lastSentCache = new Map();
const userRateLimit = new Map();
const userDoNotDisturb = new Map();
const customCommandUsers = new Set(); // Allowed users for custom commands
const MAX_REQUESTS_PER_MINUTE = 10;

// Enhanced Admin and update system
const ADMIN_USER_ID = process.env.ADMIN_USER_ID?.toString(); // Ensure string comparison
const pendingUpdates = new Map();
const systemVersion = "3.1.0"; // Updated version
const newUsers = new Set();

// Stock clearing system
const stockClearingAlerts = new Map();
const STOCK_CLEAR_WARNING_TIME = 30000; // 30 seconds before clearing

// Custom scheduling variables for auto on/off
let botIsOnline = true;
const BOT_OFFLINE_HOUR = 0; // 12:00 AM (midnight)
const BOT_OFFLINE_MINUTE = 0;
const BOT_ONLINE_HOUR = 5; // 5:00 AM
const BOT_ONLINE_MINUTE = 0;
let offlineMessageSent = false;
let onlineMessageSent = false;

// Voice message URL
const VOICE_MESSAGE_URL = 'https://github.com/Lazy-dev-hash/relapse-music/raw/main/Multo.mp3';

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
  if (nextSeedM === 60) nextSeed.setHours(now.getHours() + 1);
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

// Divine items tracking
const DIVINE_ITEMS = ["beanstalk", "basic sprinkler", "master sprinkler", "godly sprinkler", "ember lily"];

function checkDivineItems(stockData) {
  const divineItemsInStock = [];
  
  // Check all stock categories for divine items
  const allItems = [
    ...stockData.gearStock,
    ...stockData.seedsStock,
    ...stockData.eggStock,
    ...stockData.cosmeticsStock,
    ...stockData.honeyStock
  ];
  
  for (const item of allItems) {
    if (DIVINE_ITEMS.some(divine => item.name.toLowerCase().includes(divine.toLowerCase())) && item.value > 0) {
      divineItemsInStock.push(item);
    }
  }
  
  return divineItemsInStock;
}

function getNextStockItem(category) {
  const now = getPHTime();
  let nextTime;
  
  switch (category.toLowerCase()) {
    case 'gear':
      const nextGearM = Math.ceil((now.getMinutes() + (now.getSeconds() > 0 ? 1 : 0)) / 5) * 5;
      nextTime = new Date(now);
      nextTime.setMinutes(nextGearM === 60 ? 0 : nextGearM, 0, 0);
      if (nextGearM === 60) nextTime.setHours(now.getHours() + 1);
      break;
    case 'seed':
      const nextSeedM = Math.ceil((now.getMinutes() + (now.getSeconds() > 0 ? 1 : 0)) / 3) * 3;
      nextTime = new Date(now);
      nextTime.setMinutes(nextSeedM === 60 ? 0 : nextSeedM, 0, 0);
      if (nextSeedM === 60) nextTime.setHours(now.getHours() + 1);
      break;
    case 'egg':
      nextTime = new Date(now);
      nextTime.setMinutes(now.getMinutes() < 30 ? 30 : 0);
      if (now.getMinutes() >= 30) nextTime.setHours(now.getHours() + 1);
      nextTime.setSeconds(0, 0);
      break;
    default:
      return null;
  }
  
  return getCountdown(nextTime);
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

// Natural Language Processing for questions
function processNaturalLanguageQuery(text) {
  const lowerText = text.toLowerCase();
  
  // Stock-related questions
  if (lowerText.includes('stock') && lowerText.includes('today')) {
    return 'stock_today';
  }
  if (lowerText.includes('what') && (lowerText.includes('available') || lowerText.includes('stock'))) {
    return 'stock_available';
  }
  if (lowerText.includes('when') && (lowerText.includes('restock') || lowerText.includes('refresh'))) {
    return 'next_restock';
  }
  if (lowerText.includes('divine') || lowerText.includes('rare') || lowerText.includes('special')) {
    return 'divine_items';
  }
  if (lowerText.includes('price') || lowerText.includes('cost') || lowerText.includes('how much')) {
    return 'pricing_info';
  }
  if (lowerText.includes('weather') || lowerText.includes('bonus') || lowerText.includes('crop')) {
    return 'weather_info';
  }
  
  // General bot questions
  if (lowerText.includes('how') && lowerText.includes('work')) {
    return 'how_bot_works';
  }
  if (lowerText.includes('help') || lowerText.includes('command')) {
    return 'help_info';
  }
  
  return 'general_question';
}

async function handleNaturalLanguageQuery(senderId, queryType, originalText, pageAccessToken) {
  // Send typing indicator
  await sendTypingIndicator(senderId, pageAccessToken, 'typing_on');
  
  // Add a slight delay for more natural interaction
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  try {
    switch (queryType) {
      case 'stock_today':
      case 'stock_available':
        await gagstockCommand.execute(senderId, ['on'], pageAccessToken);
        break;
        
      case 'next_restock':
        await nextStockCommand.execute(senderId, ['all'], pageAccessToken);
        break;
        
      case 'divine_items':
        await customCommand.execute(senderId, ['divine'], pageAccessToken);
        break;
        
      case 'weather_info':
        const weatherResponse = `╔══════════════════════════════════╗
║  🌤️  𝗪𝗲𝗮𝘁𝗵𝗲𝗿 𝗜𝗻𝗳𝗼  ║
╚══════════════════════════════════╝

🌟 Weather affects crop bonuses in 
   Grow A Garden!

╭─ 🌈 Weather Effects ──────────╮
│ ☀️ Sunny: Normal growth       │
│ 🌧️ Rainy: Water bonus         │
│ ⛅ Cloudy: Reduced growth      │
│ 🌪️ Stormy: Special events     │
╰────────────────────────────────╯

🔄 Use 'refresh' to see current 
   weather and active bonuses! ✨`;
        await sendMessage(senderId, { text: weatherResponse }, pageAccessToken);
        break;
        
      case 'pricing_info':
        const pricingResponse = `╔══════════════════════════════════╗
║  💰  𝗣𝗿𝗶𝗰𝗶𝗻𝗴 𝗜𝗻𝗳𝗼  ║
╚══════════════════════════════════╝

💡 Items in Grow A Garden have 
   different price ranges:

╭─ 💸 Price Categories ──────────╮
│ 🌱 Seeds: 50-5,000 coins      │
│ 🛠️ Tools: 100-50,000 coins    │
│ 🥚 Eggs: 1,000-100,000 coins  │
│ 🎨 Cosmetics: 500-25,000 coins│
│ 💎 Divine: 10,000+ coins      │
╰────────────────────────────────╯

🌟 Prices vary based on rarity! ✨`;
        await sendMessage(senderId, { text: pricingResponse }, pageAccessToken);
        break;
        
      case 'how_bot_works':
        const howItWorksResponse = `╔══════════════════════════════════╗
║  🤖  𝗛𝗼𝘄 𝗜 𝗪𝗼𝗿𝗸  ║
╚══════════════════════════════════╝

🌟 I'm your enhanced Grow A Garden 
   stock tracking assistant!

╭─ ⚡ My Abilities ──────────────╮
│ 📊 Real-time stock monitoring  │
│ 🔄 Auto-refresh every 5 minutes│
│ 🌤️ Weather & bonus tracking   │
│ 💎 Divine item alerts         │
│ ⏰ Restock countdown timers    │
│ 🎯 Smart filtering system     │
│ 💬 Natural language support   │
╰────────────────────────────────╯

🚀 Just ask me anything about 
   stocks and I'll help! ✨`;
        await sendMessage(senderId, { text: howItWorksResponse }, pageAccessToken);
        break;
        
      case 'help_info':
        const helpResponse = `╔══════════════════════════════════╗
║  📖  𝗤𝘂𝗶𝗰𝗸 𝗛𝗲𝗹𝗽  ║
╚══════════════════════════════════╝

🌟 You can ask me naturally:

╭─ 💬 Example Questions ────────╮
│ "What stock today?"           │
│ "When is next restock?"       │
│ "Show me divine items"        │
│ "What's the weather?"         │
│ "How do you work?"            │
╰────────────────────────────────╯

╭─ 🎮 Quick Commands ───────────╮
│ gagstock on - Start tracking │
│ refresh - Update now          │
│ help - Full command list     │
╰────────────────────────────────╯

💡 Just talk to me naturally! ✨`;
        await sendMessage(senderId, { text: helpResponse }, pageAccessToken);
        break;
        
      default:
        const generalResponse = `╔══════════════════════════════════╗
║  🤔  𝗜𝗻𝘁𝗲𝗿𝗲𝘀𝘁𝗶𝗻𝗴!  ║
╚══════════════════════════════════╝

🌟 I understand you're asking about:
"${originalText}"

╭─ 💡 I can help with ──────────╮
│ 📊 Stock information          │
│ ⏰ Restock timing             │
│ 🌤️ Weather & bonuses          │
│ 💎 Divine item tracking       │
│ 🎮 Bot features & commands    │
╰────────────────────────────────╯

Try asking:
• "What stock today?"
• "When is next restock?"
• "Show me divine items"

🚀 I'm here to help! ✨`;
        await sendMessage(senderId, { text: generalResponse }, pageAccessToken);
    }
  } finally {
    // Turn off typing indicator
    await sendTypingIndicator(senderId, pageAccessToken, 'typing_off');
  }
}

// Auto scheduling system with voice messages
async function checkBotSchedule() {
  const now = getPHTime();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Check for bot offline time (12:00 AM)
  if (currentHour === BOT_OFFLINE_HOUR && currentMinute === BOT_OFFLINE_MINUTE && botIsOnline && !offlineMessageSent) {
    botIsOnline = false;
    offlineMessageSent = true;
    onlineMessageSent = false;

    // Send voice message and offline notification to all users
    for (const userId of activeSessions.keys()) {
      // Send voice message first
      await sendVoiceMessage(userId, VOICE_MESSAGE_URL, PAGE_ACCESS_TOKEN);
      
      // Then send offline message
      const offlineMessage = `╔══════════════════════════════════╗
║  🌙  𝗕𝗼𝘁 𝗥𝗲𝘀𝘁 𝗧𝗶𝗺𝗲  ║
╚══════════════════════════════════╝

😴 Time for a peaceful break!
🎵 Enjoy the relaxing music!

╭─ 🌙 Rest Schedule ────────────╮
│ 💤 Offline: 12:00 AM - 5:00 AM│
│ ☀️ Online: 5:00 AM - 12:00 AM │
│ 🎵 Voice: Multo relaxation    │
╰────────────────────────────────╯

🌟 Sweet dreams! See you at 5 AM! ✨`;
      
      await sendMessage(userId, { text: offlineMessage }, PAGE_ACCESS_TOKEN);
      
      // Stop tracking sessions
      const session = activeSessions.get(userId);
      if (session) {
        clearTimeout(session.timeout);
        activeSessions.delete(userId);
        lastSentCache.delete(userId);
        stockClearingAlerts.delete(userId);
      }
    }

    logger.system('🌙 Bot is now offline for scheduled rest time with voice message');
  }

  // Check for bot online time (5:00 AM)
  if (currentHour === BOT_ONLINE_HOUR && currentMinute === BOT_ONLINE_MINUTE && !botIsOnline && !onlineMessageSent) {
    botIsOnline = true;
    onlineMessageSent = true;
    offlineMessageSent = false;

    // Send online notification to admin
    if (ADMIN_USER_ID) {
      const onlineMessage = `╔══════════════════════════════════╗
║  ☀️  𝗕𝗼𝘁 𝗢𝗻𝗹𝗶𝗻𝗲!  ║
╚══════════════════════════════════╝

🌅 Good morning! Bot is back online!

╭─ ☀️ Online Schedule ──────────╮
│ 🟢 Status: Fully operational  │
│ ⏰ Time: 5:00 AM - 12:00 AM   │
│ 🚀 Features: All systems go   │
│ ✨ Ready: For beautiful day   │
╰────────────────────────────────╯

🌟 Enhanced tracking resumed! ✨`;

      await sendMessage(ADMIN_USER_ID, { text: onlineMessage }, PAGE_ACCESS_TOKEN);
    }

    logger.system('☀️ Bot is now online for scheduled active time');
  }
}

// Check schedule every minute
setInterval(checkBotSchedule, 60 * 1000);

// Enhanced Stock Clearing System (silent mode)
async function sendStockClearingAlert(userId) {
  // Silent cache clearing - no more alert messages
  setTimeout(() => {
    lastSentCache.delete(userId);
    stockClearingAlerts.delete(userId);
    logger.info(`🧹 Cleared stock cache for user: ${userId}`);
  }, STOCK_CLEAR_WARNING_TIME);
}

// Enhanced main gagstock command with better aesthetics and refresh button
const gagstockCommand = {
  name: "gagstock",
  aliases: ["gag", "stock", "track"],
  description: "Enhanced Grow A Garden stock tracker with beautiful formatting",
  usage: "gagstock on | gagstock on [filter] | gagstock off",
  category: "Tools ⚒️",
  async execute(senderId, args, pageAccessToken) {
    if (!botIsOnline) {
      const offlineResponse = `╔══════════════════════════════════╗
║  🌙  𝗕𝗼𝘁 𝗥𝗲𝘀𝘁𝗶𝗻𝗴  ║
╚══════════════════════════════════╝

😴 I'm currently in rest mode 
   (12:00 AM - 5:00 AM)

🌟 Come back at 5:00 AM for 
   enhanced tracking! ✨`;
      await sendMessage(senderId, { text: offlineResponse }, pageAccessToken);
      return;
    }

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

    await sendTypingIndicator(senderId, pageAccessToken, 'typing_on');

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
│ 💬 Natural language support   │
│ 🔄 Quick refresh button       │
╰────────────────────────────────╯

${filters.length > 0 ? 
`🎯 𝗙𝗶𝗹𝘁𝗲𝗿𝗶𝗻𝗴 𝗳𝗼𝗿: ${filters.join(', ')}` : 
'📊 𝗧𝗿𝗮𝗰𝗸𝗶𝗻𝗴: All items & categories'}

Sit back, relax, and let our enhanced
system do all the work! 🌱💚`;

    await sendMessage(senderId, { text: startMessage }, pageAccessToken);
    await sendTypingIndicator(senderId, pageAccessToken, 'typing_off');
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

        // Check if user has DND enabled
        if (userDoNotDisturb.has(senderId) && !alwaysSend) {
          return false; // Skip notifications if DND is active
        }

        if (!alwaysSend && lastSent && lastSent !== currentKey) {
          if (!stockClearingAlerts.has(senderId)) {
            stockClearingAlerts.set(senderId, true);
            await sendStockClearingAlert(senderId);
          }
        }

        if (!alwaysSend && lastSent === currentKey) return false;
        if (filters.length > 0 && !matchedItems) return false;
        
        // Check for divine items and send special alert
        const divineItems = checkDivineItems(stockData);
        if (divineItems.length > 0 && !userDoNotDisturb.has(senderId)) {
          const divineAlert = `╔══════════════════════════════════╗
║  💎  𝗗𝗜𝗩𝗜𝗡𝗘 𝗔𝗟𝗘𝗥𝗧! ║
║      ⚡ 𝗦𝗣𝗘𝗖𝗜𝗔𝗟 𝗜𝗧𝗘𝗠! ⚡    ║
╚══════════════════════════════════╝

🚨 **RARE DIVINE ITEMS IN STOCK!** 🚨

${divineItems.map(item => `🌟 ${addEmoji(item.name)}: ${formatValue(item.value)}`).join('\n')}

⚡ **ACT FAST!** These divine items 
   are extremely rare and sell out 
   within minutes! 

🏃‍♂️💨 Get them NOW! 💎✨`;
          
          await sendMessage(senderId, { text: divineAlert }, pageAccessToken);
        }

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

        // Send message with refresh button
        const messageWithRefreshButton = {
          text: message,
          quick_replies: [
            {
              content_type: "text",
              title: "🔄 Refresh Stock",
              payload: "REFRESH_STOCK"
            },
            {
              content_type: "text", 
              title: "💎 Divine Items",
              payload: "DIVINE_ITEMS"
            },
            {
              content_type: "text",
              title: "⏰ Next Restock",
              payload: "NEXT_RESTOCK"
            }
          ]
        };

        await sendMessage(senderId, messageWithRefreshButton, pageAccessToken);

        // Send beautiful developer signature image
        const messageWithImage = {
          attachment: {
            type: "image",
            payload: {
              url: "https://github.com/Lazy-dev-hash/user-attachmens/blob/main/New%20Project%207%20%5B3D158B3%5D.png",
              is_reusable: true
            }
          }
        };

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
        if (!session || !botIsOnline) return;

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

// Enhanced Refresh Command with aesthetic button
const refreshCommand = {
  name: "refresh",
  aliases: ["reload", "sync", "update"],
  description: "Force refresh all stock data with cache clearing",
  usage: "refresh",
  category: "Tools ⚒️",
  async execute(senderId, args, pageAccessToken) {
    if (!botIsOnline) {
      const offlineResponse = `╔══════════════════════════════════╗
║  🌙  𝗕𝗼𝘁 𝗥𝗲𝘀𝘁𝗶𝗻𝗴  ║
╚══════════════════════════════════╝

😴 I'm currently in rest mode 
   (12:00 AM - 5:00 AM)

🌟 Come back at 5:00 AM for 
   enhanced tracking! ✨`;
      await sendMessage(senderId, { text: offlineResponse }, pageAccessToken);
      return;
    }

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

    // Send typing indicator
    await sendTypingIndicator(senderId, pageAccessToken, 'typing_on');

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

      // Send message with aesthetic refresh button
      const messageWithRefreshButton = {
        text: message,
        quick_replies: [
          {
            content_type: "text",
            title: "🔄 Refresh Again",
            payload: "REFRESH_STOCK"
          },
          {
            content_type: "text", 
            title: "💎 Divine Items",
            payload: "DIVINE_ITEMS"
          },
          {
            content_type: "text",
            title: "⏰ Next Restock",
            payload: "NEXT_RESTOCK"
          },
          {
            content_type: "text",
            title: "🌤️ Weather Info",
            payload: "WEATHER_INFO"
          }
        ]
      };

      await sendMessage(senderId, messageWithRefreshButton, pageAccessToken);

      // Send beautiful developer signature image
      const messageWithImage = {
        attachment: {
          type: "image",
          payload: {
            url: "https://github.com/Lazy-dev-hash/user-attachmens/blob/main/New%20Project%207%20%5B3D158B3%5D.png",
            is_reusable: true
          }
        }
      };

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
    } finally {
      await sendTypingIndicator(senderId, pageAccessToken, 'typing_off');
    }
  }
};

// Do Not Disturb Command
const doNotDisturbCommand = {
  name: "dnd",
  aliases: ["donotdisturb", "quiet", "silence"],
  description: "Toggle do not disturb mode to pause notifications",
  usage: "dnd on | dnd off | dnd status",
  category: "Tools ⚒️",
  async execute(senderId, args, pageAccessToken) {
    const action = args[0]?.toLowerCase();
    
    if (!action || !['on', 'off', 'status'].includes(action)) {
      const usageMessage = `╔══════════════════════════════════╗
║  🔕  𝗗𝗼 𝗡𝗼𝘁 𝗗𝗶𝘀𝘁𝘂𝗿𝗯  ║
║      𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗚𝘂𝗶𝗱𝗲 ✨        ║
╚══════════════════════════════════╝

🌙 𝗔𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲 𝗢𝗽𝘁𝗶𝗼𝗻𝘀:

╭─ 🔕 Enable DND Mode ──────────╮
│ dnd on                        │
│ └─ Pause all notifications    │
╰────────────────────────────────╯

╭─ 🔔 Disable DND Mode ─────────╮
│ dnd off                       │
│ └─ Resume notifications       │
╰────────────────────────────────╯

╭─ 📊 Check DND Status ─────────╮
│ dnd status                    │
│ └─ View current DND state     │
╰────────────────────────────────╯

Perfect for peaceful moments! 🌸✨`;
      return await sendMessage(senderId, { text: usageMessage }, pageAccessToken);
    }

    if (action === 'on') {
      userDoNotDisturb.set(senderId, true);
      const enableMessage = `╔══════════════════════════════════╗
║  🔕  𝗗𝗼 𝗡𝗼𝘁 𝗗𝗶𝘀𝘁𝘂𝗿𝗯  ║
║      𝗔𝗰𝘁𝗶𝘃𝗮𝘁𝗲𝗱! 🌙          ║
╚══════════════════════════════════╝

😌 Peaceful mode is now active!

╭─ 🌸 DND Features Enabled ─────╮
│ 🔕 Stock notifications: OFF   │
│ 🌙 Auto updates: Paused       │
│ ✨ Divine alerts: Silenced    │
│ 💤 Peaceful experience: ON    │
╰────────────────────────────────╯

🧘‍♀️ Enjoy your tranquil time!
   Type 'dnd off' to resume. 🌟`;
      
      await sendMessage(senderId, { text: enableMessage }, pageAccessToken);
      logger.info(`🔕 Do Not Disturb enabled for user: ${senderId}`);
      
    } else if (action === 'off') {
      userDoNotDisturb.delete(senderId);
      const disableMessage = `╔══════════════════════════════════╗
║  🔔  𝗗𝗼 𝗡𝗼𝘁 𝗗𝗶𝘀𝘁𝘂𝗿𝗯  ║
║      𝗗𝗶𝘀𝗮𝗯𝗹𝗲𝗱! ✨          ║
╚══════════════════════════════════╝

🎉 Welcome back! Notifications resumed!

╭─ 🌟 Active Features Restored ─╮
│ 🔔 Stock notifications: ON    │
│ ⚡ Auto updates: Active       │
│ 💎 Divine alerts: Enabled     │
│ 🚀 Full experience: Restored  │
╰────────────────────────────────╯

🌱 Ready to track stocks again! 💚`;
      
      await sendMessage(senderId, { text: disableMessage }, pageAccessToken);
      logger.info(`🔔 Do Not Disturb disabled for user: ${senderId}`);
      
    } else if (action === 'status') {
      const isEnabled = userDoNotDisturb.has(senderId);
      const statusIcon = isEnabled ? '🔕' : '🔔';
      const statusText = isEnabled ? 'ENABLED' : 'DISABLED';
      const statusEmoji = isEnabled ? '🌙' : '🌟';
      
      const statusMessage = `╔══════════════════════════════════╗
║  📊  𝗗𝗡𝗗 𝗦𝘁𝗮𝘁𝘂𝘀 ${statusIcon}  ║
╚══════════════════════════════════╝

${statusEmoji} Do Not Disturb: **${statusText}**

╭─ 📱 Current Settings ─────────╮
│ 🔔 Notifications: ${isEnabled ? 'Paused   ' : 'Active   '} │
│ ⚡ Auto Updates: ${isEnabled ? 'Disabled ' : 'Enabled  '} │
│ 💎 Divine Alerts: ${isEnabled ? 'Silenced' : 'Enabled  '} │
│ 🌸 Peace Mode: ${isEnabled ? 'ON       ' : 'OFF      '} │
╰────────────────────────────────╯

${isEnabled ? 
'🧘‍♀️ Enjoying peaceful moments...\n   Type "dnd off" to resume! 🌙' : 
'🚀 All systems active & ready!\n   Type "dnd on" for peace! ✨'}`;
      
      await sendMessage(senderId, { text: statusMessage }, pageAccessToken);
    }
  }
};

// Next Stock Command
const nextStockCommand = {
  name: "nextstock",
  aliases: ["next", "nextstk", "upcoming"],
  description: "Track next stock restock for specific categories",
  usage: "nextstock [gear|seed|egg] | nextstock all",
  category: "Tools ⚒️",
  async execute(senderId, args, pageAccessToken) {
    const category = args[0]?.toLowerCase();
    
    if (!category || !['gear', 'seed', 'egg', 'all'].includes(category)) {
      const usageMessage = `╔══════════════════════════════════╗
║  ⏰  𝗡𝗲𝘅𝘁 𝗦𝘁𝗼𝗰𝗸 ║
║      𝗧𝗿𝗮𝗰𝗸𝗲𝗿 🎯              ║
╚══════════════════════════════════╝

🌟 𝗔𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲 𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝗶𝗲𝘀:

╭─ 🛠️ Gear Tracking ────────────╮
│ nextstock gear                │
│ └─ Next gear restock timer    │
╰────────────────────────────────╯

╭─ 🌱 Seeds Tracking ───────────╮
│ nextstock seed                │
│ └─ Next seed restock timer    │
╰────────────────────────────────╯

╭─ 🥚 Eggs Tracking ────────────╮
│ nextstock egg                 │
│ └─ Next egg restock timer     │
╰────────────────────────────────╯

╭─ 📊 All Categories ───────────╮
│ nextstock all                 │
│ └─ Complete restock overview  │
╰────────────────────────────────╯

Perfect for timing your purchases! ⏰✨`;
      return await sendMessage(senderId, { text: usageMessage }, pageAccessToken);
    }

    const restocks = getNextRestocks();
    
    if (category === 'all') {
      const allStockMessage = `╔══════════════════════════════════╗
║  ⏰  𝗔𝗹𝗹 𝗦𝘁𝗼𝗰𝗸 ║
║      𝗥𝗲𝘀𝘁𝗼𝗰𝗸 𝗧𝗶𝗺𝗲𝗿𝘀 🎯       ║
╚══════════════════════════════════╝

🌟 **Complete Restock Schedule:**

╭─ 🛠️ Gear & Tools ─────────────╮
│ ⏰ Next Restock: ${restocks.gear}        │
│ 🔄 Frequency: Every 5 minutes  │
╰────────────────────────────────╯

╭─ 🌱 Seeds & Plants ───────────╮
│ ⏰ Next Restock: ${restocks.seed}        │
│ 🔄 Frequency: Every 3 minutes  │
╰────────────────────────────────╯

╭─ 🥚 Eggs & Pets ──────────────╮
│ ⏰ Next Restock: ${restocks.egg}        │
│ 🔄 Frequency: Every 30 minutes │
╰────────────────────────────────╯

╭─ 🍯 Honey Products ───────────╮
│ ⏰ Next Restock: ${restocks.honey}        │
│ 🔄 Frequency: Every hour       │
╰────────────────────────────────╯

╭─ 🎨 Cosmetics ────────────────╮
│ ⏰ Next Restock: ${restocks.cosmetics}        │
│ 🔄 Frequency: Every 7 hours    │
╰────────────────────────────────╯

🎯 Perfect timing awaits! ✨`;
      
      await sendMessage(senderId, { text: allStockMessage }, pageAccessToken);
      
    } else {
      const categoryEmojis = {
        'gear': '🛠️',
        'seed': '🌱', 
        'egg': '🥚'
      };
      
      const categoryNames = {
        'gear': 'Gear & Tools',
        'seed': 'Seeds & Plants',
        'egg': 'Eggs & Pets'
      };
      
      const frequencies = {
        'gear': 'Every 5 minutes',
        'seed': 'Every 3 minutes',
        'egg': 'Every 30 minutes'
      };
      
      const nextTime = restocks[category];
      const emoji = categoryEmojis[category];
      const name = categoryNames[category];
      const frequency = frequencies[category];
      
      const categoryMessage = `╔══════════════════════════════════╗
║  ${emoji}  𝗡𝗲𝘅𝘁 ${name.split(' ')[0]} ║
║      𝗥𝗲𝘀𝘁𝗼𝗰𝗸 𝗧𝗶𝗺𝗲𝗿 ⏰         ║
╚══════════════════════════════════╝

🎯 **${name} Tracking:**

╭─ ⏰ Restock Information ──────╮
│ 🕐 Next Restock: ${nextTime}       │
│ 🔄 Frequency: ${frequency}    │
│ 📊 Category: ${name}         │
│ ✨ Status: Tracking Active    │
╰────────────────────────────────╯

💡 **Pro Tips:**
• Set a timer for optimal timing
• Check 30 seconds before restock
• Be ready for fast purchases

🌟 Happy shopping timing! 🛒✨`;
      
      await sendMessage(senderId, { text: categoryMessage }, pageAccessToken);
    }
  }
};

// Custom Command for Allowed Users
const customCommand = {
  name: "custom",
  aliases: ["vip", "special", "premium"],
  description: "Special commands for authorized users",
  usage: "custom [action]",
  category: "Premium 👑",
  async execute(senderId, args, pageAccessToken) {
    if (!customCommandUsers.has(senderId) && senderId !== ADMIN_USER_ID) {
      const unauthorizedMessage = `╔══════════════════════════════════╗
║  🔒  𝗣𝗿𝗲𝗺𝗶𝘂𝗺 𝗔𝗰𝗰𝗲𝘀𝘀  ║
║      𝗥𝗲𝗾𝘂𝗶𝗿𝗲𝗱! ✨            ║
╚══════════════════════════════════╝

🌟 This is an exclusive premium 
   command for VIP users only.

╭─ 💎 How to Get Access ────────╮
│ 👑 Contact the bot admin      │
│ 🎯 Request special permission  │
│ ✨ Unlock premium features     │
│ 🌟 Enjoy exclusive commands    │
╰────────────────────────────────╯

🌱 Continue using regular commands!
💚 Thank you for understanding! ✨`;
      return await sendMessage(senderId, { text: unauthorizedMessage }, pageAccessToken);
    }

    const action = args[0]?.toLowerCase();
    
    if (!action) {
      const premiumMessage = `╔══════════════════════════════════╗
║  👑  𝗣𝗿𝗲𝗺𝗶𝘂𝗺 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀  ║
║      𝗔𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲! ✨           ║
╚══════════════════════════════════╝

🌟 Welcome to Premium Access!

╭─ 💎 Available Commands ───────╮
│ custom divine                 │
│ └─ Track divine items only    │
│                               │
│ custom alerts                 │
│ └─ Enhanced alert system      │
│                               │
│ custom priority               │
│ └─ Priority notifications     │
│                               │
│ custom analytics              │
│ └─ Advanced stock analytics   │
╰────────────────────────────────╯

🚀 Exclusive features at your 
   fingertips! Enjoy premium! 💎✨`;
      
      return await sendMessage(senderId, { text: premiumMessage }, pageAccessToken);
    }

    if (action === 'divine') {
      // Send typing indicator
      await sendTypingIndicator(senderId, pageAccessToken, 'typing_on');
      
      try {
        const [stockRes] = await Promise.all([
          fetchWithTimeout("https://gagstock.gleeze.com/grow-a-garden")
        ]);

        const backup = stockRes.data.data;
        const stockData = {
          gearStock: backup.gear.items.map(i => ({ name: i.name, value: Number(i.quantity) })),
          seedsStock: backup.seed.items.map(i => ({ name: i.name, value: Number(i.quantity) })),
          eggStock: backup.egg.items.map(i => ({ name: i.name, value: Number(i.quantity) })),
          cosmeticsStock: backup.cosmetics.items.map(i => ({ name: i.name, value: Number(i.quantity) })),
          honeyStock: backup.honey.items.map(i => ({ name: i.name, value: Number(i.quantity) })),
        };

        const divineItems = checkDivineItems(stockData);
        
        if (divineItems.length === 0) {
          const noDivineMessage = `╔══════════════════════════════════╗
║  💎  𝗗𝗶𝘃𝗶𝗻𝗲 𝗜𝘁𝗲𝗺𝘀 ║
║      𝗦𝗲𝗮𝗿𝗰𝗵 🔍              ║
╚══════════════════════════════════╝

😔 No divine items in stock currently.

╭─ 🌟 Monitored Divine Items ───╮
│ 🌱 Beanstalk                  │
│ 💧 Basic Sprinkler            │
│ 🌊 Master Sprinkler           │
│ ⛲ Godly Sprinkler            │
│ 🔥 Ember Lily                 │
╰────────────────────────────────╯

✨ Keep checking - they restock 
   regularly! Premium tracking 
   will alert you! 💎`;
          
          await sendMessage(senderId, { text: noDivineMessage }, pageAccessToken);
        } else {
          const divineList = divineItems.map(item => `  ├─ ${addEmoji(item.name)}: ${formatValue(item.value)}`).join("\n");
          
          const divineMessage = `╔══════════════════════════════════╗
║  💎  𝗗𝗶𝘃𝗶𝗻𝗲 𝗜𝘁𝗲𝗺𝘀 ║
║      𝗙𝗼𝘂𝗻𝗱! ✨               ║
╚══════════════════════════════════╝

🎉 Divine items are in stock!

╭─ 🌟 Available Divine Items ───╮
${divineList}
╰────────────────────────────────╯

⚡ **Premium Alert:** These rare 
   items are available NOW!

🏃‍♂️ Act fast - divine items sell 
   out quickly! 💎✨`;
          
          await sendMessage(senderId, { text: divineMessage }, pageAccessToken);
        }
        
      } catch (error) {
        const errorMessage = `╔══════════════════════════════════╗
║  ❌  𝗣𝗿𝗲𝗺𝗶𝘂𝗺 𝗘𝗿𝗿𝗼𝗿  ║
╚══════════════════════════════════╝

😔 Unable to fetch divine items 
   data at this moment.

🔄 Please try again shortly!
💎 Premium features will resume! ✨`;
        await sendMessage(senderId, { text: errorMessage }, pageAccessToken);
      } finally {
        await sendTypingIndicator(senderId, pageAccessToken, 'typing_off');
      }
    }
  }
};

// ===================================================================================
// 5. COMMAND HANDLER
// ===================================================================================

const commands = new Map();

// Register all commands
[gagstockCommand, refreshCommand, doNotDisturbCommand, nextStockCommand, customCommand].forEach(cmd => {
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

// Enhanced message handler with natural language processing
async function handleMessage(senderId, message) {
  if (!message.text) return;

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

  // Handle quick reply responses
  if (message.quick_reply) {
    const payload = message.quick_reply.payload;
    
    switch (payload) {
      case 'REFRESH_STOCK':
        await refreshCommand.execute(senderId, [], PAGE_ACCESS_TOKEN);
        return;
      case 'DIVINE_ITEMS':
        await customCommand.execute(senderId, ['divine'], PAGE_ACCESS_TOKEN);
        return;
      case 'NEXT_RESTOCK':
        await nextStockCommand.execute(senderId, ['all'], PAGE_ACCESS_TOKEN);
        return;
      case 'WEATHER_INFO':
        const weatherResponse = `╔══════════════════════════════════╗
║  🌤️  𝗪𝗲𝗮𝘁𝗵𝗲𝗿 𝗜𝗻𝗳𝗼  ║
╚══════════════════════════════════╝

🌟 Current weather affects your crops!

🔄 Use 'refresh' or start tracking 
   to see live weather updates! ✨`;
        await sendMessage(senderId, { text: weatherResponse }, PAGE_ACCESS_TOKEN);
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
    // Process natural language queries
    const queryType = processNaturalLanguageQuery(text);
    
    if (queryType !== 'general_question' || text.includes('?')) {
      await handleNaturalLanguageQuery(senderId, queryType, text, PAGE_ACCESS_TOKEN);
    } else if (commandName === 'help') {
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
│ 🔕 dnd on/off                  │
│    Toggle notifications        │
│                                │
│ ⏰ nextstock [category]        │
│    Check restock timers        │
╰────────────────────────────────╯

╭─ 💬 Natural Language ─────────╮
│ Just ask me questions like:    │
│ "What stock today?"           │
│ "When is next restock?"       │
│ "Show me divine items"        │
╰────────────────────────────────╯

╭─ 🌟 Enhanced Features ─────────╮
│ 🤖 Version: ${systemVersion} (Latest)      │
│ 🌐 Auto-schedule: 5AM-12AM    │
│ 🎨 Premium aesthetics enabled │
│ 🔄 Smart cache management     │
│ ✨ Beautiful notifications    │
│ 💬 Natural language support   │
│ 🔄 Quick refresh buttons      │
╰────────────────────────────────╯

💫 Enhanced & ready to serve! 🚀`;
      await sendMessage(senderId, { text: helpMessage }, PAGE_ACCESS_TOKEN);
    } else {
      logger.warn(`❓ Enhanced command not found: '${commandName}' from user ${senderId}`);
      const unknownMessage = `╔══════════════════════════════════╗
║  ❓  𝗘𝗻𝗵𝗮𝗻𝗰𝗲𝗱 𝗖𝗼𝗺𝗺𝗮𝗻𝗱  ║
║      𝗡𝗼𝘁 𝗥𝗲𝗰𝗼𝗴𝗻𝗶𝘇𝗲𝗱! 🤔       ║
╚══════════════════════════════════╝

🤖 I didn't understand '${commandName}', 
   but you can ask me naturally!

╭─ 💡 Try These Examples ───────╮
│ 💬 "What stock today?"         │
│ 💬 "When is next restock?"     │
│ 💬 "Show me divine items"      │
│ 💬 "What's the weather?"       │
│ 📖 Type 'help' - See commands │
╰────────────────────────────────╯

🌟 I understand natural language
   and I'm here to help! 💚✨`;
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
  logger.banner('🚀 Enhanced GagStock Bot Server v3.1.0', `Listening on port ${PORT} with premium features`);
  logger.success('✨ Custom timing & voice messages enabled!');
  logger.success('🧠 Natural language processing active!');
  logger.success('⚡ Typing indicators configured!');
  logger.success('🔄 Aesthetic refresh buttons ready!');
  logger.success('🌙 Auto schedule: Offline 12AM-5AM');
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
    botOnline: botIsOnline,
    customSchedule: {
      offlineTime: `${BOT_OFFLINE_HOUR}:${String(BOT_OFFLINE_MINUTE).padStart(2, '0')}`,
      onlineTime: `${BOT_ONLINE_HOUR}:${String(BOT_ONLINE_MINUTE).padStart(2, '0')}`,
      voiceMessageUrl: VOICE_MESSAGE_URL
    },
    enhancedFeatures: {
      customTiming: true,
      voiceMessages: true,
      naturalLanguageProcessing: true,
      typingIndicators: true,
      refreshButtons: true,
      autoScheduling: true,
      stockClearing: true,
      premiumAesthetics: true,
      smartCaching: true,
      rateLimit: true
    },
    message: `Bot is running with enhanced love! ${heartbeat} Custom schedule & voice messages active!`
  };

  res.status(200).json(health);
});

logger.banner('🌟 Enhanced GagStock Bot v3.1.0', 'Premium features with custom timing activated!');
logger.success('🌸 ═══════════════════════════════════════════════════════════ 🌸');
logger.success('✨                    𝓓𝓮𝓿𝓮𝓵𝓸𝓹 𝓫𝔂 𝓢𝓤𝓝𝓝𝓔𝓛                      ✨');
logger.success('💫              Enhanced with Custom Timing & Voice                💫');
logger.success('🌸 ═══════════════════════════════════════════════════════════ 🌸');
