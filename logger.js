// logger.js

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

/**
 * Returns a formatted, colored timestamp string.
 * @returns {string} e.g., [10:30:15 AM]
 */
function getTimestamp() {
  return chalk.gray(`[${new Date().toLocaleTimeString()}]`);
}

/**
 * The core logging function.
 * @param {import('chalk').Chalk} levelColor - The chalk function for the level's background color.
 * @param {string} icon - The emoji icon for the level.
 * @param {string} tag - The text tag for the level (e.g., 'INFO', 'ERROR').
 * @param {keyof LOG_LEVELS} levelName - The name of the log level for filtering.
 * @param {...any} messages - The messages to log.
 */
function log(levelColor, icon, tag, levelName, ...messages) {
  // 1. Check if this log level should be displayed
  if (LOG_LEVELS[levelName] < CURRENT_LEVEL) {
    return;
  }

  const timestamp = getTimestamp();
  const levelTag = levelColor.bold(` ${icon} ${tag.padEnd(7)} `);

  // 2. Separate Error objects from other messages for special formatting
  const errorStacks = [];
  const processedMessages = messages.map(msg => {
    if (msg instanceof Error) {
      // Keep the error message in the main line, and save the stack for later
      errorStacks.push(chalk.gray(msg.stack));
      return chalk.redBright(msg.message);
    }
    if (typeof msg === 'object' && msg !== null) {
      // Pretty-print objects
      return JSON.stringify(msg, null, 2);
    }
    return msg;
  });

  // 3. Print the main log line
  console.log(`${timestamp} ${levelTag} ${processedMessages.join(' ')}`);

  // 4. Print any error stacks on new lines
  if (errorStacks.length > 0) {
    console.log(errorStacks.join('\n'));
  }
}

// Export the logger object with different level methods.
const logger = {
  /** Logs detailed debugging information. Hidden by default in production. */
  debug: (...messages) => log(chalk.bgHex('#5A4FCF').white, '🐞', 'DEBUG', 'debug', ...messages),

  /** Logs general information about application flow. */
  info: (...messages) => log(chalk.bgBlue.white, 'ℹ️', 'INFO', 'info', ...messages),

  /** Logs warnings that something might be wrong but isn't critical. */
  warn: (...messages) => log(chalk.bgYellow.black, '⚠️', 'WARN', 'warn', ...messages),

  /** Logs critical errors. Automatically prints stack traces for Error objects. */
  error: (...messages) => log(chalk.bgRed.white, '❌', 'ERROR', 'error', ...messages),

  /** Logs successful operations, like a successful database connection. */
  success: (...messages) => log(chalk.bgGreen.white, '✅', 'SUCCESS', 'success', ...messages),

  /** Logs system-level events, like server start. */
  system: (...messages) => log(chalk.bgCyan.black, '⚙️', 'SYSTEM', 'system', ...messages),

  /** Logs incoming webhook events. */
  webhook: (...messages) => log(chalk.bgMagenta.white, '📥', 'WEBHOOK', 'webhook', ...messages),
};

export default logger;