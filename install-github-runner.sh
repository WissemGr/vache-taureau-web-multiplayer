#!/bin/bash
#
# GitHub Self-Hosted Runner Installation Script
# For Ubuntu/Debian-based systems
#
# Usage: ./install-github-runner.sh [RUNNER_TOKEN]
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/WissemGr/vache-taureau-web-multiplayer"
RUNNER_NAME="server-10.100.1.36"
RUNNER_LABELS="self-hosted,linux,x64,production"
RUNNER_VERSION="2.321.0"  # Latest stable version as of Jan 2025

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      GitHub Self-Hosted Runner Installation Script          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
   echo -e "${RED}⚠️  Please do not run as root. Run as regular user with sudo privileges.${NC}"
   exit 1
fi

# Check if token is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Runner token not provided${NC}"
    echo ""
    echo "To get your runner token:"
    echo "1. Go to: ${REPO_URL}/settings/actions/runners/new"
    echo "2. Copy the token from the configuration command"
    echo "3. Run: ./install-github-runner.sh YOUR_TOKEN"
    echo ""
    exit 1
fi

RUNNER_TOKEN="$1"

echo -e "${GREEN}📋 Configuration:${NC}"
echo "  Repository: ${REPO_URL}"
echo "  Runner Name: ${RUNNER_NAME}"
echo "  Labels: ${RUNNER_LABELS}"
echo "  Version: ${RUNNER_VERSION}"
echo ""

# Step 1: Install dependencies
echo -e "${YELLOW}[1/7] Installing dependencies...${NC}"
sudo apt-get update -qq
sudo apt-get install -y curl tar jq libicu-dev > /dev/null 2>&1
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 2: Install Node.js (required for the repository)
echo -e "${YELLOW}[2/7] Installing Node.js 20.x...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
    sudo apt-get install -y nodejs > /dev/null 2>&1
    echo -e "${GREEN}✓ Node.js $(node --version) installed${NC}"
else
    echo -e "${GREEN}✓ Node.js $(node --version) already installed${NC}"
fi
echo ""

# Step 3: Create runner directory
echo -e "${YELLOW}[3/7] Creating runner directory...${NC}"
RUNNER_DIR="$HOME/actions-runner"
mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"
echo -e "${GREEN}✓ Runner directory created: $RUNNER_DIR${NC}"
echo ""

# Step 4: Download GitHub Actions Runner
echo -e "${YELLOW}[4/7] Downloading GitHub Actions Runner v${RUNNER_VERSION}...${NC}"
RUNNER_URL="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
curl -o actions-runner-linux-x64.tar.gz -L "$RUNNER_URL" 2>&1 | grep -v "%" || true
echo -e "${GREEN}✓ Runner downloaded${NC}"
echo ""

# Step 5: Extract the installer
echo -e "${YELLOW}[5/7] Extracting runner...${NC}"
tar xzf ./actions-runner-linux-x64.tar.gz
echo -e "${GREEN}✓ Runner extracted${NC}"
echo ""

# Step 6: Configure the runner
echo -e "${YELLOW}[6/7] Configuring runner...${NC}"
./config.sh \
    --url "$REPO_URL" \
    --token "$RUNNER_TOKEN" \
    --name "$RUNNER_NAME" \
    --labels "$RUNNER_LABELS" \
    --work _work \
    --unattended \
    --replace
echo -e "${GREEN}✓ Runner configured${NC}"
echo ""

# Step 7: Install and start the runner service
echo -e "${YELLOW}[7/7] Installing runner as a service...${NC}"
sudo ./svc.sh install
sudo ./svc.sh start
echo -e "${GREEN}✓ Runner service installed and started${NC}"
echo ""

# Verify runner status
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ GitHub Runner Installation Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}📊 Runner Status:${NC}"
sudo ./svc.sh status
echo ""
echo -e "${GREEN}🔍 Useful Commands:${NC}"
echo "  Check status:   cd $RUNNER_DIR && sudo ./svc.sh status"
echo "  Stop runner:    cd $RUNNER_DIR && sudo ./svc.sh stop"
echo "  Start runner:   cd $RUNNER_DIR && sudo ./svc.sh start"
echo "  View logs:      journalctl -u actions.runner.* -f"
echo ""
echo -e "${GREEN}🌐 Verify runner online:${NC}"
echo "  ${REPO_URL}/settings/actions/runners"
echo ""
echo -e "${YELLOW}⚠️  Note: The runner will automatically start on system boot${NC}"
echo ""
