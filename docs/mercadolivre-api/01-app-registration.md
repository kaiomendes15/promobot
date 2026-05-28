# Mercado Livre — App Registration

## Creating an Application

1. Log in at https://developers.mercadolivre.com.br/devcenter
2. Click "Criar uma aplicação" and fill in all required fields
3. After saving you will receive a **client_id** and **client_secret** (Secret Key)

**Important:** Use the account owner's account when creating the app. In Brazil, Argentina, Mexico, and Chile only **one application** is allowed per account.

## Required Fields

| Field | Description |
|---|---|
| Nome | Unique application name |
| Nome curto | Used to generate the app URL |
| Descrição | Shown when the app requests authorization (max 150 chars) |
| URLs de redirecionamento | Where the authorization code is sent after user grants access |

## Redirect URI Rules

- Must use **HTTPS** (required)
- Must match **exactly** what is registered — no variable parts, no trailing slashes
- Register the root domain or a specific callback path
- Example: `https://yourdomain.com/auth/callback`

## Scopes (Permissions)

Set during app creation. For PromoBot (read-only search):

| Scope | Access |
|---|---|
| **Leitura (read)** | GET requests — reading catalog, prices, categories |
| **Escrita (write)** | PUT/POST/DELETE — managing listings (not needed for PromoBot) |

For PromoBot, **read scope is sufficient**. Enable "Publicação e sincronização" permission with read-only to access the search endpoint.

## Credentials

After creation, the DevCenter shows:
- **client_id** — the APP_ID used in all OAuth calls
- **client_secret** — keep secret, never commit to git, store in `.env`

## Environment Variables (backend/.env)

```
MERCADOLIVRE_CLIENT_ID=your_client_id_here
MERCADOLIVRE_CLIENT_SECRET=your_client_secret_here
MERCADOLIVRE_REDIRECT_URI=https://yourdomain.com/auth/callback
MERCADOLIVRE_AFFILIATE_ID=your_affiliate_id_here
```
