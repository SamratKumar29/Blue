# Code Review Norms & Security Standards

## Philosophy
Code review is a collaborative peer learning opportunity and our primary line of defense against vulnerabilities, architectural regressions, and technical debt. Every pull request must be approached with empathy, rigor, and constructive communication.

## Review Standards & SLAs
- **Turnaround Time:** Peer reviews should be conducted within 24 hours of submission during normal business days. Pull requests marked with `[urgent-hotfix]` require a 2-hour response window.
- **Review Size:** Pull requests should ideally be under 400 lines of modified code. Large architectural migrations must be decomposed into sequential, verifiable feature flags or PR increments.
- **Required Approvals:** All production-bound branches require at least two approving reviews: one from a domain peer and one from an appointed code owner or Tech Lead.

## Security & Privacy Non-Negotiables
1. **Never Commit Secrets:** API keys, access tokens, private certificates, or production database passwords must never be committed. Pre-commit hooks automatically scan for entropy anomalies.
2. **Sanitize Error Disclosures:** Stack traces and internal server metadata must be intercepted and masked before transmission to client endpoints.
3. **No Codebase Leakage:** Code companion tools and conversational bots are prohibited from indexing raw repository branches or commit histories without explicit engineering authorization.
