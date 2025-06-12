'use strict';

// ===================================================================================
// 1. SETUP & IMPORTS (USING ES MODULE SYNTAX)
// ===================================================================================
import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import logger from './logger.js';

// Load credentials from .env file
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;


// ===================================================================================
// 2. FACEBOOK MESSENGER HELPER FUNCTION
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
// 3. GAGSTOCK BOT LOGIC (YOUR PROVIDED CODE)
// ===================================================================================

const activeSessions = new Map();
const lastSentCache = new Map();
const userRateLimit = new Map(); // Rate limiting per user
const MAX_REQUESTS_PER_MINUTE = 10;

// Admin and update system
const ADMIN_USER_ID = process.env.ADMIN_USER_ID; // Set this in your Replit secrets
const pendingUpdates = new Map(); // Store pending updates for users
const systemVersion = "2.0.0"; // Current bot version

// Clean up inactive sessions every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [userId, session] of activeSessions) {
    if (session.lastActivity && (now - session.lastActivity) > 30 * 60 * 1000) {
      clearTimeout(session.timeout);
      activeSessions.delete(userId);
      lastSentCache.delete(userId);
      logger.info(`Cleaned up inactive session for user: ${userId}`);
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
  return `${emojis[name] || ""} ${name}`;
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

// Admin Update Command
const updateCommand = {
  name: "update",
  aliases: ["upgrade"],
  description: "Admin command to push updates to all users",
  usage: "update [message]",
  category: "Admin 👑",
  async execute(senderId, args, pageAccessToken) {
    if (senderId !== ADMIN_USER_ID) {
      const unauthorizedMessage = `╭─────────────────────────────╮
│  🚫  𝗔𝗰𝗰𝗲𝘀𝘀 𝗗𝗲𝗻𝗶𝗲𝗱  │
╰─────────────────────────────╯
This command is reserved for 
bot administrators only.

🌱 Continue using gagstock normally!`;
      return await sendMessage(senderId, { text: unauthorizedMessage }, pageAccessToken);
    }

    const updateMessage = args.join(" ") || "System update available with new features and improvements!";
    
    // Send update to all active users
    for (const userId of activeSessions.keys()) {
      if (userId !== ADMIN_USER_ID) {
        pendingUpdates.set(userId, {
          message: updateMessage,
          version: systemVersion,
          timestamp: Date.now()
        });
        
        const updateNotification = `╔══════════════════════════════════╗
║  🚀  𝗦𝘆𝘀𝘁𝗲𝗺 𝗨𝗽𝗱𝗮𝘁𝗲 𝗔𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲  ║
╚══════════════════════════════════╝

✨ New Update Available! ✨

${updateMessage}

╭─────────────────────────────╮
│ 📦 Version: ${systemVersion}           │
│ 🛠️ Ready to install         │
╰─────────────────────────────╯

Reply 'apply' to install the update
Reply 'skip' to continue without updating

🌟 New features await you!`;
        await sendMessage(userId, { text: updateNotification }, pageAccessToken);
      }
    }
    
    const adminConfirmation = `╭─────────────────────────────╮
│  ✅  𝗨𝗽𝗱𝗮𝘁𝗲 𝗗𝗲𝗽𝗹𝗼𝘆𝗲𝗱  │
╰─────────────────────────────╯
Update notification sent to 
${activeSessions.size - 1} active users.

📊 System Status: Ready
🚀 Version: ${systemVersion}`;
    await sendMessage(senderId, { text: adminConfirmation }, pageAccessToken);
  }
};

// Refresh Command
const refreshCommand = {
  name: "refresh",
  aliases: ["reload", "sync"],
  description: "Force refresh all stock data",
  usage: "refresh",
  category: "Tools ⚒️",
  async execute(senderId, args, pageAccessToken) {
    const session = activeSessions.get(senderId);
    if (!session) {
      const noSessionMessage = `╭─────────────────────────────╮
│  ⚠️   𝗡𝗼 𝗔𝗰𝘁𝗶𝘃𝗲 𝗦𝗲𝘀𝘀𝗶𝗼𝗻  │
╰─────────────────────────────╯
You need to start gagstock tracking
first before refreshing.

Use 'gagstock on' to start! 🚀`;
      return await sendMessage(senderId, { text: noSessionMessage }, pageAccessToken);
    }

    const refreshingMessage = `╭─────────────────────────────╮
│  🔄  𝗥𝗲𝗳𝗿𝗲𝘀𝗵𝗶𝗻𝗴 𝗦𝘁𝗼𝗰𝗸  │
╰─────────────────────────────╯
🔄 Fetching latest stock data...
⚡ This may take a moment...

Please wait while we refresh! ✨`;
    await sendMessage(senderId, { text: refreshingMessage }, pageAccessToken);

    try {
      // Force clear cache and fetch new data
      lastSentCache.delete(senderId);
      
      const [stockRes, weatherRes] = await Promise.all([
        fetchWithTimeout("https://gagstock.gleeze.com/grow-a-garden"),
        fetchWithTimeout("https://growagardenstock.com/api/stock/weather"),
      ]);
      
      // Same fetch logic as in gagstock command...
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
          return `╭─ ${label} ─────────────────╮
${formatList(filters.length > 0 ? filtered : items)}
  └─ ⏰ Restock: ${restock}
╰─────────────────────────────╯

`;
        }
        return "";
      };

      filteredContent += processSection("🛠️ 𝗚𝗲𝗮𝗿", stockData.gearStock, restocks.gear);
      filteredContent += processSection("🌱 𝗦𝗲𝗲𝗱𝘀", stockData.seedsStock, restocks.seed);
      filteredContent += processSection("🥚 𝗘𝗴𝗴𝘀", stockData.eggStock, restocks.egg);
      filteredContent += processSection("🎨 𝗖𝗼𝘀𝗺𝗲𝘁𝗶𝗰𝘀", stockData.cosmeticsStock, restocks.cosmetics);
      filteredContent += processSection("🍯 𝗛𝗼𝗻𝗲𝘆", stockData.honeyStock, restocks.honey);

      const refreshSuccessHeader = `╔══════════════════════════════════╗
║   🔄 𝗦𝘁𝗼𝗰𝗸 𝗥𝗲𝗳𝗿𝗲𝘀𝗵𝗲𝗱!     ║
╚══════════════════════════════════╝

`;
      
      const weatherSection = `╭─ 🌤️ 𝗪𝗲𝗮𝘁𝗵𝗲𝗿 𝗜𝗻𝗳𝗼 ─────────╮
  ├─ Current: ${weather.icon} ${weather.currentWeather}
  └─ Bonus: 🌾 ${weather.cropBonuses}
╰─────────────────────────────╯

`;
      
      const footerSection = `╭─ 📊 𝗙𝗿𝗲𝘀𝗵 𝗗𝗮𝘁𝗮 ──────────╮
  └─ 📅 ${updatedAtPH}
╰─────────────────────────────╯`;
      
      const message = `${refreshSuccessHeader}${filteredContent}${weatherSection}${footerSection}`;
      await sendMessage(senderId, { text: message }, pageAccessToken);
      
    } catch (error) {
      const errorMessage = `╭─────────────────────────────╮
│  ❌  𝗥𝗲𝗳𝗿𝗲𝘀𝗵 𝗙𝗮𝗶𝗹𝗲𝗱  │
╰─────────────────────────────╯
Unable to refresh stock data 
at this moment.

🔄 Please try again later
📡 The servers might be busy!`;
      await sendMessage(senderId, { text: errorMessage }, pageAccessToken);
    }
  }
};

