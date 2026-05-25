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
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="relative bg-gray-50 flex items-center justify-center h-48">
        <img
          src={photoUrl}
          alt={title}
          className="h-full w-full object-contain p-4"
        />
        {discount > 0 && (
          <span className="absolute top-3 right-3 bg-violet-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
            -{discount}%
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 p-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
            {title}
          </h3>
          {niche && <Badge variant="purple">{niche}</Badge>}
        </div>

        {geminiDescription && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {geminiDescription}
          </p>
        )}

        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-xl font-bold text-violet-600">
            {formatPrice(promoPrice)}
          </span>
          {originalPrice > promoPrice && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        {store && (
          <p className="text-xs text-gray-400">Vendido por {store}</p>
        )}

        <a
          href={affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 active:bg-violet-800 transition-colors duration-150"
        >
          Ver oferta
        </a>
      </div>
    </div>
  )
}
