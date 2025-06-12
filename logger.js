
// logger.js
import chalk from 'chalk';

/**
 * Returns a formatted timestamp string.
 * e.g., [10:30:15 AM]
 */
function getTimestamp() {
  return chalk.gray(`[${new Date().toLocaleTimeString()}]`);
}

/**
 * The core logging function.
 * @param {function} levelColor - The chalk function for the level's background color.
 * @param {string} icon - The emoji icon for the level.
 * @param {string} tag - The text tag for the level (e.g., 'INFO', 'ERROR').
 * @param  {...any} messages - The messages to log.
 */
function log(levelColor, icon, tag, ...messages) {
  const timestamp = getTimestamp();

  // Create a styled tag, e.g., [ INFO ]
  const levelTag = levelColor.bold(` ${icon} ${tag.padEnd(7)} `);

  // Format all messages. If an object is passed, pretty-print it as JSON.
  const formattedMessages = messages.map(msg => {
    if (typeof msg === 'object' && msg !== null) {
      // Add indentation to pretty-printed JSON
      return '\n' + JSON.stringify(msg, null, 2).replace(/^/gm, '    ');
    }
    return msg;
  }).join(' ');

  console.log(`${timestamp} ${levelTag} ${formattedMessages}`);
}

// Export the logger object with different level methods.
const logger = {
  info: (...messages) => log(chalk.bgBlue.white, 'ℹ️', 'INFO', ...messages),
  warn: (...messages) => log(chalk.bgYellow.black, '⚠️', 'WARN', ...messages),
  error: (...messages) => log(chalk.bgRed.white, '❌', 'ERROR', ...messages),
  success: (...messages) => log(chalk.bgGreen.white, '✅', 'SUCCESS', ...messages),
  system: (...messages) => log(chalk.bgCyan.black, '⚙️', 'SYSTEM', ...messages),
  webhook: (...messages) => log(chalk.bgMagenta.white, '📥', 'WEBHOOK', ...messages),
};

export default logger;
