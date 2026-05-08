#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import http from 'node:http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { Trading212Client } from './client.js';
import {
  CreatePieRequestSchema,
  ExportRequestSchema,
  LimitOrderRequestSchema,
  MarketOrderRequestSchema,
  StopLimitOrderRequestSchema,
  StopOrderRequestSchema,
} from './types.js';
import { AuthError, serializeError, ValidationError } from './utils/errors.js';
import logger from './utils/logger.js';
import { VERSION } from './version.js';

// Configuration from environment variables
const API_KEY = process.env.TRADING212_API_KEY;
const ENVIRONMENT = (process.env.TRADING212_ENVIRONMENT || 'demo') as 'demo' | 'live';

if (!API_KEY) {
  logger.error({
    msg: 'Missing API key',
    error: 'TRADING212_API_KEY environment variable is required',
  });
  throw AuthError.missingApiKey();
}

// Initialize Trading 212 client
const client = new Trading212Client({
  apiKey: API_KEY,
  environment: ENVIRONMENT,
});

function createServer(): Server {
  return new Server(
    {
      name: 'trading212-mcp',
      version: VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );
}

// Create MCP server
const server = createServer();

// Define all available tools
const tools: Tool[] = [
  // Account Management Tools
  {
    name: 'get_account_info',
    description: 'Retrieve account metadata including currency code and account ID',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_account_cash',
    description:
      'Get detailed cash balance information including free, invested, blocked, and total amounts',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_account_summary',
    description:
      'Get comprehensive account summary with cash, invested amounts, profit/loss, and available funds',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // Portfolio/Positions Tools
  {
    name: 'get_portfolio',
    description:
      'List all open positions in the portfolio with current prices, quantities, and profit/loss',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_position',
    description: 'Get detailed information about a specific position by ticker symbol',
    inputSchema: {
      type: 'object',
      properties: {
        ticker: {
          type: 'string',
          description: 'The ticker symbol of the instrument (e.g., AAPL, TSLA)',
        },
      },
      required: ['ticker'],
    },
  },

  // Order Management Tools
  {
    name: 'get_orders',
    description: 'Retrieve all active orders (pending, processing, etc.)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_order',
    description: 'Get detailed information about a specific order by order ID',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'number',
          description: 'The unique identifier of the order',
        },
      },
      required: ['orderId'],
    },
  },
  {
    name: 'cancel_order',
    description: 'Cancel an active order by order ID',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'number',
          description: 'The unique identifier of the order to cancel',
        },
      },
      required: ['orderId'],
    },
  },
  {
    name: 'place_market_order',
    description: 'Place a market order to buy or sell at the current market price',
    inputSchema: {
      type: 'object',
      properties: {
        ticker: {
          type: 'string',
          description: 'The ticker symbol of the instrument',
        },
        quantity: {
          type: 'number',
          description: 'The quantity to buy (positive) or sell (negative)',
        },
        extendedHours: {
          type: 'boolean',
          description: 'Allow execution outside regular trading hours (defaults to false)',
          default: false,
        },
      },
      required: ['ticker', 'quantity'],
    },
  },
  {
    name: 'place_limit_order',
    description: 'Place a limit order to buy or sell at a specified price or better',
    inputSchema: {
      type: 'object',
      properties: {
        ticker: {
          type: 'string',
          description: 'The ticker symbol of the instrument',
        },
        quantity: {
          type: 'number',
          description: 'The quantity to buy (positive) or sell (negative)',
        },
        limitPrice: {
          type: 'number',
          description: 'The limit price for the order',
        },
        timeValidity: {
          type: 'string',
          enum: ['DAY', 'GOOD_TILL_CANCEL'],
          description: 'Time validity of the order',
          default: 'DAY',
        },
      },
      required: ['ticker', 'quantity', 'limitPrice'],
    },
  },
  {
    name: 'place_stop_order',
    description: 'Place a stop order that becomes a market order when the stop price is reached',
    inputSchema: {
      type: 'object',
      properties: {
        ticker: {
          type: 'string',
          description: 'The ticker symbol of the instrument',
        },
        quantity: {
          type: 'number',
          description: 'The quantity to buy (positive) or sell (negative)',
        },
        stopPrice: {
          type: 'number',
          description: 'The stop price that triggers the market order',
        },
        timeValidity: {
          type: 'string',
          enum: ['DAY', 'GOOD_TILL_CANCEL'],
          description: 'Time validity of the order',
          default: 'DAY',
        },
      },
      required: ['ticker', 'quantity', 'stopPrice'],
    },
  },
  {
    name: 'place_stop_limit_order',
    description:
      'Place a stop-limit order that becomes a limit order when the stop price is reached',
    inputSchema: {
      type: 'object',
      properties: {
        ticker: {
          type: 'string',
          description: 'The ticker symbol of the instrument',
        },
        quantity: {
          type: 'number',
          description: 'The quantity to buy (positive) or sell (negative)',
        },
        stopPrice: {
          type: 'number',
          description: 'The stop price that triggers the limit order',
        },
        limitPrice: {
          type: 'number',
          description: 'The limit price for the order once triggered',
        },
        timeValidity: {
          type: 'string',
          enum: ['DAY', 'GOOD_TILL_CANCEL'],
          description: 'Time validity of the order',
          default: 'DAY',
        },
      },
      required: ['ticker', 'quantity', 'stopPrice', 'limitPrice'],
    },
  },

  // Instruments & Market Data Tools
  {
    name: 'get_instruments',
    description:
      'List all tradeable instruments with metadata including ISIN, currency, type, and trading schedules',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Optional search query to filter instruments by ticker, name, or ISIN',
        },
      },
    },
  },
  {
    name: 'get_exchanges',
    description: 'Get information about exchanges and their trading schedules',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // Pies Tools
  {
    name: 'get_pies',
    description:
      'List all investment pies (portfolio buckets) with their configurations and holdings',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_pie',
    description: 'Get detailed information about a specific pie by ID',
    inputSchema: {
      type: 'object',
      properties: {
        pieId: {
          type: 'number',
          description: 'The unique identifier of the pie',
        },
      },
      required: ['pieId'],
    },
  },
  {
    name: 'create_pie',
    description: 'Create a new investment pie with specified instruments and allocations',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the pie (1-50 characters)',
        },
        icon: {
          type: 'string',
          description: 'Icon identifier for the pie',
        },
        instrumentShares: {
          type: 'object',
          description:
            'Object mapping ticker symbols to their percentage allocation (e.g., {"AAPL": 0.5, "GOOGL": 0.5})',
          additionalProperties: { type: 'number' },
        },
        dividendCashAction: {
          type: 'string',
          enum: ['REINVEST', 'TO_ACCOUNT_CASH'],
          description: 'What to do with dividend cash',
        },
        goal: {
          type: 'number',
          description: 'Optional investment goal amount',
        },
      },
      required: ['name', 'icon', 'instrumentShares', 'dividendCashAction'],
    },
  },
  {
    name: 'update_pie',
    description: 'Update an existing pie configuration',
    inputSchema: {
      type: 'object',
      properties: {
        pieId: {
          type: 'number',
          description: 'The unique identifier of the pie',
        },
        name: {
          type: 'string',
          description: 'Updated name of the pie',
        },
        icon: {
          type: 'string',
          description: 'Updated icon identifier',
        },
        instrumentShares: {
          type: 'object',
          description: 'Updated instrument allocations',
          additionalProperties: { type: 'number' },
        },
        dividendCashAction: {
          type: 'string',
          enum: ['REINVEST', 'TO_ACCOUNT_CASH'],
          description: 'Updated dividend action',
        },
        goal: {
          type: 'number',
          description: 'Updated investment goal',
        },
      },
      required: ['pieId'],
    },
  },
  {
    name: 'delete_pie',
    description: 'Delete an investment pie by ID',
    inputSchema: {
      type: 'object',
      properties: {
        pieId: {
          type: 'number',
          description: 'The unique identifier of the pie to delete',
        },
      },
      required: ['pieId'],
    },
  },

  // Historical Data Tools
  {
    name: 'get_order_history',
    description: 'Get historical orders with pagination support',
    inputSchema: {
      type: 'object',
      properties: {
        cursor: {
          type: 'number',
          description: 'Pagination cursor for fetching next page',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default 50)',
        },
        ticker: {
          type: 'string',
          description: 'Filter by ticker symbol',
        },
      },
    },
  },
  {
    name: 'get_dividends',
    description: 'Get dividend payment history with pagination support',
    inputSchema: {
      type: 'object',
      properties: {
        cursor: {
          type: 'number',
          description: 'Pagination cursor for fetching next page',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return',
        },
        ticker: {
          type: 'string',
          description: 'Filter by ticker symbol',
        },
      },
    },
  },
  {
    name: 'get_transactions',
    description:
      'Get transaction history including deposits, withdrawals, orders, dividends, and fees',
    inputSchema: {
      type: 'object',
      properties: {
        cursor: {
          type: 'number',
          description: 'Pagination cursor for fetching next page',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return',
        },
      },
    },
  },
  {
    name: 'request_export',
    description: 'Request a CSV export of account data for a specified time period',
    inputSchema: {
      type: 'object',
      properties: {
        timeFrom: {
          type: 'string',
          description: 'Start date in ISO 8601 format (e.g., 2024-01-01T00:00:00Z)',
        },
        timeTo: {
          type: 'string',
          description: 'End date in ISO 8601 format',
        },
        includeDividends: {
          type: 'boolean',
          description: 'Include dividend data in export',
          default: true,
        },
        includeInterest: {
          type: 'boolean',
          description: 'Include interest data in export',
          default: true,
        },
        includeOrders: {
          type: 'boolean',
          description: 'Include order data in export',
          default: true,
        },
        includeTransactions: {
          type: 'boolean',
          description: 'Include transaction data in export',
          default: true,
        },
      },
      required: ['timeFrom', 'timeTo'],
    },
  },
];

