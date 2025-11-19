# 🔄 CI/CD Setup Guide

This document explains the Continuous Integration and Continuous Deployment (CI/CD) setup for the Vache et Taureau project using GitHub Actions (Free Tier).

## 📋 Table of Contents
- [Overview](#overview)
- [Workflows](#workflows)
- [Setup Instructions](#setup-instructions)
- [Free Tier Limits](#free-tier-limits)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

Our CI/CD pipeline is designed to:
- ✅ Automatically test code on every push and pull request
- ✅ Support multiple Node.js versions (16.x, 18.x, 20.x)
- ✅ Check for security vulnerabilities
- ✅ Validate builds before deployment
- ✅ Create deployment artifacts for releases

All workflows are optimized for GitHub's **free tier**, which provides:
- 2,000 CI/CD minutes per month for private repos
- Unlimited minutes for public repos
- 500 MB of package storage

## 🔧 Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Manual trigger via workflow_dispatch

**Jobs:**

#### Test Job
- **Matrix Strategy:** Tests on Node.js 16.x, 18.x, 20.x
- **Steps:**
  1. Checkout code
  2. Setup Node.js with caching
  3. Install dependencies (`npm ci`)
  4. Run test suite (`npm test`)
  5. Security audit (`npm audit`)

#### Lint Job
- Validates code quality
- Checks for console.log statements
- Validates package.json syntax

#### Build Job
- Verifies build succeeds
- Tests server startup
- Depends on test and lint jobs passing

#### Security Job
- Runs npm audit for vulnerabilities
- Checks for outdated packages
- Reports security issues

**Estimated Runtime:** 3-5 minutes per run

### 2. Deploy Workflow (`.github/workflows/deploy.yml`)

**Triggers:**
- Release publication
- Manual trigger

**Jobs:**
- Runs tests before deployment
- Creates deployment artifact (tar.gz)
- Uploads artifact for 7 days
- Ready for manual deployment to hosting provider

**Estimated Runtime:** 2-3 minutes per run

### 3. Dependency Review (`.github/workflows/dependency-review.yml`)

**Triggers:**
- Pull requests to `main` branch

**Jobs:**
- Reviews dependency changes
- Detects vulnerabilities in new dependencies
- Posts summary in PR comments
- Fails on moderate+ severity vulnerabilities

**Estimated Runtime:** 1-2 minutes per run

## 🚀 Setup Instructions

### Step 1: Enable GitHub Actions

1. **For Public Repositories:**
   - GitHub Actions is enabled by default
   - No additional configuration needed

2. **For Private Repositories:**
   - Go to repository Settings → Actions → General
   - Enable "Allow all actions and reusable workflows"

### Step 2: Update README Badges

Replace `YOUR_USERNAME` in README.md with your GitHub username:

```markdown
[![CI](https://github.com/YOUR_USERNAME/vache-taureau/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/vache-taureau/actions/workflows/ci.yml)
```

### Step 3: Branch Protection Rules (Recommended)

1. Go to Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
4. Add required status checks:
   - `Test on Node.js 16.x`
   - `Test on Node.js 18.x`
   - `Test on Node.js 20.x`
   - `Code Quality Check`
   - `Build Check`

### Step 4: Configure Secrets (Optional)

For deployment workflows, add secrets:
1. Go to Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add deployment credentials:
   - `DEPLOY_KEY`: SSH key or deployment token
   - `SERVER_HOST`: Deployment server address
   - `SERVER_USER`: Deployment username

### Step 5: Test the Setup

1. **Create a test branch:**
   ```bash
   git checkout -b test-ci
   echo "test" >> README.md
   git add README.md
   git commit -m "test: verify CI pipeline"
   git push origin test-ci
   ```

2. **Create a pull request:**
   - Go to GitHub → Pull Requests → New Pull Request
   - Select your test branch
   - Watch the CI checks run automatically

3. **Verify all checks pass:**
   - All jobs should show green checkmarks
   - Review the logs if any job fails

## 💰 Free Tier Limits

### GitHub Actions Free Tier
- **Public repos:** Unlimited minutes
- **Private repos:** 2,000 minutes/month
- **Storage:** 500 MB for artifacts and packages

### Optimization for Free Tier

Our workflows are optimized to minimize CI minutes:

1. **Parallel Jobs:** Test, lint, and security run simultaneously
2. **Caching:** npm dependencies are cached between runs
3. **Fast Failure:** Jobs fail fast to save minutes
4. **Conditional Execution:** Deploy only runs on releases

**Estimated Monthly Usage (Private Repo):**
- ~5 minutes per push × 40 pushes = 200 minutes
- ~5 minutes per PR × 10 PRs = 50 minutes
- **Total:** ~250 minutes/month (well under 2,000 limit)

### Tips to Save CI Minutes

1. **Consolidate commits** before pushing
2. **Use draft PRs** for work-in-progress
3. **Skip CI** when not needed:
   ```bash
   git commit -m "docs: update README [skip ci]"
   ```
4. **Cancel redundant workflows** when pushing multiple times
5. **Use workflow_dispatch** for manual testing

## 🔍 Monitoring Usage

### View Workflow Runs
1. Go to repository → Actions tab
2. See all workflow runs and their status
3. Click on any run to see detailed logs

### Check Minutes Usage
1. Go to GitHub → Settings → Billing
2. View "Actions" usage
3. Monitor minutes consumed

### View Artifacts
1. Go to Actions → Select a workflow run
2. Scroll to "Artifacts" section
3. Download deployment packages (available for 7 days)

## 🐛 Troubleshooting

### Common Issues

#### 1. Tests Fail in CI but Pass Locally
**Cause:** Environment differences
**Solution:**
```bash
# Run tests with CI environment
CI=true npm test

# Check Node.js version matches
node --version
```

#### 2. Build Timeout
**Cause:** Long-running build process
**Solution:**
- Increase timeout in workflow:
  ```yaml
  timeout-minutes: 10
  ```
- Optimize build process

#### 3. npm ci Fails
**Cause:** package-lock.json out of sync
**Solution:**
```bash
rm package-lock.json
npm install
git add package-lock.json
git commit -m "fix: update package-lock.json"
```

#### 4. Cache Issues
**Cause:** Corrupted npm cache
**Solution:**
- Wait for cache to expire (7 days)
- Or manually clear cache in workflow

#### 5. Permission Denied
**Cause:** Insufficient permissions
**Solution:**
- Check repository settings → Actions permissions
- Verify workflow has correct permissions in YAML

### Debug Workflows

Enable debug logging:
1. Go to Settings → Secrets
2. Add secret: `ACTIONS_STEP_DEBUG` = `true`
3. Re-run workflow to see detailed logs

## 📊 Workflow Status

Monitor your CI/CD health:

```bash
# View recent workflow runs
gh run list

# View specific workflow
gh run view <run-id>

# Cancel running workflow
gh run cancel <run-id>

# Re-run failed workflow
gh run rerun <run-id>
```

## 🎓 Best Practices

1. **Keep workflows fast:** Optimize for < 5 minutes
2. **Use matrix testing:** Test multiple Node.js versions
3. **Cache dependencies:** Speeds up subsequent runs
4. **Fail fast:** Exit early on critical errors
5. **Use secrets:** Never commit credentials
6. **Monitor usage:** Stay within free tier limits
7. **Document changes:** Update this guide when modifying workflows

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [npm ci vs npm install](https://docs.npmjs.com/cli/v8/commands/npm-ci)
- [Managing Workflow Runs](https://docs.github.com/en/actions/managing-workflow-runs)

## 🆘 Getting Help

If you encounter issues:
1. Check workflow logs in Actions tab
2. Review this troubleshooting guide
3. Search GitHub Actions community forum
4. Open an issue with workflow logs

---

Last updated: 2025-01-19
