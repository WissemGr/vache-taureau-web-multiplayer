# 🏃 GitHub Self-Hosted Runner Setup Guide

## Server Information
- **Server IP:** 10.100.1.36
- **User:** sysadmin
- **OS:** Ubuntu Linux (6.8.0-60-generic)
- **Repository:** WissemGr/vache-taureau-web-multiplayer

## 📋 Prerequisites Checklist

✅ SSH access to server (tested and working)
✅ Installation script created (`install-github-runner.sh`)
⏳ Runner registration token (see instructions below)

---

## 🔑 Step 1: Get Runner Registration Token

### Option A: Via GitHub Web Interface (Easiest)

1. **Navigate to Runner Settings:**
   ```
   https://github.com/WissemGr/vache-taureau-web-multiplayer/settings/actions/runners/new
   ```

2. **Select Linux and x64 architecture**

3. **Copy the token from the configuration command**
   Look for a command like:
   ```bash
   ./config.sh --url https://github.com/... --token ABCDEFGHIJK...
   ```
   Copy the token part (starts with A-Z and is ~30+ characters)

### Option B: Via GitHub CLI (If you have admin permissions)

```bash
gh api -X POST repos/WissemGr/vache-taureau-web-multiplayer/actions/runners/registration-token \
  --jq .token
```

---

## 🚀 Step 2: Copy Installation Script to Server

```bash
scp install-github-runner.sh sysadmin@10.100.1.36:~/
```

---

## 🔧 Step 3: Install Runner on Remote Server

### Method 1: Interactive Installation (Recommended)

```bash
# SSH into the server
ssh sysadmin@10.100.1.36

# Run the installation script with your token
chmod +x install-github-runner.sh
./install-github-runner.sh YOUR_RUNNER_TOKEN_HERE
```

### Method 2: One-Line Remote Execution

```bash
ssh sysadmin@10.100.1.36 'bash -s' < install-github-runner.sh YOUR_RUNNER_TOKEN_HERE
```

---

## 📊 Step 4: Verify Runner Installation

### On the Server

```bash
# Check runner service status
cd ~/actions-runner
sudo ./svc.sh status

# View runner logs
journalctl -u actions.runner.* -f --no-pager | head -20
```

### On GitHub

1. Go to: https://github.com/WissemGr/vache-taureau-web-multiplayer/settings/actions/runners
2. You should see runner **"server-10.100.1.36"** with status **"Idle"** (green)

---

## 🎯 Step 5: Test Runner with CI Workflow

### Update CI Workflow to Use Self-Hosted Runner

Edit `.github/workflows/ci.yml` and add a job:

```yaml
  test-self-hosted:
    name: Test on Self-Hosted Runner
    runs-on: self-hosted  # This will use your runner!

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Show runner info
      run: |
        echo "Running on self-hosted runner!"
        uname -a
        node --version
        npm --version

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test
```

Or create a test workflow to verify the runner:

```bash
# Create test workflow
cat > .github/workflows/test-runner.yml << 'EOF'
name: Test Self-Hosted Runner

on:
  workflow_dispatch:  # Manual trigger
  push:
    branches: [ develop ]

jobs:
  test-runner:
    name: Test Self-Hosted Runner
    runs-on: self-hosted

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Display system info
      run: |
        echo "🖥️  Hostname: $(hostname)"
        echo "💻 OS: $(uname -a)"
        echo "👤 User: $(whoami)"
        echo "📁 Working Directory: $(pwd)"

    - name: Check Node.js
      run: node --version

    - name: Run tests
      run: npm ci && npm test
EOF

# Commit and push
git add .github/workflows/test-runner.yml
git commit -m "test: add self-hosted runner test workflow"
git push origin develop
```

---

## 🔧 Runner Management Commands

### Check Status
```bash
ssh sysadmin@10.100.1.36 "cd ~/actions-runner && sudo ./svc.sh status"
```

