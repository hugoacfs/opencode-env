#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION } from './version.js';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command-line arguments
const args = process.argv.slice(2);

// Show help
function showHelp() {
  console.log(`
Trading 212 MCP Server

USAGE:
  trading212-mcp [OPTIONS]

OPTIONS:
  -h, --help                 Show this help message
  -v, --version              Show version information
  -k, --api-key <key>        Trading 212 API key
  -e, --environment <env>    Environment: "demo" or "live" (default: "demo")
      --http                 Start as HTTP server (Streamable HTTP transport)
  -p, --port <port>          HTTP server port (default: 3012)
      --host <host>          HTTP server host (default: 0.0.0.0)

ENVIRONMENT VARIABLES:
  TRADING212_API_KEY         Trading 212 API key (required)
  TRADING212_ENVIRONMENT     Environment: "demo" or "live" (default: "demo")
  TRADING212_TRANSPORT       Transport: "stdio" or "http" (default: "stdio")
  TRADING212_MCP_PORT        HTTP server port (default: 3012)
  TRADING212_MCP_HOST        HTTP server host (default: 0.0.0.0)

EXAMPLES:
  # Stdio transport (for Claude Desktop command-based config)
  export TRADING212_API_KEY="your_api_key_here"
  trading212-mcp

  # HTTP transport (for URL-based config)
  trading212-mcp --http --port 3001
  # Then configure: { "url": "http://localhost:3012/mcp" }

CLAUDE DESKTOP CONFIGURATION:

  Option 1 — Stdio (command-based):
  {
    "mcpServers": {
      "trading212": {
        "command": "trading212-mcp",
        "env": {
          "TRADING212_API_KEY": "your_api_key",
          "TRADING212_ENVIRONMENT": "demo"
        }
      }
    }
  }

  Option 2 — HTTP (URL-based, start server first):
  {
    "mcpServers": {
      "trading212": {
        "url": "http://localhost:3012/mcp"
      }
    }
  }

DOCUMENTATION:
  GitHub: https://github.com/enderekici/trading212-mcp
  API Docs: https://docs.trading212.com/api

VERSION:
  ${VERSION}
`);
}

// Show version
function showVersion() {
  console.log(`trading212-mcp version ${VERSION}`);
}

// Parse arguments
let apiKey = process.env.TRADING212_API_KEY;
let environment = process.env.TRADING212_ENVIRONMENT || 'demo';
let useHttp = process.env.TRADING212_TRANSPORT === 'http';
let port = process.env.TRADING212_MCP_PORT || '3012';
let host = process.env.TRADING212_MCP_HOST || '0.0.0.0';

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === '-h' || arg === '--help') {
    showHelp();
    process.exit(0);
  }

  if (arg === '-v' || arg === '--version') {
    showVersion();
    process.exit(0);
  }

  if (arg === '-k' || arg === '--api-key') {
    apiKey = args[++i];
  }

  if (arg === '-e' || arg === '--environment') {
    environment = args[++i];
    if (environment !== 'demo' && environment !== 'live') {
      console.error('Error: Environment must be "demo" or "live"');
      process.exit(1);
    }
  }

  if (arg === '--http') {
    useHttp = true;
  }

  if (arg === '-p' || arg === '--port') {
    port = args[++i];
  }

  if (arg === '--host') {
    host = args[++i];
  }
}

// Validate configuration
if (!apiKey) {
  console.error('Error: TRADING212_API_KEY is required');
  console.error('');
  console.error('Set it via environment variable:');
  console.error('  export TRADING212_API_KEY="your_api_key"');
  console.error('');
  console.error('Or pass it as a command-line argument:');
  console.error('  trading212-mcp --api-key your_api_key');
  console.error('');
  console.error('Run "trading212-mcp --help" for more information');
  process.exit(1);
}

// Set environment variables for the child process
const env = {
  ...process.env,
  TRADING212_API_KEY: apiKey,
  TRADING212_ENVIRONMENT: environment,
  ...(useHttp
    ? {
        TRADING212_TRANSPORT: 'http',
        TRADING212_MCP_PORT: port,
        TRADING212_MCP_HOST: host,
      }
    : {}),
};

// Determine the path to index.js
const indexPath = join(__dirname, 'index.js');

// Spawn the MCP server
const serverProcess = spawn('node', [indexPath], {
  env,
  stdio: 'inherit',
});

// Handle process termination
process.on('SIGINT', () => {
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  serverProcess.kill('SIGTERM');
  process.exit(0);
});

// Forward exit code
serverProcess.on('exit', (code) => {
  process.exit(code || 0);
});

// Handle errors
serverProcess.on('error', (error) => {
  console.error('Failed to start MCP server:', error.message);
  process.exit(1);
});
