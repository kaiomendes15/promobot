export interface Niche {
  id: number
  title: string
  ml_category_id: number
}

export interface Product {
  id: number
  ml_product_id: string
  title: string
  photo_url: string | null
  gemini_description: string | null
  store: string
  created_at: string
}

export interface Promotion {
  id: number
  product_id: number
  niche_id: number
  original_price: number
  promo_price: number
  affiliate_url: string
  created_at: string
  expires_at: string | null
  product: Product
  niche: Niche
}

export interface User {
  id: number
  email: string
  username: string
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}