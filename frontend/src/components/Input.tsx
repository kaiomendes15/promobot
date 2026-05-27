import type { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  id,
  className = '',
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-zinc-500 pointer-events-none">
            {leftIcon}
          </span>
        )}

        <input
          id={inputId}
          {...props}
          className={[
            'w-full rounded-lg border bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100',
            'placeholder:text-zinc-600',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/50',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            error
              ? 'border-rose-500/60 focus:ring-rose-500/30'
              : 'border-zinc-700 hover:border-zinc-600',
            leftIcon ? 'pl-9' : '',
            rightIcon ? 'pr-9' : '',
            className,
          ].join(' ')}
        />

        {rightIcon && (
          <span className="absolute right-3 text-zinc-500 pointer-events-none">
            {rightIcon}
          </span>
        )}
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}
      {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}
