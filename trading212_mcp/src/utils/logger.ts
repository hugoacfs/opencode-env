import pino from 'pino';

// Write logs to stderr so they don't interfere with MCP stdio transport on stdout
const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    redact: {
      paths: ['apiKey', 'password', 'token', 'authorization'],
      censor: '[REDACTED]',
    },
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
              destination: 2,
            },
          }
        : undefined,
  },
  process.env.NODE_ENV === 'production' ? pino.destination(2) : undefined,
);

export default logger;