// Zod schemas for tool input validation
const TickerInputSchema = z.object({
  ticker: z.string(),
});

const OrderIdInputSchema = z.object({
  orderId: z.number(),
});

const PieIdInputSchema = z.object({
  pieId: z.number(),
});

const SearchInputSchema = z.object({
  search: z.string().optional(),
});

const UpdatePieInputSchema = z.object({
  pieId: z.number(),
  name: z.string().optional(),
  icon: z.string().optional(),
  instrumentShares: z.record(z.string(), z.number()).optional(),
  dividendCashAction: z.enum(['REINVEST', 'TO_ACCOUNT_CASH']).optional(),
  goal: z.number().optional(),
});

const DeletePieInputSchema = z.object({
  pieId: z.number(),
});

const PaginatedInputSchema = z.object({
  cursor: z.number().optional(),
  limit: z.number().optional(),
});

const PaginatedWithTickerInputSchema = z.object({
  cursor: z.number().optional(),
  limit: z.number().optional(),
  ticker: z.string().optional(),
});

const ExportInputSchema = z.object({
  timeFrom: z.string(),
  timeTo: z.string(),
  includeDividends: z.boolean().optional().default(true),
  includeInterest: z.boolean().optional().default(true),
  includeOrders: z.boolean().optional().default(true),
  includeTransactions: z.boolean().optional().default(true),
});

