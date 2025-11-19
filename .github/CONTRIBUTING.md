# Contributing to Vache et Taureau

Thank you for considering contributing to this project! 🎉

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16.0.0
- npm >= 8.0.0
- Git

### Setup Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/vache-taureau.git
   cd vache-taureau/web-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🧪 Testing

Before submitting a pull request, ensure all tests pass:

```bash
# Run tests
npm test

# Run server
npm start
```

### Writing Tests

Add tests to `test.js` for any new functionality. Our test suite includes:
- Game logic tests
- Player management tests
- Bulls and cows calculation tests
- Edge case handling

Example:
```javascript
console.log('--- Test Group: Your Feature ---');
const gameX = new VacheTaureauGame('TEST-ROOM-X');
assert(condition, 'Description of what should happen');
```

## 📋 Pull Request Process

1. **Update documentation**
   - Update README.md if adding features
   - Add comments to complex code
   - Update API documentation if needed

2. **Ensure CI passes**
   - All tests must pass
   - Code must build successfully
   - No security vulnerabilities

3. **Write clear commit messages**
   ```bash
   git commit -m "feat: add new feature description"
   git commit -m "fix: resolve issue with X"
   git commit -m "docs: update README"
   ```

4. **Submit PR**
   - Provide clear description of changes
   - Reference any related issues
   - Add screenshots for UI changes

## 🔄 CI/CD Pipeline

Our CI pipeline runs automatically on every push and pull request:

### Checks Performed
- ✅ **Tests:** Unit tests on Node.js 16.x, 18.x, 20.x
- ✅ **Build:** Verify project builds without errors
- ✅ **Code Quality:** Style and consistency checks
- ✅ **Security:** Dependency vulnerability scan
- ✅ **Server Start:** Verify server starts successfully

### Required Status Checks
All CI checks must pass before a PR can be merged to `main`.

## 🐛 Reporting Bugs

### Before Submitting
- Check existing issues
- Verify bug with latest version
- Collect error messages and logs

### Bug Report Template
```markdown
**Description**
A clear description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., macOS, Windows, Linux]
- Node.js version: [e.g., 20.0.0]
- Browser: [e.g., Chrome 120]
```

## 💡 Feature Requests

We welcome feature requests! Please:
1. Check if feature already exists
2. Describe use case clearly
3. Explain expected behavior
4. Consider implementation complexity

## 🎨 Code Style

### JavaScript
- Use ES6+ features
- Use meaningful variable names
- Add comments for complex logic
- Follow existing code patterns

### Example
```javascript
// Good
const calculateScore = (attempts) => {
  return Math.max(1000 - (attempts - 1) * 100, 100);
};

// Bad
const cs = (a) => {
  return 1000 - (a - 1) * 100;
};
```

### Commits
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions or changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

## 📞 Getting Help

- **Issues:** GitHub Issues for bugs and features
- **Discussions:** Use GitHub Discussions for questions
- **Documentation:** Check README.md and code comments

## 🏆 Recognition

Contributors will be added to the README's contributors section.

Thank you for contributing! 🙏
