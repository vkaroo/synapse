# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅ Active support  |
| < 1.0   | ❌ No support      |

## Reporting a Vulnerability

If you discover a security vulnerability in Synapse, please report it responsibly.

### How to Report

1. **DO NOT** open a public GitHub issue
2. Email: vkaroo@users.noreply.github.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment** — Within 48 hours
- **Assessment** — Within 1 week
- **Fix** — Depending on severity
- **Credit** — In security advisory (if desired)

## Security Best Practices

### For Users

- **Change default password** — Never use default `DASHBOARD_PASSWORD`
- **Use secrets** — Store sensitive values in Cloudflare secrets
- **Rotate keys** — Regularly rotate API keys
- **Monitor logs** — Check for suspicious activity
- **Limit access** — Use authentication for all endpoints

### For Contributors

- **No hardcoded secrets** — Use environment variables
- **Validate input** — Sanitize all user input
- **Handle errors** — Don't expose internal details
- **Use HTTPS** — Always use secure connections
- **Follow OWASP** — Web application security guidelines

## Security Features

- **Authentication** — Password-based dashboard access
- **CORS** — Configurable cross-origin policies
- **Rate Limiting** — Built-in request throttling
- **Input Validation** — Request body validation
- **Error Handling** — Safe error messages

## Disclosure Policy

- Vulnerabilities are disclosed after a fix is available
- Users are notified via GitHub Security Advisories
- CVEs are assigned for critical vulnerabilities

---

**Thank you for helping keep Synapse secure!** 🔒
