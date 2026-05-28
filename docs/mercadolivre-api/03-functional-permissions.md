# Mercado Livre — Functional Permissions (Scopes)

## Overview

When creating an ML application, you configure which permissions your app needs. These determine what API resources are accessible.

## Scope Types

| Scope | HTTP Methods |
|---|---|
| **Somente leitura (read-only)** | GET |
| **Leitura e escrita (read+write)** | GET, PUT, POST, DELETE |

## Available Permissions

### Usuários (default — always enabled)
Access to user account information. Enabled by default on all applications.

### Publicação e sincronização ← **PromoBot needs this**
Allows reading items, prices, and catalog data. Needed to access the search endpoint and product details.

Resources: items, pictures, prices, catalog, categories

**For PromoBot:** Enable this permission with **read-only** scope.

### Comunicação pré e pós-venda
Read and send pre/post-purchase messages. Not needed for PromoBot.

### Publicidade
Create and manage advertising campaigns. Not needed for PromoBot.

### Métricas do negócio
Sales metrics, trends, highlights, visits. Not needed for PromoBot.

### Vendas e envios
Manage orders and shipments. Not needed for PromoBot.

### Promoções, cupons e descontos
Access and manage seller promotions, offers, and coupons.
Resources: offers, deals

**Note:** This is the SELLER-SIDE promotions API — for sellers to create/manage their own deals. PromoBot reads public discounts from the search API, not from this endpoint.

### Faturamento
Billing and invoice management. Not needed for PromoBot.

## Missing Permission Error

If a call hits a resource you don't have permission for:

```json
{
    "code": "PA_UNAUTHORIZED_RESULT_FROM_POLICIES",
    "blocked_by": "PolicyAgent",
    "message": "At least one policy returned UNAUTHORIZED.",
    "status": 403
}
```

Fix: go to the app's DevCenter settings and enable the required functional permission.

## PromoBot Required Permissions Summary

| Permission | Scope | Why |
|---|---|---|
| Usuários | read | Default, always on |
| Publicação e sincronização | read | Access search endpoint, categories, item data |
