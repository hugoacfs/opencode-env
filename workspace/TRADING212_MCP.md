# Trading 212 MCP Server - Usage Examples

This document provides comprehensive examples of how to interact with the Trading 212 MCP server through Claude.

## Table of Contents

1. [Account Management](#account-management)
2. [Portfolio Analysis](#portfolio-analysis)
3. [Order Management](#order-management)
4. [Market Research](#market-research)
5. [Investment Pies](#investment-pies)
6. [Historical Analysis](#historical-analysis)
7. [Advanced Scenarios](#advanced-scenarios)

---

## Account Management

### Check Account Balance

**User:** "How much cash do I have available to invest?"

**Claude Response:**
```
Let me check your account cash balance.
[Calls get_account_cash]

You have:
- Free cash: $5,234.50 (available to invest)
- Total cash: $10,234.50
- Invested: $5,000.00
- Blocked: $0.00

You can use your $5,234.50 in free cash for new investments.
```

### Get Complete Account Overview

**User:** "Show me my complete account summary"

**Claude Response:**
```
[Calls get_account_summary and get_portfolio]

Account Summary:
- Total Value: $15,234.50
- Cash: $5,234.50 (free)
- Invested: $10,000.00
- Profit/Loss: +$1,234.50 (+12.35%)

Top Holdings:
1. AAPL - $3,500 (35%)
2. MSFT - $2,800 (28%)
3. GOOGL - $2,200 (22%)
4. TSLA - $1,500 (15%)
```

---

## Portfolio Analysis

### View All Holdings

**User:** "What stocks do I currently own?"

**Claude Response:**
```
[Calls get_portfolio]

Your portfolio (4 positions):

1. Apple Inc (AAPL)
   - Quantity: 20 shares
   - Average Price: $145.00
   - Current Price: $175.00
   - Total Value: $3,500
   - P&L: +$600 (+20.7%)

2. Microsoft Corp (MSFT)
   - Quantity: 10 shares
   - Average Price: $250.00
   - Current Price: $280.00
   - Total Value: $2,800
   - P&L: +$300 (+12.0%)

3. Alphabet Inc (GOOGL)
   - Quantity: 15 shares
   - Average Price: $140.00
   - Current Price: $146.67
   - Total Value: $2,200
   - P&L: +$100 (+4.8%)

4. Tesla Inc (TSLA)
   - Quantity: 8 shares
   - Average Price: $200.00
   - Current Price: $187.50
   - Total Value: $1,500
   - P&L: -$100 (-6.3%)
```

### Analyze Single Position

**User:** "Show me detailed information about my Apple position"

**Claude Response:**
```
[Calls get_position with ticker="AAPL"]

Apple Inc (AAPL) Position:
- Shares Owned: 20
- Average Purchase Price: $145.00
- Current Market Price: $175.00
- Total Position Value: $3,500.00
- Unrealized Gain: +$600.00 (+20.7%)
- Available to Sell: 20 shares
- Investment: $2,900.00
```

### Performance Analysis

**User:** "Which of my stocks are performing the best and worst?"

**Claude Response:**
```
[Calls get_portfolio and analyzes performance]

Best Performers:
1. 🟢 AAPL: +$600 (+20.7%)
2. 🟢 MSFT: +$300 (+12.0%)
3. 🟢 GOOGL: +$100 (+4.8%)

Worst Performers:
1. 🔴 TSLA: -$100 (-6.3%)

Overall Portfolio: +$900 (+9.9%)
```

---

## Order Management

### Place Market Order (Buy)

**User:** "Buy 10 shares of Apple at market price"

**Claude Response:**
```
[Calls place_market_order]

Market order placed successfully:
- Order ID: 123456
- Action: BUY
- Ticker: AAPL
- Quantity: 10 shares
- Order Type: MARKET
- Status: CONFIRMED
- Filled Price: $175.25
- Total Cost: $1,752.50
- Time Validity: DAY

Your order has been executed at $175.25 per share.
```

### Place Limit Order (Buy)

**User:** "I want to buy 5 shares of Tesla but only if it drops to $180"

**Claude Response:**
```
[Calls place_limit_order]

Limit order placed successfully:
- Order ID: 123457
- Action: BUY
- Ticker: TSLA
- Quantity: 5 shares
- Limit Price: $180.00
- Order Type: LIMIT
- Status: NEW (waiting for price to reach $180)
- Time Validity: DAY

Your order will execute if TSLA drops to $180.00 or below during market hours today.
```

### Place Stop-Loss Order

**User:** "Place a stop-loss for my Microsoft shares at $270"

**Claude Response:**
```
[Calls place_stop_order]

Stop order placed successfully:
- Order ID: 123458
- Action: SELL
- Ticker: MSFT
- Quantity: 10 shares
- Stop Price: $270.00
- Order Type: STOP
- Status: NEW
- Time Validity: GTC (Good Till Cancelled)

If MSFT drops to $270.00, your shares will be sold at the next available market price.
```

### View Active Orders

**User:** "What orders do I have pending?"

**Claude Response:**
```
[Calls get_orders]

You have 2 active orders:

1. Order #123457
   - Type: LIMIT BUY
   - Ticker: TSLA
   - Quantity: 5 shares
   - Limit Price: $180.00
   - Status: NEW
   - Created: 2024-01-15 10:30 AM

2. Order #123458
   - Type: STOP SELL
   - Ticker: MSFT
   - Quantity: 10 shares
   - Stop Price: $270.00
   - Status: NEW
   - Created: 2024-01-15 11:45 AM
```

### Cancel Order

**User:** "Cancel my Tesla limit order"

**Claude Response:**
```
[Calls get_orders to find TSLA order, then cancel_order]

Order #123457 (TSLA limit buy) has been cancelled successfully.

Remaining active orders: 1
```

---

## Market Research

### Search for Instruments

**User:** "Search for all Apple-related stocks and ETFs"

**Claude Response:**
```
[Calls get_instruments with search="apple"]

Found 3 Apple-related instruments:

1. Apple Inc (AAPL)
   - Type: STOCK
   - ISIN: US0378331005
   - Currency: USD
   - Exchange: NASDAQ

2. iShares Core S&P 500 ETF (IVV)
   - Type: ETF
   - Holdings include AAPL
   - ISIN: US4642872000
   - Currency: USD

3. Vanguard Information Technology ETF (VGT)
   - Type: ETF
   - Heavy tech exposure including AAPL
   - ISIN: US9229087690
   - Currency: USD
```

### Find Similar Instruments

**User:** "Show me all semiconductor stocks available"

**Claude Response:**
```
[Calls get_instruments with search="semiconductor"]

Available Semiconductor Stocks (10 found):

1. NVIDIA Corp (NVDA)
2. AMD (AMD)
3. Intel Corp (INTC)
4. Taiwan Semiconductor (TSM)
5. Qualcomm Inc (QCOM)
6. Broadcom Inc (AVGO)
7. Texas Instruments (TXN)
8. Applied Materials (AMAT)
9. ASML Holding (ASML)
10. Micron Technology (MU)

Would you like details on any specific stock?
```

### Check Trading Hours

**User:** "When can I trade US stocks today?"

**Claude Response:**
```
[Calls get_exchanges]

US Stock Exchanges (NASDAQ, NYSE):

Regular Trading Hours:
- Pre-market: 4:00 AM - 9:30 AM EST
- Regular: 9:30 AM - 4:00 PM EST
- After-hours: 4:00 PM - 8:00 PM EST

Current Status: OPEN (Regular Hours)
Time until close: 2 hours 15 minutes

Note: Not all stocks support extended hours trading.
```

---

## Investment Pies

### View All Pies

**User:** "Show me all my investment pies"

**Claude Response:**
```
[Calls get_pies]

You have 2 investment pies:

1. "Tech Giants" (Pie ID: 101)
   - Value: $5,000
   - Status: ACTIVE
   - Return: +$450 (+9.0%)
   - Holdings: 4 stocks
   - Dividend Action: REINVEST

2. "Dividend Growth" (Pie ID: 102)
   - Value: $3,000
   - Status: ACTIVE
   - Return: +$180 (+6.0%)
   - Holdings: 5 stocks
   - Dividend Action: TO_ACCOUNT_CASH
```

### Create New Pie

**User:** "Create a new pie called 'Green Energy' with 40% Tesla, 30% NextEra Energy, and 30% First Solar, reinvesting dividends"

**Claude Response:**
```
[Calls create_pie]

Pie created successfully!

Name: "Green Energy"
Pie ID: 103
Status: ACTIVE
Dividend Action: REINVEST

Allocation:
- TSLA: 40%
- NEE: 30%
- FSLR: 30%

Your pie is ready to receive deposits. Would you like to add funds to it?
```

### Update Pie Allocation

**User:** "Update my Tech Giants pie to include NVDA at 25% and reduce others proportionally"

**Claude Response:**
```
[Calls get_pie then update_pie]

"Tech Giants" pie updated successfully:

New Allocation:
- AAPL: 25% (was 33%)
- MSFT: 25% (was 33%)
- GOOGL: 25% (was 34%)
- NVDA: 25% (new)

Next rebalancing will adjust holdings to match new allocations.
```

---

## Historical Analysis

### View Order History

**User:** "Show me all my orders from the last month"

**Claude Response:**
```
[Calls get_order_history]

Order History (Last 30 days):

15 orders executed:

1. Jan 15, 2024 - BUY 10 AAPL @ $175.25 - Filled - +$1,752.50
2. Jan 14, 2024 - SELL 5 TSLA @ $195.00 - Filled - +$975.00
3. Jan 12, 2024 - BUY 20 MSFT @ $250.00 - Filled - -$5,000.00
... (12 more)

Total Invested: $8,450.00
Total Sold: $2,340.00
Net Investment: $6,110.00
```

### Analyze Dividend Income

**User:** "How much did I earn in dividends last year?"

**Claude Response:**
```
[Calls get_dividends with time filter]

2024 Dividend Summary:

Total Dividends Received: $1,245.50

By Stock:
1. AAPL - $450.00 (4 payments)
   - Q1: $115, Q2: $110, Q3: $112, Q4: $113

2. MSFT - $380.50 (4 payments)
   - Q1: $95, Q2: $96, Q3: $94, Q4: $95.50

3. JNJ - $280.00 (4 payments)
   - Q1: $70, Q2: $70, Q3: $70, Q4: $70

4. PG - $135.00 (4 payments)
   - Q1: $33, Q2: $34, Q3: $34, Q4: $34

Average monthly dividend: $103.79
Dividend yield: ~4.2% on invested capital
```

### Review Transactions

**User:** "Show me all my account transactions from this month"

**Claude Response:**
```
[Calls get_transactions]

January 2024 Transactions (12 total):

Deposits:
- Jan 1: +$5,000.00 (Bank Transfer)
- Jan 15: +$2,000.00 (Bank Transfer)

Orders:
- Jan 5: -$1,750.50 (BUY 10 AAPL)
- Jan 8: -$2,500.00 (BUY 10 MSFT)
- Jan 12: +$975.00 (SELL 5 TSLA)

Dividends:
- Jan 10: +$115.00 (AAPL Q1 Dividend)
- Jan 20: +$95.00 (MSFT Q1 Dividend)

Fees:
- Jan 15: -$2.50 (FX Conversion Fee)

Net Change: +$4,932.00
```

### Export Data for Tax Reporting

**User:** "Export all my trading data for 2024 tax purposes"

**Claude Response:**
```
[Calls request_export]

Export request submitted successfully:

Report ID: 789456
Period: Jan 1, 2024 - Dec 31, 2024
Includes:
✓ All orders and executions
✓ Dividend payments
✓ Interest earned
✓ All transactions
✓ Fees and charges

Status: Processing
Estimated time: 5-10 minutes

You'll receive the CSV export via email once ready. The export will include all data needed for tax reporting.
```

---

## Advanced Scenarios

### Rebalancing Strategy

**User:** "My portfolio is overweight in tech. Show me what I should sell to rebalance to 25% per sector"

**Claude Response:**
```
[Calls get_portfolio and analyzes allocation]

Current Allocation:
- Technology: 65% ($6,500)
- Healthcare: 15% ($1,500)
- Consumer: 10% ($1,000)
- Energy: 10% ($1,000)
Total: $10,000

Target Allocation (25% per sector):
- Technology: 25% ($2,500)
- Healthcare: 25% ($2,500)
- Consumer: 25% ($2,500)
- Energy: 25% ($2,500)

Recommended Actions:
1. SELL $4,000 worth of tech stocks:
   - Sell 15 shares AAPL (~$2,625)
   - Sell 5 shares MSFT (~$1,400)

2. BUY $1,000 Healthcare:
   - Suggested: JNJ, UNH, or PFE

3. BUY $1,500 Consumer:
   - Suggested: PG, KO, or WMT

4. BUY $1,500 Energy:
   - Suggested: XOM, CVX, or NEE

Would you like me to execute any of these trades?
```

### Dollar-Cost Averaging Setup

**User:** "I want to invest $1000 monthly. Help me set up a DCA strategy"

**Claude Response:**
```
Based on your risk profile and goals, here's a suggested DCA strategy:

Monthly Investment: $1,000

Allocation Strategy:
- 60% Broad Market ETFs ($600)
  - $300 SPY (S&P 500)
  - $300 VTI (Total Market)

- 30% Individual Growth Stocks ($300)
  - $100 AAPL
  - $100 MSFT
  - $100 GOOGL

- 10% Emerging Tech ($100)
  - $50 NVDA
  - $50 AMD

I can create a pie with this allocation and you can set up automatic deposits. Would you like me to create it?
```

### Risk Assessment

**User:** "Analyze the risk in my current portfolio"

**Claude Response:**
```
[Calls get_portfolio and analyzes concentration]

Portfolio Risk Analysis:

Concentration Risk: HIGH ⚠️
- Top 3 holdings: 85% of portfolio
- Single stock max: AAPL at 35%
- Recommendation: Diversify beyond top holdings

Sector Concentration: HIGH ⚠️
- Technology: 65%
- Other sectors: 35%
- Recommendation: Reduce tech exposure to <40%

Volatility Exposure: MEDIUM
- High volatility stocks (TSLA): 15%
- Stable stocks: 50%
- ETFs/Funds: 0%

Dividend Income: LOW
- Current yield: ~1.2%
- Only 2 dividend-paying stocks

Recommendations:
1. Reduce AAPL position to <15% of portfolio
2. Add 2-3 positions in non-tech sectors
3. Consider adding dividend aristocrats
4. Include 1-2 broad market ETFs for stability

Would you like suggestions for specific rebalancing trades?
```

### Tax Loss Harvesting

**User:** "Help me identify tax loss harvesting opportunities"

**Claude Response:**
```
[Calls get_portfolio and get_order_history]

Tax Loss Harvesting Opportunities:

Positions with Losses:
1. TSLA - Loss: -$100 (-6.3%)
   - Held for: 45 days
   - Can harvest: YES
   - Similar alternative: RIVN, LCID

Potential Action:
- Sell TSLA (realize $100 loss for tax deduction)
- Wait 31 days (avoid wash sale rule)
- Buy back TSLA or buy similar EV stock

Tax Benefit: ~$20-35 (depending on tax bracket)

Note: This is not tax advice. Consult with a tax professional for your specific situation.
```

---

## Tips for Effective Use

### 1. Combine Multiple Queries
**User:** "Show me my portfolio, pending orders, and available cash"

Claude will automatically call multiple tools in parallel for efficient responses.

### 2. Natural Language Works
Instead of: "Call get_portfolio function"
Use: "What stocks do I own?"

### 3. Context Awareness
Claude remembers context within a conversation:
```
User: "Show me my Apple position"
Claude: [Shows AAPL details]
User: "Sell half of them at market price"
Claude: [Knows to sell AAPL, calculates quantity]
```

### 4. Ask for Explanations
```
User: "What's the difference between a stop order and stop-limit order?"
Claude: [Provides explanation with examples]
```

### 5. Request Comparisons
```
User: "Compare my performance against the S&P 500"
Claude: [Gets your portfolio data and compares with index]
```

---

## Safety Reminders

- Always verify order details before confirming
- Use demo environment for testing
- Start with small positions when learning
- Never share your API key
- Review all trades in the Trading 212 app
- Monitor rate limits to avoid throttling

---

For more examples or questions, refer to the main [README.md](README.md) or open an issue on GitHub.
