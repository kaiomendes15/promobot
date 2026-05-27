import type { Promotion } from '../types/api'

export const MOCK_PROMOTIONS: Promotion[] = [
  {
    id: 1,
    product_id: 1,
    niche_id: 1,
    original_price: 349.90,
    promo_price: 199.90,
    affiliate_url: 'https://mercadolivre.com.br/p/MLB123456',
    created_at: '2026-05-25T10:00:00Z',
    expires_at: null,
    product: {
      id: 1,
      ml_product_id: 'MLB123456',
      title: 'Tênis de Corrida Nike Revolution 7 Masculino',
      photo_url: 'https://placehold.co/400x400/f3f4f6/9ca3af?text=Produto',
      gemini_description:
        'Tênis leve com amortecimento responsivo, ideal para treinos diários e corridas de curta distância. Solado de borracha durável e cabedal respirável.',
      store: 'mercadolivre',
      created_at: '2026-05-25T09:00:00Z',
    },
    niche: { id: 1, title: 'Gym & Sports', ml_category_id: 1276 },
  },
  {
    id: 2,
    product_id: 2,
    niche_id: 1,
    original_price: 129.90,
    promo_price: 89.90,
    affiliate_url: 'https://mercadolivre.com.br/p/MLB234567',
    created_at: '2026-05-25T10:05:00Z',
    expires_at: '2026-05-26T23:59:00Z',
    product: {
      id: 2,
      ml_product_id: 'MLB234567',
      title: 'Whey Protein Concentrado 900g — Baunilha',
      photo_url: 'https://placehold.co/400x400/f3f4f6/9ca3af?text=Produto',
      gemini_description:
        'Proteína de alta qualidade com 20g por dose. Ótima solubilidade e sabor agradável, ideal para recuperação pós-treino.',
      store: 'mercadolivre',
      created_at: '2026-05-25T09:05:00Z',
    },
    niche: { id: 1, title: 'Gym & Sports', ml_category_id: 1276 },
  },
  {
    id: 3,
    product_id: 3,
    niche_id: 1,
    original_price: 259.00,
    promo_price: 189.00,
    affiliate_url: 'https://mercadolivre.com.br/p/MLB345678',
    created_at: '2026-05-25T10:10:00Z',
    expires_at: null,
    product: {
      id: 3,
      ml_product_id: 'MLB345678',
      title: 'Garrafa Térmica Stanley 1L Inox',
      photo_url: 'https://placehold.co/400x400/f3f4f6/9ca3af?text=Produto',
      gemini_description:
        'Mantém bebidas quentes por 7h e frias por 9h. Aço inoxidável de grau alimentício com tampa antivazamento.',
      store: 'mercadolivre',
      created_at: '2026-05-25T09:10:00Z',
    },
    niche: { id: 1, title: 'Gym & Sports', ml_category_id: 1276 },
  },
]
