
import chalk from 'chalk';

/**
 * --- CONFIGURATION ---
 * Define the hierarchy of log levels.
 * The logger will only output messages with a level equal to or higher than CURRENT_LEVEL.
 */
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  success: 1,
  webhook: 1,
  system: 1,
  warn: 2,
  error: 3,
};

// Get the desired log level from environment variables, defaulting to 'info'.
const CURRENT_LEVEL_NAME = process.env.LOG_LEVEL?.toLowerCase() || 'info';
const CURRENT_LEVEL = LOG_LEVELS[CURRENT_LEVEL_NAME] ?? LOG_LEVELS.info;

// Aesthetic configuration
const CONFIG = {
  showBorder: true,
  showTimestamp: true,
  useGradients: true,
  compactMode: false,
  maxLineLength: 120,
};

/**
 * Creates beautiful gradient text effects
 */
function createGradient(text, colors) {
  if (!CONFIG.useGradients || colors.length < 2) return colors[0](text);
  
  const chars = text.split('');
  const step = Math.max(1, Math.floor(chars.length / (colors.length - 1)));
  
  return chars.map((char, i) => {
    const colorIndex = Math.min(Math.floor(i / step), colors.length - 1);
    return colors[colorIndex](char);
  }).join('');
}

/**
 * Returns a beautifully formatted timestamp with gradient colors
 */
function getTimestamp() {
  if (!CONFIG.showTimestamp) return '';
  
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
  
  const gradientTime = createGradient(time, [
    chalk.hex('#FF6B6B'),
    chalk.hex('#4ECDC4'),
    chalk.hex('#45B7D1')
  ]);
  
  return chalk.gray('┃ ') + gradientTime + chalk.gray(' ┃');
}

/**
 * Creates a decorative border line
 */
function getBorderLine(length = 80, style = '━') {
  return CONFIG.showBorder ? chalk.gray(style.repeat(length)) : '';
}

/**
 * Formats objects with better readability
 */
function formatObject(obj) {
  if (obj === null) return chalk.gray('null');
  if (obj === undefined) return chalk.gray('undefined');
  
  const jsonStr = JSON.stringify(obj, null, 2);
  return jsonStr
    .replace(/"([^"]+)":/g, chalk.cyan('"$1"') + chalk.white(':'))
    .replace(/: "([^"]*)"/g, ': ' + chalk.green('"$1"'))
    .replace(/: (\d+)/g, ': ' + chalk.yellow('$1'))
    .replace(/: (true|false)/g, ': ' + chalk.magenta('$1'))
    .replace(/: null/g, ': ' + chalk.gray('null'));
}

/**
 * Wraps long text to fit within the specified line length
 */
function wrapText(text, maxLength) {
  if (text.length <= maxLength) return [text];
  
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + word).length > maxLength) {
      if (currentLine) {
        lines.push(currentLine.trim());
        currentLine = '';
      }
    }
    currentLine += word + ' ';
  }
  
  if (currentLine) {
    lines.push(currentLine.trim());
  }
  
  return lines;
}

/**
 * Enhanced core logging function with beautiful formatting
 */
function log(levelConfig, levelName, ...messages) {
  // Check if this log level should be displayed
  if (LOG_LEVELS[levelName] < CURRENT_LEVEL) {
    return;
  }

  const timestamp = getTimestamp();
  const { color, bgColor, icon, label, accent } = levelConfig;
  
  // Create beautiful level badge
  const levelBadge = bgColor.bold(` ${icon} ${label.padEnd(8)} `);
  const levelAccent = accent || color;
  
  // Process messages
  const errorStacks = [];
  const processedMessages = messages.map(msg => {
    if (msg instanceof Error) {
      errorStacks.push(
        chalk.gray('┌─ Stack Trace ') + chalk.gray('─'.repeat(50)) + '\n' +
        chalk.redBright(msg.stack) + '\n' +
        chalk.gray('└─') + chalk.gray('─'.repeat(63))
      );
      return color.bold(msg.message);
    }
    if (typeof msg === 'object' && msg !== null) {
      return formatObject(msg);
    }
    return String(msg);
  });

  // Create the main message content
  const messageContent = processedMessages.join(' ');
  const messageLines = CONFIG.compactMode ? 
    [messageContent] : 
    wrapText(messageContent, CONFIG.maxLineLength - 30);

  // Print with beautiful formatting
  if (!CONFIG.compactMode && messageLines.length > 1) {
    console.log(getBorderLine(CONFIG.maxLineLength, '┌'));
  }
  
  // Main log line
  const mainLine = `${timestamp} ${levelBadge} ${levelAccent('▶')} ${color(messageLines[0])}`;
  console.log(mainLine);
  
  // Additional wrapped lines
  if (messageLines.length > 1) {
    const indent = ' '.repeat(timestamp.length + levelBadge.length + 3);
    messageLines.slice(1).forEach(line => {
      console.log(`${indent}${levelAccent('▷')} ${color(line)}`);
    });
  }
  
  if (!CONFIG.compactMode && messageLines.length > 1) {
    console.log(getBorderLine(CONFIG.maxLineLength, '└'));
  }

  // Print error stacks with beautiful formatting
  if (errorStacks.length > 0) {
    console.log('');
    errorStacks.forEach(stack => console.log(stack));
    console.log('');
  }
}

