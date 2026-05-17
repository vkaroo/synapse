# Contributing to Synapse

Thank you for your interest in contributing to Synapse! This document provides guidelines for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Submit a pull request

## Development Setup

```bash
# Clone
git clone https://github.com/your-username/synapse.git
cd synapse

# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Create D1 database
wrangler d1 create ai-router-db

# Update wrangler.toml with your database_id

# Deploy
wrangler deploy
```

## Code Style

- JavaScript: Use ESLint
- Bash: Use ShellCheck
- Follow existing patterns in the codebase

## Pull Request Process

1. Update README.md if needed
2. Update CHANGELOG.md with your changes
3. Ensure all tests pass
4. Request review from maintainers

## Reporting Issues

- Use GitHub Issues
- Include reproduction steps
- Include error messages and logs

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