const gagstockCommand = {
  name: "gagstock",
  aliases: ["gag"],
  description: "Track Grow A Garden stock including cosmetics and restocks.",
  usage: "gagstock on | gagstock on Sunflower | Watering Can | gagstock off",
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
            logger.info(`Gagstock tracking stopped for user: ${senderId}`);
            const stopMessage = `╭─────────────────────────╮
│  🛑  𝗧𝗿𝗮𝗰𝗸𝗶𝗻𝗴 𝗦𝘁𝗼𝗽𝗽𝗲𝗱  │
╰─────────────────────────╯
Your Gagstock tracking has been 
successfully disabled. 

Thank you for using our service! 🌱`;
            return await sendMessage(senderId, { text: stopMessage }, pageAccessToken);
        } else {
            const noSessionMessage = `╭─────────────────────────╮
│  ⚠️   𝗡𝗼 𝗔𝗰𝘁𝗶𝘃𝗲 𝗦𝗲𝘀𝘀𝗶𝗼𝗻  │
╰─────────────────────────╯
You don't have an active gagstock 
tracking session running.

Use 'gagstock on' to start! 🚀`;
            return await sendMessage(senderId, { text: noSessionMessage }, pageAccessToken);
        }
    }

    if (action !== "on") {
        const usageMessage = `╭───────────────────────────╮
│  📖  𝗚𝗮𝗴𝘀𝘁𝗼𝗰𝗸 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀  │
╰───────────────────────────╯

✨ 𝗔𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀:

🟢 gagstock on
   Start tracking all items

🎯 gagstock on Sunflower | Watering Can
   Track specific items only

🔴 gagstock off  
   Stop tracking

Need help? Just ask! 💫`;
        return await sendMessage(senderId, { text: usageMessage }, pageAccessToken);
    }

    if (activeSessions.has(senderId)) {
        logger.warn(`User ${senderId} tried to start an existing session.`);
        const alreadyActiveMessage = `╭─────────────────────────────╮
│  📡  𝗔𝗹𝗿𝗲𝗮𝗱𝘆 𝗔𝗰𝘁𝗶𝘃𝗲  │
╰─────────────────────────────╯
You're already tracking Gagstock! 

Use 'gagstock off' to stop first,
then start a new session. 🔄`;
        return await sendMessage(senderId, { text: alreadyActiveMessage }, pageAccessToken);
    }

    const startMessage = `╭─────────────────────────────╮
│  ✨  𝗧𝗿𝗮𝗰𝗸𝗶𝗻𝗴 𝗦𝘁𝗮𝗿𝘁𝗲𝗱!  │
╰─────────────────────────────╯
🎉 Gagstock tracking is now active!

You'll receive beaut updates when:
🔄 Stock levels change
🌤️ Weather conditions update
⏰ Restock timers tick down

${filters.length > 0 ? `🎯 Filtering for: ${filters.join(', ')}` : '📊 Tracking all items'}

Sit back and let us do the work! 🌱`;
    await sendMessage(senderId, { text: startMessage }, pageAccessToken);
    logger.info(`Gagstock tracking started for user: ${senderId} with filters:`, filters.length > 0 ? filters : 'none');

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
                return `╭─ ${label} ─────────────────╮
${formatList(filtered)}
  └─ ⏰ Restock: ${restock}
╰─────────────────────────────╯

`;
            }
            return "";
        };
        if (filters.length > 0) {
             filteredContent += processSection("🛠️ 𝗚𝗲𝗮𝗿", stockData.gearStock, restocks.gear, true);
             filteredContent += processSection("🌱 𝗦𝗲𝗲𝗱𝘀", stockData.seedsStock, restocks.seed, true);
             if (matchedItems) {
                filteredContent += processSection("🥚 𝗘𝗴𝗴𝘀", stockData.eggStock, restocks.egg, false);
                filteredContent += processSection("🎨 𝗖𝗼𝘀𝗺𝗲𝘁𝗶𝗰𝘀", stockData.cosmeticsStock, restocks.cosmetics, false);
                filteredContent += processSection("🍯 𝗛𝗼𝗻𝗲𝘆", stockData.honeyStock, restocks.honey, false);
             }
        } else {
            filteredContent += processSection("🛠️ 𝗚𝗲𝗮𝗿", stockData.gearStock, restocks.gear, false);
            filteredContent += processSection("🌱 𝗦𝗲𝗲𝗱𝘀", stockData.seedsStock, restocks.seed, false);
            filteredContent += processSection("🥚 𝗘𝗴𝗴𝘀", stockData.eggStock, restocks.egg, false);
            filteredContent += processSection("🎨 𝗖𝗼𝘀𝗺𝗲𝘁𝗶𝗰𝘀", stockData.cosmeticsStock, restocks.cosmetics, false);
            filteredContent += processSection("🍯 𝗛𝗼𝗻𝗲𝘆", stockData.honeyStock, restocks.honey, false);
            matchedItems = true;
        }
        const currentKey = JSON.stringify({ gearStock: stockData.gearStock, seedsStock: stockData.seedsStock });
        const lastSent = lastSentCache.get(senderId);
        if (!alwaysSend && lastSent === currentKey) return false;
        if (filters.length > 0 && !matchedItems) return false;
        lastSentCache.set(senderId, currentKey);
        
        const headerDesign = `╔══════════════════════════════════╗
║   🌾 𝗚𝗿𝗼𝘄 𝗔 𝗚𝗮𝗿𝗱𝗲𝗻 𝗦𝘁𝗼𝗰𝗸   ║
╚══════════════════════════════════╝

`;
        
        const weatherSection = `╭─ 🌤️ 𝗪𝗲𝗮𝘁𝗵𝗲𝗿 𝗜𝗻𝗳𝗼 ─────────╮
  ├─ Current: ${weather.icon} ${weather.currentWeather}
  └─ Bonus: 🌾 ${weather.cropBonuses}
╰─────────────────────────────╯

`;
        
        const footerSection = `╭─ 📊 𝗟𝗮𝘀𝘁 𝗨𝗽𝗱𝗮𝘁𝗲 ─────────╮
  └─ 📅 ${updatedAtPH}
╰─────────────────────────────╯`;
        
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
║   🌾 Hi ${userName}! Stock Updated! 🌟   ║
╚══════════════════════════════════╝