/**
 * Enhanced logger with beautiful styling and animations
 */
const logger = {
  /** Logs detailed debugging information with purple theme */
  debug: (...messages) => log({
    color: chalk.hex('#9D4EDD'),
    bgColor: chalk.bgHex('#6A4C93').white,
    icon: '🔍',
    label: 'DEBUG',
    accent: chalk.hex('#C77DFF')
  }, 'debug', ...messages),

  /** Logs general information with blue gradient theme */
  info: (...messages) => log({
    color: chalk.hex('#0077BE'),
    bgColor: chalk.bgHex('#023E8A').white,
    icon: 'ℹ️',
    label: 'INFO',
    accent: chalk.hex('#0096C7')
  }, 'info', ...messages),

  /** Logs warnings with orange gradient theme */
  warn: (...messages) => log({
    color: chalk.hex('#F77F00'),
    bgColor: chalk.bgHex('#D62828').white,
    icon: '⚠️',
    label: 'WARN',
    accent: chalk.hex('#FCBF49')
  }, 'warn', ...messages),

  /** Logs critical errors with red theme and special formatting */
  error: (...messages) => log({
    color: chalk.hex('#DC2626'),
    bgColor: chalk.bgHex('#991B1B').white,
    icon: '💥',
    label: 'ERROR',
    accent: chalk.hex('#EF4444')
  }, 'error', ...messages),

  /** Logs successful operations with green gradient theme */
  success: (...messages) => log({
    color: chalk.hex('#059669'),
    bgColor: chalk.bgHex('#047857').white,
    icon: '✨',
    label: 'SUCCESS',
    accent: chalk.hex('#10B981')
  }, 'success', ...messages),

  /** Logs system-level events with cyan theme */
  system: (...messages) => log({
    color: chalk.hex('#0891B2'),
    bgColor: chalk.bgHex('#0E7490').white,
    icon: '⚙️',
    label: 'SYSTEM',
    accent: chalk.hex('#06B6D4')
  }, 'system', ...messages),

  /** Logs incoming webhook events with magenta theme */
  webhook: (...messages) => log({
    color: chalk.hex('#C026D3'),
    bgColor: chalk.bgHex('#A21CAF').white,
    icon: '📡',
    label: 'WEBHOOK',
    accent: chalk.hex('#D946EF')
  }, 'webhook', ...messages),

  /** Special method for important announcements */
  banner: (title, subtitle = '') => {
    const borderChar = '═';
    const width = Math.max(title.length, subtitle.length) + 8;
    const border = borderChar.repeat(width);
    
    console.log('');
    console.log(chalk.cyan('╔' + border + '╗'));
    console.log(chalk.cyan('║') + createGradient(` ${title.padEnd(width - 2)} `, [
      chalk.hex('#FF6B6B'),
      chalk.hex('#4ECDC4'),
      chalk.hex('#45B7D1'),
      chalk.hex('#96CEB4')
    ]) + chalk.cyan('║'));
    
    if (subtitle) {
      console.log(chalk.cyan('║') + chalk.gray(` ${subtitle.padEnd(width - 2)} `) + chalk.cyan('║'));
    }
    
    console.log(chalk.cyan('╚' + border + '╝'));
    console.log('');
  },

  /** Configuration methods */
  setConfig: (newConfig) => Object.assign(CONFIG, newConfig),
  getConfig: () => ({ ...CONFIG }),
};

// Welcome banner on first import
logger.banner('🚀 Enhanced Logger Initialized', 'Beautiful logging with style and grace');

export default logger;
