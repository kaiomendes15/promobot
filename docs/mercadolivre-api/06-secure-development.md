# Mercado Livre — Secure Development

## Token Handling

### Always use the Authorization header

```bash
# Correct
curl -H 'Authorization: Bearer APP_USR-xxxx' https://api.mercadolibre.com/...

# Wrong — never put the token in the URL
curl 'https://api.mercadolibre.com/...?access_token=APP_USR-xxxx'
```

### Refresh only when expired

Do not refresh the token on every call. Check if `expires_at - now() < 5 minutes` and only refresh then. Unnecessary refreshes consume the single-use refresh token.

### Store the new refresh token immediately

After every successful token refresh, the old refresh token is invalidated. Store the new `refresh_token` returned in the response before making any other call.

```python
# Safe pattern
new_tokens = await _refresh_tokens(db)
# new_tokens.refresh_token is now the valid one
# the old one is already dead
```

---

## OAuth Flow Security

### Use the `state` parameter to prevent CSRF

Generate a secure random value and include it in the authorization URL:

```
https://auth.mercadolivre.com.br/authorization?...&state=SECURE_RANDOM_VALUE
```

When ML redirects back with `?code=...&state=...`, verify the state matches what you sent.

### redirect_uri must match exactly

The `redirect_uri` in the token exchange must be **identical** to what is registered in the DevCenter app. Even a trailing slash difference causes an error.

### Never expose client_secret

Keep `MERCADOLIVRE_CLIENT_SECRET` in `.env`, never commit it, never log it.

---

## HTTP Client Best Practices

### Send parameters in the body for token endpoints

```bash
# Correct — parameters in body
curl -X POST 'https://api.mercadolibre.com/oauth/token' \
  -H 'content-type: application/x-www-form-urlencoded' \
  -d 'grant_type=refresh_token&...'

# Wrong — parameters in query string
curl -X POST 'https://api.mercadolibre.com/oauth/token?grant_type=refresh_token&...'
```

### Handle 401 gracefully

If a call returns 401, refresh the token and retry once. If the refresh also fails (`invalid_grant`), the app owner must redo the full authorization flow.

### Handle 429 with backoff

If you receive `local_rate_limited (429)`, wait a few seconds before retrying. Do not hammer the API.

---

## PKCE (Optional but Recommended)

For additional security, enable PKCE in the DevCenter app settings and include:
- `code_verifier`: a random 43-128 character string
- `code_challenge`: `BASE64URL(SHA256(code_verifier))`
- `code_challenge_method`: `S256`

in the authorization URL and token exchange.
