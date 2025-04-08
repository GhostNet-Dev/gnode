// logger.ts
import chalk from 'chalk'; // npm install chalk

type LogLevel = 'info' | 'warn' | 'error';

function getCallerLocation(): string {
  const stack = new Error().stack?.split('\n') || [];

  for (let i = 2; i < stack.length; i++) {
    const line = stack[i];
    if (!line.includes('logger.') && !line.includes('getCallerLocation')) {
      const match = line.match(/\((.*)\)/);
      return match ? match[1] : line.trim();
    }
  }
  return 'unknown';
}

function formatMessage(level: LogLevel, message: any[]): string {
  const time = new Date().toISOString();
  const location = getCallerLocation();

  let levelLabel = '';
  switch (level) {
    case 'info':
      levelLabel = chalk.blue('INFO ');
      break;
    case 'warn':
      levelLabel = chalk.yellow('WARN ');
      break;
    case 'error':
      levelLabel = chalk.red('ERROR');
      break;
  }

  return `${chalk.gray(time)} [${levelLabel}] (${chalk.cyan(location)}): ${message.join(' ')}`;
}

export const logger = {
  info: (...args: any[]) => console.log(formatMessage('info', args)),
  warn: (...args: any[]) => console.warn(formatMessage('warn', args)),
  error: (...args: any[]) => console.error(formatMessage('error', args)),
};

