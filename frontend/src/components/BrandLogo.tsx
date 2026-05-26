interface BrandLogoProps {
  size?: 'sm' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'text-xl font-bold tracking-tight',
  lg: 'text-5xl font-black tracking-widest',
}

export function BrandLogo({ size = 'sm', className = '' }: BrandLogoProps) {
  return (
    <span
      className={[sizeClasses[size], className].join(' ')}
      style={{ textShadow: '0 2px 6px rgba(0,0,0,0.10)' }}
    >
      <span className="text-gray-900">PROMO</span>
      <span className="text-violet-600">BOT</span>
    </span>
  )
}