/**
 * Register MCP tool handlers on a Server instance.
 * Called once for stdio, and once per HTTP session for streamable HTTP.
 */
function registerHandlers(target: Server): void {
  target.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  target.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        // Account Management
        case 'get_account_info':
        case 'get_account_cash':
        case 'get_account_summary': {
          const summary = await client.getAccountSummary();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(summary, null, 2),
              },
            ],
          };
        }

        // Positions
        case 'get_portfolio': {
          const portfolio = await client.getPositions();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(portfolio, null, 2),
              },
            ],
          };
        }

        case 'get_position': {
          const { ticker } = TickerInputSchema.parse(args);
          const positions = await client.getPositions(ticker);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(positions, null, 2),
              },
            ],
          };
        }

        // Order Management
        case 'get_orders': {
          const orders = await client.getOrders();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(orders, null, 2),
              },
            ],
          };
        }

        case 'get_order': {
          const { orderId } = OrderIdInputSchema.parse(args);
          const order = await client.getOrder(orderId);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(order, null, 2),
              },
            ],
          };
        }

        case 'cancel_order': {
          const { orderId } = OrderIdInputSchema.parse(args);
          await client.cancelOrder(orderId);
          return {
            content: [
              {
                type: 'text',
                text: `Order ${orderId} cancelled successfully`,
              },
            ],
          };
        }

        case 'place_market_order': {
          const validated = MarketOrderRequestSchema.parse(args);
          const order = await client.placeMarketOrder(validated);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(order, null, 2),
              },
            ],
          };
        }

        case 'place_limit_order': {
          const validated = LimitOrderRequestSchema.parse(args);
          const order = await client.placeLimitOrder(validated);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(order, null, 2),
              },
            ],
          };
        }

        case 'place_stop_order': {
          const validated = StopOrderRequestSchema.parse(args);
          const order = await client.placeStopOrder(validated);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(order, null, 2),
              },
            ],
          };
        }

        case 'place_stop_limit_order': {
          const validated = StopLimitOrderRequestSchema.parse(args);
          const order = await client.placeStopLimitOrder(validated);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(order, null, 2),
              },
            ],
          };
        }

        // Instruments & Market Data
        case 'get_instruments': {
          const { search } = SearchInputSchema.parse(args);
          let instruments = await client.getInstruments();

          if (search) {
            const searchLower = search.toLowerCase();
            instruments = instruments.filter(
              (i) =>
                i.ticker.toLowerCase().includes(searchLower) ||
                i.name.toLowerCase().includes(searchLower) ||
                i.shortName?.toLowerCase().includes(searchLower) ||
                i.isin?.toLowerCase().includes(searchLower),
            );
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(instruments, null, 2),
              },
            ],
          };
        }

        case 'get_exchanges': {
          const exchanges = await client.getExchanges();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(exchanges, null, 2),
              },
            ],
          };
        }

        // Pies
        case 'get_pies': {
          const pies = await client.getPies();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(pies, null, 2),
              },
            ],
          };
        }

        case 'get_pie': {
          const { pieId } = PieIdInputSchema.parse(args);
          const pie = await client.getPie(pieId);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(pie, null, 2),
              },
            ],
          };
        }

        case 'create_pie': {
          const validated = CreatePieRequestSchema.parse(args);
          const pie = await client.createPie(validated);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(pie, null, 2),
              },
            ],
          };
        }

        case 'update_pie': {
          const { pieId, ...updateData } = UpdatePieInputSchema.parse(args);
          const pie = await client.updatePie(pieId, updateData);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(pie, null, 2),
              },
            ],
          };
        }

        case 'delete_pie': {
          const { pieId } = DeletePieInputSchema.parse(args);
          await client.deletePie(pieId);
          return {
            content: [
              {
                type: 'text',
                text: `Pie ${pieId} deleted successfully`,
              },
            ],
          };
        }

        // Historical Data
        case 'get_order_history': {
          const { cursor, limit, ticker } = PaginatedWithTickerInputSchema.parse(args);
          const history = await client.getOrderHistory({ cursor, limit, ticker });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(history, null, 2),
              },
            ],
          };
        }

        case 'get_dividends': {
          const { cursor, limit, ticker } = PaginatedWithTickerInputSchema.parse(args);
          const dividends = await client.getDividends({ cursor, limit, ticker });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(dividends, null, 2),
              },
            ],
          };
        }

        case 'get_transactions': {
          const { cursor, limit } = PaginatedInputSchema.parse(args);
          const transactions = await client.getTransactions({ cursor, limit });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(transactions, null, 2),
              },
            ],
          };
        }

        case 'request_export': {
          const {
            timeFrom,
            timeTo,
            includeDividends,
            includeInterest,
            includeOrders,
            includeTransactions,
          } = ExportInputSchema.parse(args);

          const validated = ExportRequestSchema.parse({
            timeFrom,
            timeTo,
            dataIncluded: {
              includeDividends,
              includeInterest,
              includeOrders,
              includeTransactions,
            },
          });

          const result = await client.requestExport(validated);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        default:
          logger.warn({ msg: 'Unknown tool requested', tool: name });
          return {
            content: [
              {
                type: 'text',
                text: `Unknown tool: ${name}`,
              },
            ],
            isError: true,
          };
      }
    } catch (error) {
      // Log error with structured data
      logger.error({
        msg: 'Tool execution failed',
        tool: name,
        args,
        error: serializeError(error),
      });

      // Handle validation errors specially
      if (error instanceof z.ZodError) {
        const validationError = ValidationError.fromZodError(error);
        return {
          content: [
            {
              type: 'text',
              text: `Validation Error: ${validationError.message}\n${JSON.stringify(validationError.issues, null, 2)}`,
            },
          ],
          isError: true,
        };
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });
}

