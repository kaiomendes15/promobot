import type { HTMLAttributes, ReactNode } from 'react'

type BadgeVariant = 'purple' | 'gray' | 'green' | 'red' | 'amber'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  children: ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  purple: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  gray:   'bg-zinc-800 text-zinc-400 border-zinc-700',
  green:  'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  red:    'bg-rose-500/10 text-rose-300 border-rose-500/20',
  amber:  'bg-amber-400/10 text-amber-300 border-amber-400/20',
}

export function Badge({ variant = 'amber', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium font-display',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