### Stop Runner
```bash
ssh sysadmin@10.100.1.36 "cd ~/actions-runner && sudo ./svc.sh stop"
```

### Start Runner
```bash
ssh sysadmin@10.100.1.36 "cd ~/actions-runner && sudo ./svc.sh start"
```

### Restart Runner
```bash
ssh sysadmin@10.100.1.36 "cd ~/actions-runner && sudo ./svc.sh stop && sudo ./svc.sh start"
```

### View Logs
```bash
ssh sysadmin@10.100.1.36 "journalctl -u actions.runner.* -f --no-pager"
```

### Uninstall Runner
```bash
ssh sysadmin@10.100.1.36 << 'EOF'
cd ~/actions-runner
sudo ./svc.sh stop
sudo ./svc.sh uninstall
./config.sh remove --token YOUR_TOKEN
cd ~
rm -rf actions-runner
EOF
```

---

## 🏷️ Runner Configuration

The runner is configured with these labels:
- `self-hosted`
- `linux`
- `x64`
- `production`

You can use any of these in your workflows:

```yaml
runs-on: [self-hosted, linux, production]
```

---

## 🔒 Security Best Practices

1. **Firewall Rules:**
   ```bash
   # Only allow necessary outbound connections
   sudo ufw status
   ```

2. **Runner Isolation:**
   - Runner runs as `sysadmin` user
   - Has limited permissions
   - Isolated from other services

3. **Update Regularly:**
   ```bash
   # Update runner (on server)
   cd ~/actions-runner
   sudo ./svc.sh stop
   # Download and extract new version
   sudo ./svc.sh start
   ```

4. **Monitor Usage:**
   - Check GitHub Actions usage: Settings → Billing
   - Self-hosted runners don't count against CI minutes!

---

## 🐛 Troubleshooting

### Runner Shows Offline
```bash
# Check service status
ssh sysadmin@10.100.1.36 "cd ~/actions-runner && sudo ./svc.sh status"

# Check logs for errors
ssh sysadmin@10.100.1.36 "journalctl -u actions.runner.* -n 50 --no-pager"

# Restart service
ssh sysadmin@10.100.1.36 "cd ~/actions-runner && sudo ./svc.sh restart"
```

### Jobs Not Running
1. Check runner labels match workflow requirements
2. Verify runner is "Idle" (green) in GitHub
3. Check runner logs for connection issues

### Permission Errors
```bash
# Fix ownership
ssh sysadmin@10.100.1.36 "sudo chown -R sysadmin:sysadmin ~/actions-runner"
```

### Network Issues
```bash
# Test connectivity from server
ssh sysadmin@10.100.1.36 "curl -I https://github.com"
```

---

## 📊 Benefits of Self-Hosted Runner

✅ **Free CI Minutes:** Self-hosted runners don't count against GitHub limits
✅ **Better Performance:** Direct access to your infrastructure
✅ **Custom Environment:** Pre-installed tools and configurations
✅ **Faster Builds:** No queue times, instant start
✅ **Cost Effective:** Use existing hardware

---

## 📚 Additional Resources

- [GitHub Self-Hosted Runners Documentation](https://docs.github.com/en/actions/hosting-your-own-runners)
- [Runner Security Hardening](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Troubleshooting Guide](https://docs.github.com/en/actions/hosting-your-own-runners/monitoring-and-troubleshooting-self-hosted-runners)

---

## ✅ Quick Setup Checklist

- [ ] Get runner token from GitHub
- [ ] Copy script to server: `scp install-github-runner.sh sysadmin@10.100.1.36:~/`
- [ ] SSH to server: `ssh sysadmin@10.100.1.36`
- [ ] Run installation: `./install-github-runner.sh YOUR_TOKEN`
- [ ] Verify runner online: Check GitHub runners page
- [ ] Test with workflow: Trigger a job with `runs-on: self-hosted`
- [ ] Monitor logs: `journalctl -u actions.runner.* -f`

---

**Last Updated:** 2025-01-19
**Status:** Ready for installation