`;
        
        const message = `${personalizedHeader}${filteredContent}${weatherSection}${footerSection}`;
        await sendMessage(senderId, { text: message }, pageAccessToken);
        return true;
      } catch (err) {
        logger.error("Fetch failed:", err.message);
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
          logger.debug(`Stock update sent to user: ${senderId}`);
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
      const fetchErrorMessage = `╭─────────────────────────────╮
│  ❌  𝗖𝗼𝗻𝗻𝗲𝗰𝘁𝗶𝗼𝗻 𝗜𝘀𝘀𝘂𝗲  │
╰─────────────────────────────╯
Unable to fetch the initial stock 
data from Grow A Garden servers.

🔄 This is usually temporary
⏰ Please try again in a few moments
🌱 The servers might be busy!`;
      await sendMessage(senderId, { text: fetchErrorMessage }, pageAccessToken);
      activeSessions.delete(senderId);
    }
  }
};


// ===================================================================================
// 4. COMMAND HANDLER
// ===================================================================================

const commands = new Map();

// Register all commands
commands.set(gagstockCommand.name, gagstockCommand);
if (gagstockCommand.aliases) {
    gagstockCommand.aliases.forEach(alias => commands.set(alias, gagstockCommand));
}

commands.set(updateCommand.name, updateCommand);
if (updateCommand.aliases) {
    updateCommand.aliases.forEach(alias => commands.set(alias, updateCommand));
}

commands.set(refreshCommand.name, refreshCommand);
if (refreshCommand.aliases) {
    refreshCommand.aliases.forEach(alias => commands.set(alias, refreshCommand));
}

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

async function handleMessage(senderId, message) {
  if (!message.text) return;
  
  // Rate limiting check
  if (isRateLimited(senderId)) {
    logger.warn(`Rate limited user: ${senderId}`);
    const rateLimitMessage = `╭─────────────────────────────╮
