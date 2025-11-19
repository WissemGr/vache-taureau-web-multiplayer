# 🚀 CI/CD Quick Reference

## Essential Commands

### Local Testing (Before Pushing)
```bash
# Run all tests
npm test

# Build project
npm run build

# Start server (Ctrl+C to stop)
npm start

# Security audit
npm audit

# Check for outdated packages
npm outdated
```

### Git Workflow with CI
```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and test locally
npm test

# Commit with conventional commit format
git add .
git commit -m "feat: add new feature"

# Push to GitHub (triggers CI)
git push origin feature/my-feature

# Create PR on GitHub
# CI will run automatically
```

### Skip CI (When Needed)
```bash
# Skip CI for documentation changes
git commit -m "docs: update README [skip ci]"

# Skip CI for minor changes
git commit -m "chore: fix typo [skip ci]"
```

## CI Workflow Status

### Check Status
- Go to GitHub → Actions tab
- See real-time workflow status
- View detailed logs for each job

### Required Checks
All must pass before merging:
- ✅ Test on Node.js 16.x
- ✅ Test on Node.js 18.x
- ✅ Test on Node.js 20.x
- ✅ Code Quality Check
- ✅ Build Check
- ✅ Security Audit

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add new feature          # New feature
fix: resolve bug              # Bug fix
docs: update documentation    # Documentation only
test: add tests              # Add or update tests
refactor: refactor code      # Code refactoring
chore: update dependencies   # Maintenance tasks
ci: update workflows         # CI configuration
```

## GitHub CLI (Optional but Useful)

### Install GitHub CLI
```bash
# macOS
brew install gh

# Windows
winget install GitHub.cli

# Linux
See: https://cli.github.com/
```

### Useful Commands
```bash
# View workflow runs
gh run list

# Watch current workflow
gh run watch

# View specific workflow run
gh run view <run-id>

# Cancel running workflow
gh run cancel <run-id>

# Create PR from command line
gh pr create
```

## Troubleshooting

### Tests Pass Locally but Fail in CI
```bash
# Run tests with CI environment
CI=true npm test

# Check Node.js version
node --version
```

### Fix package-lock.json Issues
```bash
rm package-lock.json
npm install
git add package-lock.json
git commit -m "fix: update package-lock.json"
```

### View Detailed CI Logs
1. Go to Actions tab on GitHub
2. Click failed workflow run
3. Click failed job
4. Expand error step to see details

## Free Tier Limits

- **Private repos:** 2,000 minutes/month
- **Public repos:** Unlimited
- **Storage:** 500 MB artifacts
- **Current usage:** Check Settings → Billing

## Tips to Save CI Minutes

1. ✅ Test locally before pushing
2. ✅ Use `[skip ci]` for docs
3. ✅ Consolidate commits
4. ✅ Use draft PRs for WIP
5. ✅ Cancel redundant workflows

## Branch Protection

### Recommended Settings
- ✅ Require PR before merge
- ✅ Require status checks pass
- ✅ Require branches up to date
- ✅ Require reviews (optional)

### Setup
Settings → Branches → Add rule

## Quick Links

- **Actions Tab:** github.com/USERNAME/REPO/actions
- **Settings:** github.com/USERNAME/REPO/settings
- **Billing:** github.com/settings/billing
- **CI Setup Guide:** `.github/CI_SETUP.md`
- **Contributing:** `.github/CONTRIBUTING.md`

## Emergency Actions

### Cancel All Running Workflows
```bash
# Using GitHub CLI
gh run list --status in_progress | cut -f 7 | xargs -n1 gh run cancel
```

### Force Push (Use with Caution)
```bash
# Only if you know what you're doing
git push --force origin branch-name
# Note: May trigger new CI runs
```

## Support

- 📖 **Full Guide:** See `.github/CI_SETUP.md`
- 🐛 **Issues:** Use bug report template
- 💡 **Features:** Use feature request template
- ❓ **Questions:** Open GitHub Discussion

---

Keep this page bookmarked for quick access! 🔖
