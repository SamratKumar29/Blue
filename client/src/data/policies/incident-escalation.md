# Incident Escalation & Response Policy

## Overview
This document defines severity tiers, response time requirements, and escalation paths for production anomalies affecting Acme customer services, including Project Atlas and Orion Billing.

## Severity Classifications
- **SEV-1 (Critical Outage):** Core service completely down, customer data loss risk, or payment processing failure affecting all users. Requires immediate page.
- **SEV-2 (Major Degradation):** Degraded performance, key feature failure (such as checkout timeouts), or elevated error rates (>5%) without total service loss.
- **SEV-3 (Minor Bug):** Non-blocking functional defects, cosmetic UI anomalies, or issues with documented workarounds.

## Escalation Workflow
1. **Initial Detection:** Any engineer observing automated alerts or receiving health check alarms must immediately post to the `#incidents` Slack channel with error logs and affected host details.
2. **On-Call Assignment:** The on-call DevOps Engineer (Amir Hassan) leads operational mitigation. If the incident is code-related, the pod Tech Lead (Marcus Thompson) is paged.
3. **Escalation Rules:** If a SEV-1 or SEV-2 incident remains uncontained after 30 minutes, engineering leadership and product management must be notified.
4. **Resolution & Blameless Post-Mortem:** A blameless retrospective must be published within 48 hours focusing on system resilience and test automation improvements.