// Register handlers on the default (stdio) server
registerHandlers(server);

// ---------------------------------------------------------------------------
// Stdio transport
// ---------------------------------------------------------------------------

async function startStdio(): Promise<void> {
  logger.info({
    msg: 'Starting Trading 212 MCP server',
    transport: 'stdio',
    environment: ENVIRONMENT,
    version: VERSION,
    nodeVersion: process.version,
    platform: process.platform,
    logLevel: logger.level,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info({
    msg: 'Trading 212 MCP server started successfully',
    transport: 'stdio',
    environment: ENVIRONMENT,
  });
}

// ---------------------------------------------------------------------------
// Streamable HTTP transport
// ---------------------------------------------------------------------------

export async function startHttpServer(port: number, host = '0.0.0.0'): Promise<http.Server> {
  const transports = new Map<string, StreamableHTTPServerTransport>();

  const httpServer = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    // Health check
    if (url.pathname === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', transport: 'streamable-http' }));
      return;
    }

    // MCP endpoint
    if (url.pathname === '/mcp') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');
      res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // Look up existing session transport
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      let transport = sessionId ? transports.get(sessionId) : undefined;

      // New session: create transport + connect a fresh MCP server
      if (!transport && req.method === 'POST') {
        const newTransport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id) => {
            transports.set(id, newTransport);
            logger.info({ sessionId: id }, 'MCP HTTP session created');
          },
        });

        newTransport.onclose = () => {
          const id = newTransport.sessionId;
          if (id) transports.delete(id);
          logger.info({ sessionId: id }, 'MCP HTTP session closed');
        };

        transport = newTransport;

        // Each HTTP session gets its own MCP Server + handlers
        const sessionServer = createServer();
        registerHandlers(sessionServer);
        await sessionServer.connect(transport);
      }

      if (!transport) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No valid session. Send a POST to initialize.' }));
        return;
      }

      // Parse body for POST requests
      let body: unknown;
      if (req.method === 'POST') {
        const MAX_BODY_SIZE = 1024 * 1024; // 1MB
        const chunks: Buffer[] = [];
        let totalSize = 0;
        for await (const chunk of req) {
          totalSize += chunk.length;
          if (totalSize > MAX_BODY_SIZE) {
            res.writeHead(413);
            res.end(JSON.stringify({ error: 'Request body too large' }));
            return;
          }
          chunks.push(chunk as Buffer);
        }
        body = JSON.parse(Buffer.concat(chunks).toString());
      }

      await transport.handleRequest(req, res, body);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  return new Promise((resolve) => {
    httpServer.listen(port, host, () => {
      logger.info({
        msg: 'Trading 212 MCP server started successfully',
        transport: 'streamable-http',
        environment: ENVIRONMENT,
        version: VERSION,
        url: `http://${host}:${port}/mcp`,
      });
      resolve(httpServer);
    });
  });
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

const useHttp = process.env.TRADING212_TRANSPORT === 'http';

async function main() {
  try {
    if (useHttp) {
      const port = Number.parseInt(process.env.TRADING212_MCP_PORT || '3012', 10);
      const host = process.env.TRADING212_MCP_HOST || '0.0.0.0';
      const httpServer = await startHttpServer(port, host);

      const shutdown = () => {
        httpServer.close();
        process.exit(0);
      };
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    } else {
      await startStdio();
    }
  } catch (error) {
    logger.fatal({
      msg: 'Failed to start server',
      error: serializeError(error),
    });
    throw error;
  }
}

main().catch((error) => {
  logger.fatal({
    msg: 'Fatal error in main',
    error: serializeError(error),
  });
  process.exit(1);
});
