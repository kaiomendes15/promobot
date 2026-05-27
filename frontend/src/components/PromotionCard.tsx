import { Badge } from './Badge'

interface PromotionCardProps {
  title: string
  photoUrl: string
  originalPrice: number
  promoPrice: number
  affiliateUrl: string
  niche?: string
  geminiDescription?: string
  store?: string
}

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function discountPercent(original: number, promo: number) {
  return Math.round(((original - promo) / original) * 100)
}

export function PromotionCard({
  title,
  photoUrl,
  originalPrice,
  promoPrice,
  affiliateUrl,
  niche,
  geminiDescription,
  store,
}: PromotionCardProps) {
  const discount = discountPercent(originalPrice, promoPrice)

  return (
    <div className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden transition-all duration-250 hover:border-amber-400/25 hover:shadow-[0_0_40px_rgba(245,158,11,0.07)]">
      <div className="relative bg-zinc-800 flex items-center justify-center h-48">
        <img src={photoUrl} alt={title} className="h-full w-full object-contain p-4 opacity-90 group-hover:opacity-100 transition-opacity duration-200" />
        {discount > 0 && (
          <span className="absolute top-3 right-3 bg-amber-400 text-zinc-950 text-xs font-bold px-2 py-1 rounded-full font-display">
            -{discount}%
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 p-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-zinc-100 line-clamp-2 leading-snug">
            {title}
          </h3>
          {niche && <Badge variant="amber">{niche}</Badge>}
        </div>

        {geminiDescription && (
          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
            {geminiDescription}
          </p>
        )}

        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-xl font-bold text-amber-400 font-display">
            {formatPrice(promoPrice)}
          </span>
          {originalPrice > promoPrice && (
            <span className="text-sm text-zinc-600 line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        {store && <p className="text-xs text-zinc-600">Vendido por {store}</p>}

        <a
          href={affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center justify-center rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-300 active:bg-amber-500 transition-colors duration-150 font-display"
        >
          Ver oferta
        </a>
      </div>
    </div>
  )
}
