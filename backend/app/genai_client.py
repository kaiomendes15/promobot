# The async client (.aio) is used throughout so it doesn't block FastAPI's event loop.
# Usage:
#   from app.genai_client import generate_product_description
#   description = await generate_product_description(title="Tênis Nike Air Max", price=499.90)

import os
from google import genai

# ---------------------------------------------------------------------------
# Client
# ---------------------------------------------------------------------------

# google.genai.Client reads GEMINI_API_KEY from the environment.
# The `.aio` accessor returns the async version of every method,
# which is what we need inside async FastAPI route handlers and workers.
_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY")).aio

# Model used for text generation.
# gemini-2.0-flash is fast and cheap; swap to gemini-1.5-pro for higher quality.
_MODEL = "gemini-3-flash-preview"

# ---------------------------------------------------------------------------
# Public helper
# ---------------------------------------------------------------------------

async def generate_product_description(title: str, original_price: float, promotional_price: float) -> str:
    """
    Ask Gemini to write a short promotional description for a product.

    Args:
        title:  Product title as returned by the Mercado Livre API.
        original_price:  Original price in BRL.
        promotional_price:  Promotional price in BRL.

    Returns:
        A plain-text description (≤ 3 sentences) suitable for display in the app.
        Falls back to an empty string if the API call fails, so callers never crash.
    """
    discount_pct = round(100 * (original_price - promotional_price) / original_price)

    prompt = (
        f"Você é um copywriter de grupos de promoções no WhatsApp/Telegram.\n"
        f"Gere um anúncio promocional CURTÍSSIMO (máximo 3 linhas) no estilo dos exemplos abaixo.\n\n"
        f"Regras obrigatórias:\n"
        f"- Linha 1: frase de impacto em CAIXA ALTA + emoji relevante ao produto (ex: 💪 para suplementos, 🔊 para som, 👟 para tênis)\n"
        f"- Linha 2: nome do produto exatamente como fornecido\n"
        f"- Linha 3: preço com 💵 — se houver desconto relevante (≥10%), mostre 'De R$ X por R$ Y'\n"
        f"- NÃO inclua URLs, nome de loja, frete ou informações extras\n"
        f"- NÃO use markdown, asteriscos ou formatação extra\n\n"
        f"Exemplos:\n"
        f"A BRABA DA GROWTH\n"
        f"💪 Creatina Monohidratada 250g Growth Supplements\n"
        f"💵 Por R$ 39,90 COM UM DESCONTO DESSE JÁ LEVA LOGO 2KG\n\n"
        f"SOM DE FESTA EM QUALQUER LUGAR\n"
        f"🔊 JBL Caixa de Som Boombox 3 Bluetooth\n"
        f"💵 De R$ 1.709 por R$ 899 em até 12x sem juros\n\n"
        f"Agora gere para:\n"
        f"Produto: {title}\n"
        f"Preço original: R$ {original_price:.2f}\n"
        f"Preço promocional: R$ {promotional_price:.2f}\n"
        f"Desconto: {discount_pct}%"
    )

    try:
        response = await _client.models.generate_content(
            model=_MODEL,
            contents=prompt,
        )
        # response.text is a convenience accessor for the first candidate's text.
        return response.text.strip()
    except Exception as exc:
        import traceback
        traceback.print_exc()
        print(f"[genai] Failed to generate description for '{title}': {exc}")
        return ""
