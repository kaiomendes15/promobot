# Mercado Livre — Product Search

## Item Search (what PromoBot uses)

```
GET https://api.mercadolibre.com/sites/{site_id}/search
```

**Site ID for Brazil:** `MLB`

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `category` | string | ML category ID (e.g. `MLB1276`) — filter by category |
| `sort` | string | `price_discount_high` sorts by highest discount first |
| `limit` | int | Max results per call (default varies, max ~50) |
| `q` | string | Keyword search query |
| `offset` | int | Pagination offset |

### Example

```bash
curl -H 'Authorization: Bearer $ACCESS_TOKEN' \
  'https://api.mercadolibre.com/sites/MLB/search?category=MLB1276&sort=price_discount_high&limit=50'
```

### Response Structure

```json
{
    "results": [
        {
            "id": "MLB1234567890",
            "title": "Whey Protein 900g - Chocolate",
            "thumbnail": "http://http2.mlstatic.com/D_NQ_NP_...",
            "price": 89.90,
            "original_price": 149.90,
            "permalink": "https://www.mercadolivre.com.br/whey-protein.../p/MLB...",
            "currency_id": "BRL",
            "condition": "new"
        }
    ],
    "paging": {
        "total": 1250,
        "offset": 0,
        "limit": 50
    }
}
```

### Identifying a Real Discount

A product has a genuine discount when:
1. `original_price` is **not null**
2. `original_price` **> price**

```python
def has_real_discount(item: dict) -> bool:
    return (
        item.get("original_price") is not None
        and item["original_price"] > item["price"]
    )
```

### Thumbnail HTTPS Fix

ML thumbnails may return HTTP URLs. Force HTTPS before storing:

```python
photo_url = item["thumbnail"].replace("http://", "https://", 1)
```

---

## Catalog Product Search (alternative)

```
GET https://api.mercadolibre.com/products/search
```

Used to find catalog product definitions (titles, specs, photos). Returns product definitions, not active listings with live prices.

### Parameters

| Parameter | Required | Description |
|---|---|---|
| `site_id` | yes | `MLB` for Brazil |
| `q` | if no `product_identifier` | Keyword search |
| `product_identifier` | if no `q` | GTIN/EAN/UPC |
| `domain_id` | no | Filter by domain (e.g. `MLB-SUPPLEMENTS`) |
| `status` | no | `active` or `inactive` |

### Example

```bash
curl -H 'Authorization: Bearer $ACCESS_TOKEN' \
  'https://api.mercadolibre.com/products/search?status=active&site_id=MLB&q=whey+protein'
```

---

## Affiliate URL

Append `?matt_tool=YOUR_AFFILIATE_ID` to the product `permalink` to generate a tracked affiliate link.

```python
from urllib.parse import urlencode, urlparse, parse_qs, urlunparse

def build_affiliate_url(permalink: str, affiliate_id: str) -> str:
    parsed = urlparse(permalink)
    params = parse_qs(parsed.query)
    params["matt_tool"] = [affiliate_id]
    new_query = urlencode({k: v[0] for k, v in params.items()})
    return urlunparse(parsed._replace(query=new_query))
```

---

## Notes

- Results with `original_price=null` are not discounted — skip them
- ML allows sellers to set inflated `original_price` values; this is a known limitation
- The `id` field (e.g. `MLB1234567890`) maps to `Product.ml_product_id` in the DB
