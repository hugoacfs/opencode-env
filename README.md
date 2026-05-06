# OpenCode + SearXNG Environment

> A Dockerized, git-managed environment for OpenCode with integrated SearXNG search engine.

This setup provides a reproducible environment for using OpenCode (CLI/TUI AI assistant) with a self-hosted SearXNG search engine.

## 📦 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git
- ~20GB of disk space

### 1. Clone & Setup

```bash
git clone <your-repo-url>
cd opencode-env
```

### 2. Configure Environment Variables

```bash
cp .env-dist .env
nano .env  # Add your API keys
```

**Important:** Add your API keys to `.env`:
- `OPENAI_API_KEY` - Required for LLM calls
- `ANTHROPIC_API_KEY` - Optional
- `DEEPSEEK_API_KEY` - Optional
- `GROQ_API_KEY` - Optional
- `GOOGLE_API_KEY` - Optional
- `HF_API_TOKEN` - Optional

### 3. Start Services

```bash
docker compose up -d
```

### 4. Access
- **SearXNG**: http://localhost:8080
- **OpenCode TUI**: Run `docker compose exec opencode-env opencode` inside the container
- **OpenCode Web**: http://localhost:4096 (if exposed)

## 📁 Directory Structure

```
opencode-env/
├── .env                    # Your environment variables (DO NOT COMMIT)
├── .env-dist               # Template with placeholder values
├── .gitignore              # Git ignore rules
├── README.md               # This file
├── config.json             # OpenCode config schema
├── docker-compose.yml      # Docker Compose configuration
├── opencode/               # OpenCode configuration folder
│   ├── .gitignore
│   ├── opencode.json       # LLM provider configuration (WSL/Host)
│   └── package.json
├── searxng/                # SearXNG configuration
│   ├── settings.yml        # Main SearXNG config (read-only)
│   ├── settings-original.yml # Original template
│   └── default.yml         # Alternative SearXNG config template
├── searxng.yml             # Alternative SearXNG config (read-only)
├── setup.sh                # Helper script for setup/teardown
└── workspace/              # Your working directory (bind mount)
```

## 🔧 Configuration

### OpenCode Configuration (`opencode/opencode.json`)

Located at `opencode/opencode.json`, this configures:

- **LLM Providers** (WSL/Host setup for local models)
- **Default Model**: Configured in `model` field
- **SearXNG Integration**: MCP server for searching within OpenCode

**Key Settings**:
- `provider.wsl.baseURL` - WSL endpoint (can be overridden via env)
- `provider.host.baseURL` - Localhost endpoint
- `mcp.searxng.enabled` - Enable SearXNG search tool
- `mcp.searxng.environment` - SearXNG connection URLs

**⚠️ Current State**: The active `opencode.json` contains your actual WSL IP address and model path. Use `opencode-dist.json` as a clean template when sharing or deploying.

**To use a clean config**:
```bash
cp opencode/opencode-dist.json opencode/opencode.json
# Then edit with your actual values
```

**Personal Information to Protect**:
- `provider.wsl.baseURL` - Your WSL IP address (e.g., `192.168.x.x:11434`)  
- `provider.wsl.apiKey` - Your API key placeholder
- `model` - Your local model file path
- `provider.wsl.models` - Your actual local model filename

### SearXNG Configuration (`searxng/settings.yml`)

Located at `searxng/settings.yml`, this configures:

- **Search Engines**: Google, Bing, DuckDuckGo, and 100+ others
- **UI Settings**: Theme, categories, default search type
- **Privacy**: External images, JavaScript settings
- **Engines**: All enabled by default

**Key Settings**:
- `general.instance_name`: Display name
- `general.base_url`: Internal SearXNG URL
- `search.default_search_engine`: Default search type
- `engines`: List of enabled/disabled engines

### Docker Compose (`docker-compose.yml`)

Configures two main services:

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| `opencode-env` | `smanx/opencode:latest` | 4096 | OpenCode TUI container |
| `searxng` | `docker.io/searxng/searxng:latest` | 8080 | SearXNG search engine |

**Volume Mounts**:
- `./opencode:/root/.config/opencode:rw` - OpenCode configs
- `./.sessions/opencode-data:/root/.local/share/opencode:rw` - Database & logs
- `./.sessions/opencode-state:/root/.local/state/opencode:rw` - State files
- `./workspace:/workspace:rw` - Your working directory

### Environment Variables Reference

See `.env-dist` for all available variables:

#### OpenCode Variables
- `OPENCODE_MODELS_PATH` - Path to custom models.json
- `OPENCODE_MODELS_URL` - URL for models.json
- `OPENCODE_DISABLE_MODELS_FETCH` - Prevent auto-fetch from models.dev
- `OPENCODE_SEARCH_URL` - URL for OpenCode's search provider

