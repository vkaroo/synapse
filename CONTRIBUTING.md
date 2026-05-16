# Contributing to Synapse

Thank you for your interest in contributing to Synapse! 🧠

## How to Contribute

### 1. Fork & Clone

```bash
git clone https://github.com/YOUR_USERNAME/synapse.git
cd synapse
```

### 2. Create Branch

```bash
git checkout -b feature/amazing-feature
```

### 3. Make Changes

- Follow the existing code style
- Add comments for complex logic
- Test your changes locally

### 4. Commit

```bash
git commit -m "feat: add amazing feature"
```

Use conventional commits:
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `style:` — Formatting
- `refactor:` — Code refactoring
- `test:` — Tests
- `chore:` — Maintenance

### 5. Push & PR

```bash
git push origin feature/amazing-feature
```

Then open a Pull Request!

## Development Setup

### Prerequisites

- Node.js 18+
- Cloudflare account
- Wrangler CLI

### Local Development

```bash
# Install dependencies
npm install

# Run locally
npx wrangler dev

# Test endpoints
curl http://localhost:8787/brain/status
```

### Database Setup

```bash
# Create D1 database
npx wrangler d1 create synapse-db

# Run migrations (tables are auto-created on first request)
```

## Code Guidelines

### JavaScript

- Use modern ES6+ syntax
- Add JSDoc comments for functions
- Handle errors gracefully
- Keep functions focused and small

### API Design

- Follow OpenAI API specification
- Use consistent naming (snake_case)
- Return meaningful error messages
- Include CORS headers

## Reporting Issues

### Bug Reports

Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details

### Feature Requests

Include:
- Use case description
- Proposed solution
- Alternatives considered

## Community

- Be respectful and inclusive
- Help others when possible
- Share knowledge and ideas

## Questions?

Open an issue or reach out to the maintainers.

---

**Thank you for contributing!** 🎉
