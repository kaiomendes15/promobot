# Mercado Livre — Categories

## Site IDs

| Country | Site ID |
|---|---|
| Brasil | `MLB` |
| Argentina | `MLA` |
| México | `MLM` |
| Chile | `MLC` |

---

## List Top-Level Categories for a Site

```bash
curl -H 'Authorization: Bearer $ACCESS_TOKEN' \
  'https://api.mercadolibre.com/sites/MLB/categories'
```

Response (excerpt):

```json
[
  { "id": "MLB1276", "name": "Esportes e Fitness" },
  { "id": "MLB1648", "name": "Computação" },
  { "id": "MLB1246", "name": "Beleza e Cuidado Pessoal" }
]
```

**Use this to find the correct `ml_category_id` for each PromoBot niche.**

---

## Get Category Details

```bash
curl -H 'Authorization: Bearer $ACCESS_TOKEN' \
  'https://api.mercadolibre.com/categories/MLB1276'
```

Response includes `path_from_root`, subcategories (`children_categories`), and settings.

---

## Category Predictor (from a product title)

```bash
curl -H 'Authorization: Bearer $ACCESS_TOKEN' \
  'https://api.mercadolibre.com/sites/MLB/domain_discovery/search?q=whey+protein&limit=3'
```

Response:

```json
[
  {
    "domain_id": "MLB-SUPPLEMENTS",
    "domain_name": "Suplementos",
    "category_id": "MLB1276",
    "category_name": "Esportes e Fitness",
    "attributes": [...]
  }
]
```

Useful for finding the right category from a text description.

---

## Domain to Category Mapping

```bash
curl 'https://api.mercadolibre.com/catalog_domains/MLB-SUPPLEMENTS/categories'
```

Response:

```json
[{ "id": "MLB1276", "name": "Esportes e Fitness" }]
```

---

## PromoBot Niche → Category ID Mapping

| Niche | Expected Category ID | Category Name |
|---|---|---|
| Gym & Sports | `MLB1276` (verify) | Esportes e Fitness |

**Verify by running:**
```bash
curl -H 'Authorization: Bearer $TOKEN' \
  https://api.mercadolibre.com/sites/MLB/categories | python3 -m json.tool | grep -A1 sport -i
```

Update `main.py` niche seed with the verified ID before running the pipeline.