#### SearXNG Variables
- `SEARXNG_INSTANCE_NAME` - Display name
- `SEARXNG_BASE_URL` - Internal URL (default: http://0.0.0.0:8080)
- `SEARXNG_PUBLIC_URL` - Public URL
- `SEARXNG_DEFAULT_CATEGORY` - Default search type
- `SEARXNG_MAX_PAGE` - Maximum pagination
- `SEARXNG_RESULTS_PER_PAGE` - Results per page
- `SEARXNG_EXTERNAL_IMAGES_ENABLED` - Enable external images
- `SEARXNG_JAVASCRIPT_DISABLED` - Disable JavaScript

## 🛠️ Helper Script

The `setup.sh` script provides common operations:

```bash
./setup.sh                    # Boot environment, install Node, apply CSP fixes
./setup.sh -t                 # Tear down containers
./setup.sh -c                 # Clean teardown (containers + volumes)
./setup.sh -r                 # Restart OpenCode container
./setup.sh -l                 # Tail SearXNG logs
./setup.sh -h                 # Show help
```

## 🚀 Usage

### Using SearXNG as OpenCode Search Provider

1. **Configure OpenCode** to use SearXNG:

```bash
export OPENCODE_SEARCH_URL=http://localhost:8080
```

Or add to `.env`:
```env
OPENCODE_SEARCH_URL=http://localhost:8080
```

2. **In OpenCode TUI**, use `/search` command to query SearXNG

### Direct SearXNG Access

1. **Open your browser** to: http://localhost:8080
2. **Start searching** - all engines are enabled by default
3. **Use shortcuts** (press `?` in SearXNG UI to see all options)

### OpenCode TUI

```bash
docker compose exec opencode-env opencode
```

Or use the web interface at http://localhost:4096

## 🔒 Security & Privacy

### Important Notes

1. **Never commit `.env`** - Contains your API keys and secrets
2. **Use `.gitignore`** - Already configured to exclude secrets
3. **WSL IP is hardcoded** - The active `opencode.json` contains your actual WSL IP and model path. Use `opencode-dist.json` as a clean template.
4. **API keys** - Add to `.env`, never share
5. **Model paths** - Your local model filenames are exposed in the config
6. **Internal IPs** - WSL IP addresses (192.168.x.x) reveal your network topology

### Privacy Settings

- External images are disabled by default (`SEARXNG_EXTERNAL_IMAGES_ENABLED=false`)
- JavaScript is enabled but can be disabled
- All search engines are privacy-respecting (DuckDuckGo, Startpage, etc.)

## 🐛 Troubleshooting

### Can't connect to SearXNG from OpenCode?

```bash
# Check both services are running
docker compose ps

# Check logs
docker compose logs searxng
docker compose logs opencode-env

# Verify network connectivity
docker compose exec opencode-env ping searxng
```

### OpenCode won't start?

```bash
# Check OpenCode logs
docker compose logs opencode-env

# Restart OpenCode
docker compose restart opencode-env

# Reinstall Node/NPM if missing
./setup.sh
```

### SearXNG not accessible externally?

1. Check port mapping: `docker compose port searxng`
2. Verify firewall: `sudo ufw allow 8080`
3. Or remove port mapping from `docker-compose.yml`

### OpenCode can't fetch models?

Set `OPENCODE_DISABLE_MODELS_FETCH=1` in `.env` (already set by default)

## 📝 Customizing

### Adding/Removing Search Engines

1. Edit `searxng/settings.yml`
2. Find the `engines` section
3. Add or modify engine entries
4. Restart: `docker compose restart searxng`

### Adding LLM Providers

1. Edit `opencode/opencode.json`
2. Add new provider entries under `provider`
3. Restart OpenCode container

### Changing WSL Endpoint

Instead of hardcoding in `opencode/opencode.json`, use environment variables:

```env
# Add to .env
OPENCODE_WSL_BASE_URL=http://<wsip>:11434/v1
OPENCODE_WSL_API_KEY=<your-api-key>
```

Then modify `opencode/opencode.json` to read from env:

```json
{
  "provider": {
    "wsl": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "WSL",
      "options": {
        "baseURL": "${OPENCODE_WSL_BASE_URL}",
        "apiKey": "${OPENCODE_WSL_API_KEY}"
      },
      ...
    }
  }
}
```

## 📜 License

MIT License - See LICENSE file

## 🌐 About OpenCode + SearXNG

- **OpenCode**: A powerful CLI/TUI AI assistant with MCP support
- **SearXNG**: A privacy-respecting, open-source metasearch engine

This environment combines both for a seamless development experience with local LLMs and custom search capabilities.

---

**For questions or issues**, check the main OpenCode and SearXNG documentation:
- OpenCode: https://opencode.ai
- SearXNG: https://docs.searxng.org