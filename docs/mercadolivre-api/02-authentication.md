# Mercado Livre — Authentication & Authorization

## OAuth 2.0 — Authorization Code Grant (the flow we use)

PromoBot uses the **Authorization Code** flow, done **once** by the app owner. After that, the system uses the refresh token to renew the access token automatically forever.

---

## Step 1: Get Authorization Code (browser, done once)

Open this URL in a browser while logged in as the ML app owner:

```
https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=$APP_ID&redirect_uri=$REDIRECT_URI
```

The user is shown an authorization screen. After approving, they are redirected to:

```
https://YOUR_REDIRECT_URI?code=TG-61828b7fffcc9a001b4bc890-314029626
```

**The code expires in ~10 minutes.** Exchange it immediately.

### Optional: PKCE (recommended for security)

Add these parameters to the URL:
- `code_challenge=$CODE_CHALLENGE`
- `code_challenge_method=S256`

And include `code_verifier=$CODE_VERIFIER` in the token exchange below.

---

## Step 2: Exchange Code for Tokens

```bash
curl -X POST \
  -H 'accept: application/json' \
  -H 'content-type: application/x-www-form-urlencoded' \
  'https://api.mercadolibre.com/oauth/token' \
  -d 'grant_type=authorization_code' \
  -d 'client_id=$APP_ID' \
  -d 'client_secret=$SECRET_KEY' \
  -d 'code=$SERVER_GENERATED_AUTHORIZATION_CODE' \
  -d 'redirect_uri=$REDIRECT_URI'
```

**Always send parameters in the body, not as query string.**

Response:

```json
{
    "access_token": "APP_USR-123456-090515-8cc4448aac10d5105474e1351-1234567",
    "token_type": "bearer",
    "expires_in": 21600,
    "scope": "offline_access read write",
    "user_id": 1234567,
    "refresh_token": "TG-5b9032b4e23464aed1f959f-1234567"
}
```

| Token | Lifetime | Notes |
|---|---|---|
| `access_token` | 6 hours (21600s) | Send in `Authorization: Bearer` header |
| `refresh_token` | 6 months | **Single-use** — always store the new one after each refresh |

---

## Step 3: Refresh Access Token (automatic, repeated every 6h)

```bash
curl -X POST \
  -H 'accept: application/json' \
  -H 'content-type: application/x-www-form-urlencoded' \
  'https://api.mercadolibre.com/oauth/token' \
  -d 'grant_type=refresh_token' \
  -d 'client_id=$APP_ID' \
  -d 'client_secret=$SECRET_KEY' \
  -d 'refresh_token=$REFRESH_TOKEN'
```

Response: same structure as Step 2 — **new `access_token` and new `refresh_token`**.

**Critical rules:**
- Only use the **latest** refresh token — previous ones are immediately invalidated
- Refresh tokens are tied to the `client_id` that created them
- Refresh proactively before expiry (check if `expires_at - now < 5 minutes`)

---

## Using the Access Token

Send in the `Authorization` header on every API call:

```
Authorization: Bearer APP_USR-12345678-031820-X-12345678
```

---

## When Tokens Are Invalidated (invalid_grant errors)

Refresh tokens become invalid when:
- The user changes their ML password
- The app owner updates the `client_secret`
- The user revokes permissions for the app
- The app hasn't made any API call for **4 months**
- The refresh token hasn't been used for **6 months**

If you receive `invalid_grant`, the app owner must redo Step 1 and Step 2.

---

## Error Reference

| Error | Cause |
|---|---|
| `invalid_client` | Wrong `client_id` or `client_secret` |
| `invalid_grant` | Authorization code or refresh token expired, already used, or revoked |
| `invalid_scope` | Requested scope is invalid. Allowed values: `offline_access`, `write`, `read` |
| `invalid_request` | Missing required parameter or malformed request |
| `unsupported_grant_type` | Only `authorization_code` and `refresh_token` are valid |
| `forbidden (403)` | Token belongs to another user, IP blocked, or missing scopes |
| `local_rate_limited (429)` | Too many requests — back off and retry after a few seconds |
| `unauthorized_client` | App has no grant from the user for the requested permissions |
| `unauthorized_application` | App is blocked — check the DevCenter |
