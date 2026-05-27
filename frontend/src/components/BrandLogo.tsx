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
    <span className={['font-display', sizeClasses[size], className].join(' ')}>
      <span className="text-zinc-100">PROMO</span>
      <span className="text-amber-400">BOT</span>
    </span>
  )
}
