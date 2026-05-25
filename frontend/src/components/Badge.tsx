import type { HTMLAttributes, ReactNode } from 'react'

type BadgeVariant = 'purple' | 'gray' | 'green' | 'red' | 'amber'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  children: ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  purple: 'bg-violet-100 text-violet-700 border-violet-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
  green: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  red: 'bg-red-100 text-red-700 border-red-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
}

export function Badge({
  variant = 'purple',
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