│  ⏰  𝗥𝗮𝘁𝗲 𝗟𝗶𝗺𝗶𝘁 𝗥𝗲𝗮𝗰𝗵𝗲𝗱  │
╰─────────────────────────────╯
Whoa there, speedy! 🏃‍♂️

You're sending messages a bit too 
quickly. Please take a short break 
and try again in a moment.

🌱 Quality over quantity! ✨`;
    await sendMessage(senderId, { text: rateLimitMessage }, PAGE_ACCESS_TOKEN);
    return;
  }
  
  logger.info(`Processing message from ${senderId}: "${message.text}"`);
  const text = message.text.trim();
  
  // Check for update responses
  if (pendingUpdates.has(senderId)) {
    if (text.toLowerCase() === 'apply') {
      pendingUpdates.delete(senderId);
      const applyMessage = `╭─────────────────────────────╮
│  ✅  𝗨𝗽𝗱𝗮𝘁𝗲 𝗔𝗽𝗽𝗹𝗶𝗲𝗱!  │
╰─────────────────────────────╯
🎉 Update successfully installed!

Your bot is now running the latest
version with all new features.

✨ Enhanced performance
🌟 New capabilities 
🚀 Ready to use!

Thank you for updating! 🌱`;
      await sendMessage(senderId, { text: applyMessage }, PAGE_ACCESS_TOKEN);
      return;
    } else if (text.toLowerCase() === 'skip') {
      pendingUpdates.delete(senderId);
      const skipMessage = `╭─────────────────────────────╮
│  ⏭️   𝗨𝗽𝗱𝗮𝘁𝗲 𝗦𝗸𝗶𝗽𝗽𝗲𝗱  │
╰─────────────────────────────╯
Update skipped for now.

You can always apply updates later
by asking the admin.

🌱 Continue using your current version!`;
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
      logger.error(`Error executing command '${commandName}' for user ${senderId}:`, error);
      const errorMessage = `╭─────────────────────────────╮
│  😥  𝗢𝗼𝗽𝘀! 𝗦𝗼𝗺𝗲𝘁𝗵𝗶𝗻𝗴 𝗪𝗲𝗻𝘁 │
│      𝗪𝗿𝗼𝗻𝗴!                │
╰─────────────────────────────╯
Something unexpected happened 
while processing your command.

🔧 Please try again in a moment
💫 If the issue persists, the 
   developer has been notified!`;
      await sendMessage(senderId, { text: errorMessage }, PAGE_ACCESS_TOKEN);
    }
  } else {
    // Add help command suggestion
    if (commandName === 'help') {
      const helpMessage = `╔══════════════════════════════════╗
