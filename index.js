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
  const nextEgg = new Date(now);
  nextEgg.setMinutes(now.getMinutes() < 30 ? 30 : 0);
  if (now.getMinutes() >= 30) nextEgg.setHours(now.getHours() + 1);
  nextEgg.setSeconds(0, 0);
  timers.egg = getCountdown(nextEgg);
  const next5 = new Date(now);
  const nextM = Math.ceil((now.getMinutes() + (now.getSeconds() > 0 ? 1 : 0)) / 5) * 5;
  next5.setMinutes(nextM === 60 ? 0 : nextM, 0, 0);
  if (nextM === 60) next5.setHours(now.getHours() + 1);
  timers.gear = timers.seed = getCountdown(next5);
  const nextHour = new Date(now);
  nextHour.setHours(now.getHours() + 1, 0, 0, 0);
  timers.honey = getCountdown(nextHour);
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
            return await sendMessage(senderId, { text: "🛑 Gagstock tracking stopped." }, pageAccessToken);
        } else {
            return await sendMessage(senderId, { text: "⚠️ You don't have an active gagstock session." }, pageAccessToken);
        }
    }

    if (action !== "on") {
        return await sendMessage(senderId, {
            text: "📌 Usage:\n• gagstock on\n• gagstock on Sunflower | Watering Can\n• gagstock off",
        }, pageAccessToken);
    }

    if (activeSessions.has(senderId)) {
        logger.warn(`User ${senderId} tried to start an existing session.`);
        return await sendMessage(senderId, {
            text: "📡 You're already tracking Gagstock. Use gagstock off to stop.",
        }, pageAccessToken);
    }

    await sendMessage(senderId, { text: "✅ Gagstock tracking started! You'll be notified when stock or weather changes." }, pageAccessToken);
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
        const formatList = (arr) => arr.map(i => `- ${addEmoji(i.name)}: ${formatValue(i.value)}`).join("\n");
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
                return `${label}:\n${formatList(filtered)}\n⏳ Restock In: ${restock}\n\n`;
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
        const message = `🌾 𝗚𝗿𝗼𝘄 𝗔 𝗚𝗮𝗿𝗱𝗲𝗻 — 𝗧𝗿𝗮𝗰𝗸𝗲𝗿\n\n${filteredContent}🌤️ 𝗪𝗲𝗮𝘁𝗵𝗲𝗿: ${weather.icon} ${weather.currentWeather}\n🌾 Crop Bonus: ${weather.cropBonuses}\n📅 Updated at (Philippines): ${updatedAtPH}`;
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
      await sendMessage(senderId, { text: "❌ Failed to fetch initial stock data. Please try again later." }, pageAccessToken);
      activeSessions.delete(senderId);
    }
  }
};


// ===================================================================================
// 4. COMMAND HANDLER
// ===================================================================================

const commands = new Map();
commands.set(gagstockCommand.name, gagstockCommand);
if (gagstockCommand.aliases) {
    gagstockCommand.aliases.forEach(alias => commands.set(alias, gagstockCommand));
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
    await sendMessage(senderId, { 
      text: "⏰ You're sending messages too quickly. Please wait a moment before trying again." 
    }, PAGE_ACCESS_TOKEN);
    return;
  }
  
  logger.info(`Processing message from ${senderId}: "${message.text}"`);
  const text = message.text.trim();
  const args = text.split(/\s+/);
  const commandName = args.shift().toLowerCase();
  const command = commands.get(commandName);

  if (command) {
    try {
      await command.execute(senderId, args, PAGE_ACCESS_TOKEN);
    } catch (error) {
      logger.error(`Error executing command '${commandName}' for user ${senderId}:`, error);
      await sendMessage(senderId, { text: "😥 Oops! Something went wrong while running that command." }, PAGE_ACCESS_TOKEN);
    }
  } else {
    // Add help command suggestion
    if (commandName === 'help') {
      await sendMessage(senderId, { 
        text: "🤖 Available commands:\n• gagstock on - Start tracking\n• gagstock on [filter] - Track specific items\n• gagstock off - Stop tracking" 
      }, PAGE_ACCESS_TOKEN);
    } else {
      logger.warn(`Command not found: '${commandName}' from user ${senderId}`);
      await sendMessage(senderId, { 
        text: `❓ Unknown command '${commandName}'. Type 'help' for available commands.` 
      }, PAGE_ACCESS_TOKEN);
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