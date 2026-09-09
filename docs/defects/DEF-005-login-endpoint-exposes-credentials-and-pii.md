# DEF-005 — Login endpoint accepts credentials via URL path and returns PII including SSN

**Severity:** Critical   **Priority:** Critical
**Found:** REST surface enumeration via WADL (`/parabank/services/bank?_wadl`)
**Environment:** parasoft/parabank:latest, local Docker

## Steps
```
GET /parabank/services/bank/login/{username}/{password}
Accept: application/json
```

## Actual

`200 OK`, no `Set-Cookie` header, full customer record returned in the body:

```json
{"id":12545,"firstName":"John","lastName":"Doe",
 "address":{"street":"123 Avenue","city":"Montreal","state":"QC","zipCode":"H4A3L5"},
 "phoneNumber":"1234567890","ssn":"987654321"}
```

An invalid password returns `400` with a plain-text body
(`Invalid username and/or password`) — the endpoint is live and functioning
as designed, not an accidental exposure of a broken route.

## Why this matters

- **Credentials in the URL path**, not the body or an Authorization header.
  URLs are written in plaintext to server access logs, reverse proxy logs,
  and browser history, and are commonly forwarded in full via the
  `Referer` header on any subsequent navigation.
- **No session is established.** No `Set-Cookie` on success — this is a
  bare credential check that returns the full customer record, not an
  authentication flow.
- **The response includes the SSN unencrypted.** A request/response pair
  captured by any logging middleware between client and server contains a
  valid username, valid password, and SSN together, in plaintext, in a
  single log line.

## Impact

Credential and PII exposure via a documented, reachable REST endpoint.
Falls under OWASP API Security Top 10 API2:2023 (Broken Authentication) —
credentials are accepted via an insecure transport pattern rather than a
POST body or Authorization header. The SSN exposure in the response body is
a related but separate issue: sending more data than the caller needs.
Severity is Critical rather than High because the leaked field is an SSN,
not account metadata.

## Status

Open, third-party application, cannot be patched. Encoded as a
`test.fail()` regression test asserting the endpoint should not accept
credentials via URL or return PII in a GET response — see
`tests/api/login-endpoint.spec.ts`.