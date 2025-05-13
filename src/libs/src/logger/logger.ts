import chalk from 'chalk';

export type LogBuffer  = {
  time: Date;
  level: string;
  location: string;
  message: string;
}

type LogLevel = 'info' | 'warn' | 'error';

const MAX_BUFFER_SIZE = 500;
const logBuffer: LogBuffer[] = [];
const isNode =
  typeof process !== "undefined" &&
  process.versions != null &&
  process.versions.node != null;

function getCallerLocation(): string {
  const stack = new Error().stack?.split('\n') || [];

  for (let i = 1; i < stack.length; i++) {
    const line = stack[i];

    if (
      line.includes('getCallerLocation') ||
      line.includes('formatMessage') ||
      line.includes('logger.')
    ) {
      continue;
    }

    const match = line.match(/\((.*)\)/);
    if (match && match[1]) {
      return match[1].replace(process.cwd(), '.');
    }

    const inlineMatch = line.match(/at (.*)/);
    if (inlineMatch && inlineMatch[1]) {
      return inlineMatch[1].replace(process.cwd(), '.');
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

function rawMessage(level: LogLevel, message: any[]) {
  const location = getCallerLocation();
  const logbuf: LogBuffer = {
    time: new Date(),
    level, location, message: message.join(' ')
  }
  return logbuf
}

function storeLog(msg: LogBuffer) {
  logBuffer.push(msg);
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift(); // FIFO - 오래된 로그 제거
  }
}

export const logger = {
  info: (...args: any[]) => {
    if (isNode) {
      const msg = formatMessage('info', args);
      console.log(msg);
      storeLog(rawMessage('info', args));
    } else {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (isNode) {
      const msg = formatMessage('warn', args);
      console.warn(msg);
      storeLog(rawMessage('warn', args));
    } else {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (isNode) {
      const msg = formatMessage('error', args);
      console.error(msg);
      storeLog(rawMessage('error', args));
    } else {
      console.log(...args);
    }
  },
  getBuffer: (): LogBuffer[] => [...logBuffer], // 복사본 반환
  clearBuffer: () => {
    logBuffer.length = 0;
  }
};

