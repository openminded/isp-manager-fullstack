# Security Guidelines for isp-manager-fullstack

This document defines security best practices and requirements tailored to the `isp-manager-fullstack` Next.js full-stack starter kit. It ensures your ISP Management Portal is designed and implemented with robust, defense-in-depth controls from day one.

---

## 1. Introduction & Scope

- **Purpose**: Provide a secure foundation for building an ISP Management Portal, covering authentication, database integration, API routes, UI components, and MikroTik RouterOS integration.
- **Audience**: Developers and DevOps engineers extending or deploying `isp-manager-fullstack`.
- **Coverage**: Architecture, coding practices, configuration, and operational procedures.

---

## 2. Core Security Principles

1. **Security by Design**: Incorporate security requirements into every feature (authentication, data models, router integration).
2. **Least Privilege**: Grant minimal permissions to database roles, API routes, and cloud resources.
3. **Defense in Depth**: Layered controls—network, application, data, and user.
4. **Fail Securely**: Default to deny on errors; avoid leaking stack traces.
5. **Secure Defaults**: All new features (RBAC, MikroTik module) start locked down.

---

## 3. Authentication & Role-Based Access Control (RBAC)

- **User Authentication**
  - Use `better-auth` for session management; enforce strong session IDs and HTTP-only, Secure, SameSite cookies.
  - Implement idle and absolute session timeouts; provide explicit logout flows.
- **Password Policies**
  - Require minimum length (e.g., 12 characters), complexity (upper, lower, digit, symbol), and reuse prevention.
  - Store hashed with Argon2 or bcrypt + unique salt.
- **JWT (if used for APIs)**
  - Sign with RS256 or HS256; validate `exp`, `iss`, `aud`.
- **RBAC**
  - Extend the Drizzle `auth.ts` schema to include roles (e.g., `admin`, `technician`).
  - Enforce server-side checks in API routes and Server Actions. Deny unauthorized access by default.
- **Multi-Factor Authentication (MFA)**
  - Plan for optional TOTP or SMS-based MFA for admin-level accounts.

---

## 4. Input Handling & Validation

- **Parameter Validation**
  - Use Zod or Joi schemas in API routes and Server Actions to validate all incoming JSON and form data.
  - Reject unexpected fields and enforce type constraints.
- **Prevent Injection**
  - Leverage Drizzle ORM’s parameterized queries to avoid SQL injection.
  - Validate MikroTik API parameters (e.g., usernames, passwords) against allow-lists or regex patterns.
- **File Uploads (if added)**
  - Restrict file types, sizes, and scan for malware. Store outside the webroot.
- **Redirects**
  - Validate any dynamic redirect targets against a whitelist.

---

## 5. Data Protection & Privacy

- **Encryption In Transit**
  - Enforce TLS 1.2+ for all frontend and API communication.
- **Encryption At Rest**
  - Enable encryption on the PostgreSQL instance (e.g., AWS RDS encryption).
- **Secret Management**
  - Store `DATABASE_URL`, `AUTH_SECRET`, and MikroTik credentials in environment variables and a secret manager (Vault, AWS Secrets Manager).
  - Never commit secrets to source control or `.env` files in repos.
- **PII Protection**
  - Mask sensitive fields (e.g., customer addresses, phone numbers) in logs and UI where not needed.
- **Logging**
  - Log security-relevant events (login success/failure, role changes, PPPoE operations) to a centralized, access-controlled system.

---

## 6. API & Service Security

- **HTTPS Only**
  - Redirect all HTTP traffic to HTTPS. Set HSTS header (`max-age=31536000; includeSubDomains; preload`).
- **Rate Limiting & Throttling**
  - Implement middleware (e.g., Next.js Edge middleware or API route wrappers) to limit login attempts and sensitive operations.
- **CORS**
  - Allow only your application’s origin in `Access-Control-Allow-Origin` for any public API endpoints.
- **Minimal Data Exposure**
  - Return only required fields in API responses. Avoid exposing internal IDs or router credentials.
- **Correct HTTP Verbs**
  - Enforce GET for reads, POST for creates, PUT/PATCH for updates, DELETE for removals.
- **Versioning**
  - Prefix API routes (e.g., `/api/v1/clients`) to manage breaking changes.

---

## 7. Web Application Security Hygiene

- **CSRF Protection**
  - Use anti-CSRF tokens for all state-changing forms and AJAX calls.
- **Security Headers**
  - Content-Security-Policy: restrict scripts/styles to self and trusted CDN with SRI.
  - X-Frame-Options: `DENY` or `SAMEORIGIN`.
  - X-Content-Type-Options: `nosniff`.
  - Referrer-Policy: `no-referrer-when-downgrade` or stricter.
- **Secure Cookies**
  - Set `HttpOnly`, `Secure`, `SameSite=Strict`.
- **Client-Side Storage**
  - Avoid storing tokens in localStorage or sessionStorage; rely on cookies.

---

## 8. Infrastructure & Configuration Management

- **Server Hardening**
  - Disable unused ports/services. Close default accounts.
- **TLS Configuration**
  - Use modern cipher suites, disable SSLv3/TLS1.0/1.1. Renew certificates automatically (e.g., Let’s Encrypt).
- **Environment Separation**
  - Separate dev, staging, and production environments. Use distinct secrets and databases.
- **Automated Backups & Recovery**
  - Schedule encrypted database backups. Test restore procedures regularly.
- **Disable Debug in Prod**
  - Ensure `next.config.js` has `reactStrictMode: false` in production and no verbose error pages.

---

## 9. Dependency Management

- **Secure Dependencies**
  - Vet all NPM packages (`drizzle-orm`, `better-auth`, `mikrotik-api`) for security posture and maintenance activity.
- **Vulnerability Scanning**
  - Integrate Dependabot, Snyk, or GitHub Advanced Security to detect CVEs.
- **Immutable Lockfiles**
  - Commit `package-lock.json` (or `yarn.lock`) and enforce in CI to prevent fresh installs of vulnerable versions.
- **Minimize Footprint**
  - Remove unused dependencies. Audit transitive dependencies for high-severity issues.

---

## 10. Operational Monitoring & Incident Response

- **Monitoring**
  - Track application health, API latency, login failures, and router-sync errors (e.g., PPPoE creation failures).
- **Alerting**
  - Configure alerts for security events (multiple failed logins, unexpected role changes, expired TLS certificates).
- **Incident Response Plan**
  - Define roles and procedures for breach detection, containment, eradication, and recovery.

---

By adhering to these guidelines, the `isp-manager-fullstack` starter kit will provide a secure, maintainable, and scalable foundation for your custom ISP Management Portal.

*Last Updated: YYYY-MM-DD*