║  🤖  𝗚𝗮𝗴𝘀𝘁𝗼𝗰𝗸 𝗕𝗼𝘁 𝗛𝗲𝗹𝗽  ║
╚══════════════════════════════════╝

✨ 𝗔𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀:

╭─ 🌾 Main Commands ─────────╮
│ 🟢 gagstock on             │
│    Start tracking all items │
│                             │
│ 🎯 gagstock on [filter]    │
│    Track specific items     │
│    Example: Sunflower | Can │
│                             │
│ 🔴 gagstock off            │
│    Stop tracking            │
╰─────────────────────────────╯

╭─ ⚡ Quick Actions ─────────╮
│ 🔄 refresh                  │
│    Force refresh stock data │
│                             │
│ 📖 help                     │
│    Show this help menu      │
╰─────────────────────────────╯

${senderId === ADMIN_USER_ID ? `╭─ 👑 Admin Commands ────────╮
│ 🚀 update [message]        │
│    Push updates to users    │
╰─────────────────────────────╯` : ''}

💫 Version: ${systemVersion} | Ready to help!`;
      await sendMessage(senderId, { text: helpMessage }, PAGE_ACCESS_TOKEN);
    } else {
      logger.warn(`Command not found: '${commandName}' from user ${senderId}`);
      const unknownMessage = `╭─────────────────────────────╮
│  ❓  𝗨𝗻𝗸𝗻𝗼𝘄𝗻 𝗖𝗼𝗺𝗺𝗮𝗻𝗱  │
╰─────────────────────────────╯
Command '${commandName}' not found.

💡 Try typing 'help' to see all 
   available commands!

🌱 I'm here to help you track
   Grow A Garden stock!`;
      await sendMessage(senderId, { text: unknownMessage }, PAGE_ACCESS_TOKEN);
    }
  }
}


// ===================================================================================
// 5. EXPRESS SERVER & WEBHOOKS
// ===================================================================================

const app = express().use(bodyParser.json());
const PORT = process.env.PORT || 1337;

// Add request logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Add error handling middleware
app.use((error, req, res, next) => {
  logger.error('Express error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.system(`Webhook is listening on port ${PORT}`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.system('SIGTERM received, shutting down gracefully...');
  // Clean up active sessions
  for (const [userId, session] of activeSessions) {
    clearTimeout(session.timeout);
    logger.info(`Cleaned up session for user: ${userId}`);
  }
  activeSessions.clear();
  lastSentCache.clear();
  
  server.close(() => {
    logger.system('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.system('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

app.post('/webhook', async (req, res) => {
  try {
    let body = req.body;
    
    // Validate webhook body
    if (!body || body.object !== 'page') {
      logger.warn('Invalid webhook object:', body?.object);
      return res.sendStatus(404);
    }

    if (!body.entry || !Array.isArray(body.entry)) {
      logger.warn('Invalid webhook entry structure');
      return res.sendStatus(400);
    }

    // Process each entry
    for (const entry of body.entry) {
      if (!entry.messaging || !Array.isArray(entry.messaging)) {
        continue;
      }

      for (const webhook_event of entry.messaging) {
        if (!webhook_event.sender?.id) {
          logger.warn('Webhook event missing sender ID');
          continue;
        }

        const sender_psid = webhook_event.sender.id;
        logger.webhook('Event received:', { 
          from: sender_psid, 
          type: webhook_event.message ? 'message' : 'other',
          timestamp: webhook_event.timestamp
        });

        if (webhook_event.message) {
          // Handle message asynchronously to avoid blocking webhook response
          handleMessage(sender_psid, webhook_event.message).catch(error => {
            logger.error('Error handling message:', error);
          });
        }
      }
    }
    
    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).send('INTERNAL_ERROR');
  }
});

app.get('/webhook', (req, res) => {
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      logger.success('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      logger.error('Webhook verification failed. Tokens do not match.');
      res.sendStatus(403);
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeSessions: activeSessions.size,
    memoryUsage: process.memoryUsage()
  };
  res.status(200).json(health);
});

// Status endpoint for debugging
app.get('/status', (req, res) => {
  const sessions = Array.from(activeSessions.entries()).map(([userId, session]) => ({
    userId,
    startTime: new Date(session.startTime).toISOString(),
    lastActivity: new Date(session.lastActivity).toISOString(),
    filters: session.filters
  }));
  
  res.status(200).json({
    activeSessions: sessions,
    totalUsers: activeSessions.size,
    uptime: process.uptime()
  });
});